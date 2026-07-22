/**
 * Storefront order procedure.
 *
 * After M-Pesa payment is confirmed (status = "SUCCESS"), the landing page calls
 * createFromPayment which:
 *  1. Verifies the storefrontToken
 *  2. Confirms the payment transaction belongs to this user and is SUCCESS
 *  3. Creates the niscOrder + niscOrderItems in a DB transaction
 *  4. Calls enqueueNiscOrderProcessing  IDENTICAL handoff to the existing
 *     order processor (QStash → processNiscOrder).  Nothing changes here.
 *  5. Returns { orderId, orderNumber, teamSlug } so the landing page can
 *     redirect the user to nPanel.
 *
 * Idempotent: a duplicate call with the same checkoutRequestId returns the
 * existing orderId/orderNumber without creating a second order.
 */

import * as crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { niscOrder, niscOrderItem } from "@npanel/db/schema/nisc-orders";
import { domainTransferRequest } from "@npanel/db/schema/domain-transfer-requests";
import { paymentTransaction } from "@npanel/db/schema/payment-transactions";
import { publicProcedure, router } from "../../trpc";
import { verifyStorefrontTokenOrThrow } from "../../lib/storefront-token";
import { enqueueNiscOrderProcessing } from "../../lib/qstash/nisc-order-worker";
import { processNiscOrder } from "../../lib/nisc-order-processor";
import { runPreProvisioningInvoiceForOrder } from "../../lib/nisc-order-invoice-delivery";
import {
  resolveStorefrontCartQuoteInput,
  storefrontCartQuoteRequestSchema,
} from "../../lib/storefront-cart-resolve";
import { buildStorefrontCartOrderLines } from "../../lib/storefront-cart-order-lines";
import { storefrontBillingCycleSchema } from "../../lib/storefront-cart-pricing";

// ---------------------------------------------------------------------------
// Helpers (mirrors nisc-service-orders.ts)
// ---------------------------------------------------------------------------

function generateNiscOrderNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `Nisc-${year}-${timestamp}-${random}`;
}

