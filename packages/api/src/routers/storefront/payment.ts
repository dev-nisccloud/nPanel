/**
 * Storefront payment procedures.
 *
 * All procedures here are gated by a storefrontToken  a short-lived HMAC-signed
 * token issued at registration time. No full session is required.
 *
 * - initiateStkPush: initiate M-Pesa STK Push for the checkout session
 * - pollPaymentStatus / queryStkPush: Daraja-first status (instant terminal feedback)
 *
 * Security:
 *  • Token is verified on every call (signature + expiry).
 *  • Checkout amount is always re-computed server-side from the cart payload.
 *  • Returns minimal data  no transaction IDs, no raw M-Pesa fields.
 */

import * as crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@npanel/db";
import { paymentTransaction, paymentTransactionActivityLog } from "@npanel/db/schema/payment-transactions";
import { publicProcedure, router } from "../../trpc";
import { verifyStorefrontTokenOrThrow } from "../../lib/storefront-token";
import {
	computeStorefrontCartQuote,
} from "../../lib/storefront-cart-pricing";
import {
	resolveStorefrontCartQuoteInput,
	storefrontCartQuoteRequestSchema,
} from "../../lib/storefront-cart-resolve";
import { createMpesaClientFromEnv, MpesaApiError } from "../payment-gateway/mpesa/client";
import { queryStkPushForUser } from "../payment-gateway/mpesa/query-stk-push-status";
import {
	getUserFriendlyErrorMessage,
	isProcessingResultCode,
	isTerminalResultCode,
} from "../payment-gateway/mpesa/error-codes";
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const initiateStkPushInputSchema = z.object({
  storefrontToken: z.string().min(1),
  phone: z
    .string()
    .min(9)
    .max(20)
    .regex(/^[+\d\s()-]+$/, "Invalid phone number"),
  /** Full cart state  amount is computed server-side from this payload. */
  cart: storefrontCartQuoteRequestSchema,
});
const pollPaymentStatusInputSchema = z.object({
  storefrontToken: z.string().min(1),
  checkoutRequestId: z.string().min(1),
});

