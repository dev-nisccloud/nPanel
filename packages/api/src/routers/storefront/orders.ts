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
import { niscProductPlan, niscProduct } from "@npanel/db/schema/products";
import { domainTransferRequest } from "@npanel/db/schema/domain-transfer-requests";
import { paymentTransaction } from "@npanel/db/schema/payment-transactions";
import { publicProcedure, router } from "../../trpc";
import { verifyStorefrontTokenOrThrow } from "../../lib/storefront-token";
import { resolveActiveNiscProductById } from "../../lib/planless-product-resolver";
import { enqueueNiscOrderProcessing } from "../../lib/qstash/nisc-order-worker";
import { processNiscOrder } from "../../lib/nisc-order-processor";
import { runPreProvisioningInvoiceForOrder } from "../../lib/nisc-order-invoice-delivery";
import {
  resolveStorefrontCartQuoteInput,
  storefrontCartQuoteRequestSchema,
} from "../../lib/storefront-cart-resolve";

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
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  /** For domain-inclusive plans. */
  primaryDomain: z.string().optional(),
  /** Full cart payload — required for domain transfers (EPP code). */
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

      // 3. Fetch product and optional plan details for the order item
      let product = await resolveActiveNiscProductById(input.productId);
      const resolvedCart = input.cart
        ? resolveStorefrontCartQuoteInput(input.cart)
        : null;

      if (
        resolvedCart?.main.serviceType === "domain_transfer" &&
        (!product || product.serviceType !== "domain_transfer")
      ) {
        const [transferProduct] = await db
          .select()
          .from(niscProduct)
          .where(
            and(
              eq(niscProduct.isActive, true),
              eq(niscProduct.serviceType, "domain_transfer"),
            ),
          )
          .limit(1);
        if (transferProduct) product = transferProduct;
      }

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The selected product is no longer available.",
        });
      }

      const isDomainTransfer =
        product.serviceType === "domain_transfer" ||
        resolvedCart?.main.serviceType === "domain_transfer";
      let transferAuthCode: string | undefined;
      let transferProvider: "kenic" | "openprovider" | undefined;

      if (isDomainTransfer) {
        transferAuthCode = resolvedCart?.transferAuthCode?.trim();
        transferProvider = resolvedCart?.main.transferProvider;
        if (!transferAuthCode) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Domain transfer requires an authorization (EPP) code.",
          });
        }
        if (!input.primaryDomain?.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Domain transfer requires a domain name.",
          });
        }
      }

      const plan = input.planId
        ? await db.query.niscProductPlan.findFirst({
            where: and(
              eq(niscProductPlan.id, input.planId),
              eq(niscProductPlan.isActive, true),
            ),
            columns: {
              id: true,
              name: true,
              monthlyPrice: true,
              yearlyPrice: true,
            },
          })
        : null;

      if (input.planId && !plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The selected plan is no longer available.",
        });
      }

      const isDomainProduct =
        product.serviceType === "domain_registration" ||
        product.serviceType === "domain_transfer" ||
        product.serviceType === "domains" ||
        product.serviceType.toLowerCase().includes("domain");

      if (isDomainProduct && !isDomainTransfer && !input.primaryDomain?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Domain registration requires a domain name.",
        });
      }
      // 4. Resolve the canonical item price (from the payment amount actually paid)
      const paidAmountRaw = tx.paidAmount ?? tx.amount;
      const itemPrice = String(Math.ceil(Number.parseFloat(paidAmountRaw)));
      const currency = tx.currency ?? "KES";
      const now = new Date();
      const orderNumber = generateNiscOrderNumber();
      const orderId = crypto.randomUUID();
      const orderItemId = crypto.randomUUID();
      let domainTransferRequestId: string | null = null;

      if (isDomainTransfer && transferAuthCode) {
        const domainName = input.primaryDomain!.trim().toLowerCase();
        const provider =
          transferProvider === "kenic"
            ? "KENIC"
            : transferProvider === "openprovider"
              ? "OPENPROVIDER"
              : domainName.endsWith(".ke") || domainName.includes(".co.ke")
                ? "KENIC"
                : "OPENPROVIDER";
        domainTransferRequestId = crypto.randomUUID();
        await db.insert(domainTransferRequest).values({
          id: domainTransferRequestId,
          domainName,
          authCode: transferAuthCode,
          provider,
          status: "PENDING",
          providerPriceAmount:
            resolvedCart?.main.providerPriceAmount != null
              ? String(resolvedCart.main.providerPriceAmount)
              : null,
          providerPriceCurrency: resolvedCart?.main.providerPriceCurrency ?? null,
          customerPriceAmount: itemPrice,
          customerPriceCurrency: currency,
          teamId,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
        });
      }

      // 5. Create the order and order item in a single transaction
      await db.transaction(async (trx) => {
        await trx.insert(niscOrder).values({
          id: orderId,
          orderNumber,
          userId,
          teamId,
          createdBy: userId,
          paymentTransactionId: tx.id,
          status: "PENDING",
          subtotal: itemPrice,
          total: itemPrice,
          currency,
          createdAt: now,
          updatedAt: now,
        });

        await trx.insert(niscOrderItem).values({
          id: orderItemId,
          niscOrderId: orderId,
          productId: product.id,
          productPlanId: plan?.id ?? null,
          billingCycle: input.billingCycle,
          primaryDomain: input.primaryDomain?.trim() || null,
          description: isDomainTransfer ? "transfer" : null,
          metadata: isDomainTransfer
            ? {
                transferAuthCode,
                domainTransferRequestId,
              }
            : null,
          itemPrice,
          itemSubtotal: itemPrice,
          status: "PENDING",
          createdAt: now,
          updatedAt: now,
        });
      });

      if (domainTransferRequestId) {
        await db
          .update(domainTransferRequest)
          .set({ niscOrderId: orderId, updatedAt: new Date() })
          .where(eq(domainTransferRequest.id, domainTransferRequestId));
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