async function processNiscOrderWithPreInvoice(niscOrderId: string) {
  await runPreProvisioningInvoiceForOrder(niscOrderId);
  return processNiscOrder(niscOrderId);
}

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const createFromPaymentInputSchema = z.object({
  storefrontToken: z.string().min(1),
  checkoutRequestId: z.string().min(1),
  /** The plan the user purchased  optional for planless products (domains, VPS). */
  planId: z.string().optional(),
  productId: z.string().min(1),
  billingCycle: storefrontBillingCycleSchema.default("MONTHLY"),
  /** For domain-inclusive plans. */
  primaryDomain: z.string().optional(),
  /** Full cart payload  required for domain transfers (EPP code). */
  cart: storefrontCartQuoteRequestSchema.optional(),
});
// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const storefrontOrdersRouter = router({
  /**
   * Create a Nisc order from a confirmed M-Pesa payment on the landing page.
   *
   * The order processor handoff (enqueueNiscOrderProcessing) is identical to
   * the dashboard flow. No changes to the processor or QStash pipeline.
   */
  createFromPayment: publicProcedure
    .input(createFromPaymentInputSchema)
    .mutation(async ({ input }) => {
      const { userId, teamId, teamSlug } = verifyStorefrontTokenOrThrow(
        input.storefrontToken,
      );

      // 1. Verify the payment transaction belongs to this user and is SUCCESS
      const [tx] = await db
        .select({
          id: paymentTransaction.id,
          amount: paymentTransaction.amount,
          paidAmount: paymentTransaction.paidAmount,
          currency: paymentTransaction.currency,
          status: paymentTransaction.status,
        })
        .from(paymentTransaction)
        .where(
          and(
            eq(paymentTransaction.checkoutRequestId, input.checkoutRequestId),
            eq(paymentTransaction.userId, userId),
            eq(paymentTransaction.status, "SUCCESS"),
          ),
        )
        .limit(1);

      if (!tx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Payment not found or not yet confirmed. Wait a moment and try again.",
        });
      }

      // 2. Idempotency: return existing order if already created for this payment
      const existingOrder = await db.query.niscOrder.findFirst({
        where: and(
          eq(niscOrder.paymentTransactionId, tx.id),
          eq(niscOrder.userId, userId),
        ),
        columns: { id: true, orderNumber: true },
      });
      if (existingOrder) {
        return {
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          teamSlug,
        };
      }

      // 3. Resolve cart lines and authoritative pricing
      const resolvedCart = input.cart
        ? resolveStorefrontCartQuoteInput(input.cart)
        : null;

      if (!resolvedCart) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Checkout cart payload is required.",
        });
      }

      const { lines, quote } = await buildStorefrontCartOrderLines({
        cart: resolvedCart,
        primaryDomain: input.primaryDomain,
        fallbackProductId: input.productId,
      });

      const paidAmountRaw = tx.paidAmount ?? tx.amount;
      const paidTotal = Math.ceil(Number.parseFloat(paidAmountRaw));
      if (paidTotal !== quote.total) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Paid amount does not match the checkout total. Please refresh and try again.",
        });
      }

      const currency = tx.currency ?? quote.currency ?? "KES";
      const now = new Date();
      const orderNumber = generateNiscOrderNumber();
      const orderId = crypto.randomUUID();

      // Pre-create domain transfer requests for transfer lines
      const transferRequestByLineIndex = new Map<
        number,
        { id: string; domainName: string; authCode: string; provider: string; itemPrice: string }
      >();

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.description !== "transfer") continue;

        const authCode = (line.metadata?.transferAuthCode as string | undefined)?.trim();
        if (!authCode || !line.primaryDomain) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Domain transfer requires an authorization (EPP) code.",
          });
        }

        const domainName = line.primaryDomain.trim().toLowerCase();
        const transferProvider =
          (line.metadata?.transferProvider as "kenic" | "openprovider" | null) ??
          (resolvedCart.main.transferProvider ?? null);
        const provider =
          transferProvider === "kenic"
            ? "KENIC"
            : transferProvider === "openprovider"
              ? "OPENPROVIDER"
              : domainName.endsWith(".ke") || domainName.includes(".co.ke")
                ? "KENIC"
                : "OPENPROVIDER";

        const requestId = crypto.randomUUID();
        await db.insert(domainTransferRequest).values({
          id: requestId,
          domainName,
          authCode,
          provider,
          status: "PENDING",
          providerPriceAmount:
            resolvedCart.main.providerPriceAmount != null
              ? String(resolvedCart.main.providerPriceAmount)
              : null,
          providerPriceCurrency: resolvedCart.main.providerPriceCurrency ?? null,
          customerPriceAmount: String(line.itemPrice),
          customerPriceCurrency: currency,
          teamId,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
        });

        transferRequestByLineIndex.set(i, {
          id: requestId,
          domainName,
          authCode,
          provider,
          itemPrice: String(line.itemPrice),
        });
      }

      // 4. Create the order and all line items
      await db.transaction(async (trx) => {
        await trx.insert(niscOrder).values({
          id: orderId,
          orderNumber,
          userId,
          teamId,
          createdBy: userId,
          paymentTransactionId: tx.id,
          status: "PENDING",
          subtotal: String(quote.subtotal),
          total: String(quote.total),
          currency,
          createdAt: now,
          updatedAt: now,
        });

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          const transferRequest = transferRequestByLineIndex.get(i);
          const metadata =
            transferRequest != null
              ? {
                  transferAuthCode: transferRequest.authCode,
                  domainTransferRequestId: transferRequest.id,
                }
              : line.metadata;

          await trx.insert(niscOrderItem).values({
            id: crypto.randomUUID(),
            niscOrderId: orderId,
            productId: line.productId,
            productPlanId: line.productPlanId,
            billingCycle: line.billingCycle,
            primaryDomain: line.primaryDomain,
            description: line.description,
            metadata,
            itemPrice: String(line.itemPrice),
            itemSubtotal: String(line.itemPrice),
            status: "PENDING",
            createdAt: now,
            updatedAt: now,
          });
        }
      });

      for (const transferRequest of transferRequestByLineIndex.values()) {
        await db
          .update(domainTransferRequest)
          .set({ niscOrderId: orderId, updatedAt: new Date() })
          .where(eq(domainTransferRequest.id, transferRequest.id));
      }

      // 6. Enqueue for processing  IDENTICAL HANDOFF to dashboard flow
      try {
        await enqueueNiscOrderProcessing(orderId);
      } catch {
        // QStash unavailable (local dev without ngrok)  process inline
        const processResult = await processNiscOrderWithPreInvoice(orderId);
        if (!processResult.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              processResult.failureReason ||
              "Order was created but processing failed. Our team has been notified.",
          });
        }
      }

      // 7. Return minimal data for the redirect
      return {
        orderId,
        orderNumber,
        teamSlug,
      };
    }),
});