const queryStkPushInputSchema = z.object({
  storefrontToken: z.string().min(1),
  checkoutRequestId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const storefrontPaymentRouter = router({
  /**
   * Initiate an M-Pesa STK Push for a storefront checkout session.
   *
   * The payable amount is always computed server-side from the cart payload.
   */
  initiateStkPush: publicProcedure
    .input(initiateStkPushInputSchema)
    .mutation(async ({ input }) => {
      const { userId, teamId } = verifyStorefrontTokenOrThrow(input.storefrontToken);

      const resolved = resolveStorefrontCartQuoteInput(input.cart);
      const hivelocityTypes = new Set(["vps", "vds", "dedicated_servers"]);
      if (
        hivelocityTypes.has(resolved.main.serviceType) &&
        !resolved.hivelocity?.selectedOsId
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complete server configuration before payment.",
        });
      }

      const domainRequiredHosting = new Set([
        "web_hosting",
        "wordpress_hosting",
        "email_hosting",
      ]);
      if (
        domainRequiredHosting.has(resolved.main.serviceType) &&
        !resolved.upsellDomain?.domain?.trim()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Add a domain before payment  register, transfer, or connect one you already own.",
        });
      }

      if (resolved.main.serviceType === "domain_transfer") {
        const authCode = resolved.transferAuthCode?.trim();
        if (!authCode) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Enter your domain authorization (EPP) code before payment.",
          });
        }
      }

      if (resolved.upsellDomain?.isTransfer) {
        const authCode = resolved.transferAuthCode?.trim();
        if (!authCode) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Enter your domain authorization (EPP) code before payment.",
          });
        }
      }

      const quote = await computeStorefrontCartQuote(resolved);
      const amount = Math.ceil(quote.total);
      if (amount < 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payment amount.",
        });
      }

      const planLabel = quote.planName || "Storefront checkout";
      const planId = resolved.main.planId;
      const billingCycle = resolved.main.billingCycle;
      const now = new Date();
      const mpesa = createMpesaClientFromEnv();
      const accountRef = `NISC${Date.now().toString().slice(-8)}`;

      try {
        const response = await mpesa.initiateStkPush({
          phoneNumber: input.phone,
          amount,
          accountReference: accountRef,
          transactionDesc: "NiscCloud",
        });

        const transactionId = crypto.randomUUID();
        await db.insert(paymentTransaction).values({
          id: transactionId,
          userId,
          teamId,
          gateway: "MPESA",
          gatewayStatus: response.ResponseCode,
          gatewayMessage: response.ResponseDescription,
          merchantRequestId: response.MerchantRequestID,
          checkoutRequestId: response.CheckoutRequestID,
          amount: amount.toString(),
          currency: "KES",
          accountReference: accountRef,
          transactionDesc: "NiscCloud",
          phoneNumber: input.phone,
          status: response.ResponseCode === "0" ? "PROCESSING" : "PENDING",
          rawResponse: JSON.parse(JSON.stringify(response)),
          initiatedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        await db.insert(paymentTransactionActivityLog).values({
          id: crypto.randomUUID(),
          transactionId,
          userId,
          action: "INITIATE",
          description: `Storefront STK Push initiated via landing page. Plan: ${planLabel}`,
          metadata: {
            phoneNumber: input.phone,
            amount,
            planId: planId ?? null,
            billingCycle,
            checkoutRequestId: response.CheckoutRequestID,
          },          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });

        return {
          checkoutRequestId: response.CheckoutRequestID,
          message: response.CustomerMessage ?? "Check your phone for the M-Pesa prompt.",
        };
      } catch (error) {
        if (error instanceof MpesaApiError) {
          throw new TRPCError({
            code: error.retryable ? "TIMEOUT" : "BAD_REQUEST",
            message: error.description || "M-Pesa payment initiation failed. Please try again.",
          });
        }
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initiate payment. Please try again.",
        });
      }
    }),

  /**
   * Query STK push status via Daraja first (instant feedback), same as dashboard buy-now.
   * Falls back to DB when Daraja returns processing codes.
   */
  queryStkPush: publicProcedure
    .input(queryStkPushInputSchema)
    .query(async ({ input }) => {
      const { userId } = verifyStorefrontTokenOrThrow(input.storefrontToken);
      return queryStkPushForUser(input.checkoutRequestId, userId);
    }),

  /**
   * Poll payment status  Daraja-first for instant terminal feedback (wrong PIN, cancelled, etc.).
   *
   * Returns { status, failureReason } for legacy callers; prefer queryStkPush for full result codes.
   */
  pollPaymentStatus: publicProcedure
    .input(pollPaymentStatusInputSchema)
    .query(async ({ input }) => {
      const { userId } = verifyStorefrontTokenOrThrow(input.storefrontToken);

      const result = await queryStkPushForUser(input.checkoutRequestId, userId);
      const resultCode = result.data.resultCode;
      const code =
        typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;

      if (Number.isNaN(code) || isProcessingResultCode(code)) {
        return {
          status: "PROCESSING" as const,
          failureReason: undefined,
        };
      }

      if (code === 0) {
        return { status: "SUCCESS" as const, failureReason: undefined };
      }

      if (code === 1032) {
        return {
          status: "CANCELLED" as const,
          failureReason:
            result.data.resultDesc ??
            getUserFriendlyErrorMessage(code) ??
            "Payment request was cancelled",
        };
      }

      if (isTerminalResultCode(code)) {
        return {
          status: "FAILED" as const,
          failureReason:
            getUserFriendlyErrorMessage(code) ??
            result.data.resultDesc ??
            "Payment was not completed.",
        };
      }

      return {
        status: "FAILED" as const,
        failureReason:
          result.data.resultDesc ??
          getUserFriendlyErrorMessage(code) ??
          "Payment was not completed.",
      };
    }),
});
