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
	resolveStorefrontCartQuoteInput,
	storefrontCartQuoteRequestSchema,
} from "../../lib/storefront-cart-resolve";
import { verifyStorefrontPriceQuote } from "../../lib/storefront-price-quote";
import { createMpesaClientFromEnv, MpesaApiError } from "../payment-gateway/mpesa/client";
import { queryStkPushForUser } from "../payment-gateway/mpesa/query-stk-push-status";
import {
	getUserFriendlyErrorMessage,
	isProcessingResultCode,
	isTerminalResultCode,
} from "../payment-gateway/mpesa/error-codes";
import {
	createJengaClientFromEnv,
	formatJengaPhone,
	generateJengaOrderReference,
	JengaApiError,
} from "../payment-gateway/jenga/client";
import { getJengaUserFriendlyError } from "../payment-gateway/jenga/error-codes";
import { jengaCustomerFieldsSchema } from "../payment-gateway/jenga/types";
import type { JengaPaymentMetadata } from "../payment-gateway/jenga/types";
import { parseJengaMetadata } from "../payment-gateway/jenga/apply-payment-update";
import { and, eq } from "@npanel/db";
import {
  assertPaystackCurrencyEnabled,
  initializePaystackTransaction,
  PaystackError,
} from "../payment-gateway/paystack/client";
import { reconcilePaystackPayment } from "../payment-gateway/paystack/reconcile";
import { getTrustedCountryCodeSync } from "@npanel/location";
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
  quoteToken: z.string().min(1),
});
const pollPaymentStatusInputSchema = z.object({
  storefrontToken: z.string().min(1),
  checkoutRequestId: z.string().min(1),
});

const queryStkPushInputSchema = z.object({
  storefrontToken: z.string().min(1),
  checkoutRequestId: z.string().min(1),
});

const initiateJengaCheckoutInputSchema = z.object({
  storefrontToken: z.string().min(1),
  cart: storefrontCartQuoteRequestSchema,
  quoteToken: z.string().min(1),
  customer: jengaCustomerFieldsSchema,
  /** Origin of the storefront tab that started checkout (window.location.origin). */
  returnOrigin: z.string().url(),
  returnPath: z.string().optional(),
});

const getJengaPaymentStatusInputSchema = z.object({
  storefrontToken: z.string().min(1),
  orderReference: z.string().min(8),
});
const initiatePaystackInputSchema = z.object({
  storefrontToken: z.string().min(1),
  cart: storefrontCartQuoteRequestSchema,
  quoteToken: z.string().min(1),
  email: z.string().email(),
});
const getPaystackPaymentStatusInputSchema = z.object({
  storefrontToken: z.string().min(1),
  reference: z.string().min(8).max(100),
});

function requireLockedQuote(
  quoteToken: string,
  resolved: ReturnType<typeof resolveStorefrontCartQuoteInput>,
) {
  const verified = verifyStorefrontPriceQuote(quoteToken, resolved);
  if (!verified.ok) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        verified.reason === "expired"
          ? "Your price quote has expired. Refresh pricing and try again."
          : "The price quote does not match this cart. Refresh pricing and try again.",
    });
  }
  return verified.payload;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const storefrontPaymentRouter = router({
  getPaystackAvailability: publicProcedure.query(() => ({
    enabled: process.env.PAYSTACK_ENABLED === "true",
    usdEnabled:
      process.env.PAYSTACK_ENABLED === "true" &&
      process.env.PAYSTACK_USD_ENABLED === "true",
    kesEnabled:
      process.env.PAYSTACK_ENABLED === "true" &&
      process.env.PAYSTACK_KES_ENABLED === "true",
  })),

  initiatePaystackCheckout: publicProcedure
    .input(initiatePaystackInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, teamId, teamSlug } = verifyStorefrontTokenOrThrow(
        input.storefrontToken,
      );
      const resolved = resolveStorefrontCartQuoteInput(input.cart);
      const ipCountry = getTrustedCountryCodeSync(ctx.req.raw.headers);
      const quote = requireLockedQuote(input.quoteToken, resolved);
      try {
        assertPaystackCurrencyEnabled(quote.currency);
      } catch (error) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            error instanceof Error ? error.message : "Card checkout is unavailable",
        });
      }
      if (quote.currency === "USD" && quote.total < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "USD card payments must be at least USD 2.00.",
        });
      }

      const amountMinor = Math.round(quote.total * 100);
      const transactionId = crypto.randomUUID();
      const reference =
        `NISC-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
      const now = new Date();
      const metadata = {
        source: "storefront",
        orderReference: reference,
        teamId,
        teamSlug,
        currency: quote.currency,
        cart: input.cart,
        planId: resolved.main.planId,
        productId: resolved.main.productId,
        billingCycle: resolved.main.billingCycle,
        primaryDomain:
          resolved.upsellDomain?.domain || resolved.main.bundleDomains?.[0],
        quoteToken: input.quoteToken,
        billingCountry: resolved.billingCountry,
        ipCountry,
        taxPolicyId: quote.taxPolicyId,
        taxRate: String(quote.taxRate),
        taxEvidence: {
          billingCountry: resolved.billingCountry ?? null,
          ipCountry,
          paymentCountry: null,
          mismatch: quote.taxEvidenceMismatch,
        },
        quote,
      };

      await db.insert(paymentTransaction).values({
        id: transactionId,
        userId,
        teamId,
        gateway: "PAYSTACK",
        gatewayStatus: "INITIALIZING",
        checkoutRequestId: reference,
        accountReference: reference,
        amount: quote.total.toFixed(2),
        currency: quote.currency,
        sourceAmount: String(quote.sourceTotal),
        sourceCurrency: quote.sourceCurrency,
        fxRate: String(quote.fxRate),
        fxProvider: quote.fxProvider,
        fxTimestamp: new Date(quote.fxTimestamp),
        fxExpiresAt: new Date(quote.exp),
        quoteToken: input.quoteToken,
        billingCountry: resolved.billingCountry,
        ipCountry,
        taxPolicyId: quote.taxPolicyId,
        taxRate: String(quote.taxRate),
        taxEvidence: {
          billingCountry: resolved.billingCountry ?? null,
          ipCountry,
          paymentCountry: null,
          mismatch: quote.taxEvidenceMismatch,
        },
        transactionDesc: "NiscCloud storefront checkout",
        status: "PENDING",
        metadata,
        initiatedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      try {
        const initialized = await initializePaystackTransaction({
          email: input.email,
          amountMinor,
          currency: quote.currency,
          reference,
          transactionId,
        });
        await db
          .update(paymentTransaction)
          .set({
            gatewayStatus: "INITIALIZED",
            rawResponse: {
              reference: initialized.reference,
              accessCodeIssued: true,
            },
            updatedAt: new Date(),
          })
          .where(eq(paymentTransaction.id, transactionId));
        return {
          reference,
          accessCode: initialized.access_code,
          amount: quote.total,
          currency: quote.currency,
        };
      } catch (error) {
        await db
          .update(paymentTransaction)
          .set({
            status: "FAILED",
            gatewayStatus: "INITIALIZATION_FAILED",
            gatewayMessage:
              error instanceof Error ? error.message : "Paystack initialization failed",
            failedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(paymentTransaction.id, transactionId));
        if (error instanceof PaystackError) {
          throw new TRPCError({
            code: error.retryable ? "TIMEOUT" : "BAD_REQUEST",
            message: error.message,
          });
        }
        throw error;
      }
    }),

  getPaystackPaymentStatus: publicProcedure
    .input(getPaystackPaymentStatusInputSchema)
    .query(async ({ input }) => {
      const { userId } = verifyStorefrontTokenOrThrow(input.storefrontToken);
      const transaction = await db.query.paymentTransaction.findFirst({
        where: and(
          eq(paymentTransaction.gateway, "PAYSTACK"),
          eq(paymentTransaction.checkoutRequestId, input.reference),
          eq(paymentTransaction.userId, userId),
        ),
      });
      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
      }
      if (
        transaction.status === "PENDING" ||
        transaction.status === "PROCESSING"
      ) {
        const reconciled = await reconcilePaystackPayment(input.reference);
        return { status: reconciled.status, reference: input.reference };
      }
      return { status: transaction.status, reference: input.reference };
    }),

  /**
   * Initiate an M-Pesa STK Push for a storefront checkout session.
   *
   * The payable amount is always computed server-side from the cart payload.
   */
  initiateStkPush: publicProcedure
    .input(initiateStkPushInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, teamId, teamSlug } = verifyStorefrontTokenOrThrow(input.storefrontToken);

      const resolved = resolveStorefrontCartQuoteInput(input.cart);
      const ipCountry = getTrustedCountryCodeSync(ctx.req.raw.headers);
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

      const quote = requireLockedQuote(input.quoteToken, resolved);
      if (quote.currency !== "KES") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "M-Pesa is available only for KES checkout.",
        });
      }
      const amount = Math.ceil(quote.total);
      if (amount < 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payment amount.",
        });
      }

      const planLabel = resolved.main.planName || "Storefront checkout";
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
          sourceAmount: String(quote.sourceTotal),
          sourceCurrency: quote.sourceCurrency,
          fxRate: String(quote.fxRate),
          fxProvider: quote.fxProvider,
          fxTimestamp: new Date(quote.fxTimestamp),
          fxExpiresAt: new Date(quote.exp),
          quoteToken: input.quoteToken,
          billingCountry: resolved.billingCountry,
          ipCountry,
          paymentCountry: "KE",
          taxPolicyId: quote.taxPolicyId,
          taxRate: String(quote.taxRate),
          taxEvidence: {
            billingCountry: resolved.billingCountry ?? null,
            ipCountry,
            paymentCountry: "KE",
            mismatch: quote.taxEvidenceMismatch,
          },
          accountReference: accountRef,
          transactionDesc: "NiscCloud",
          phoneNumber: input.phone,
          status: response.ResponseCode === "0" ? "PROCESSING" : "PENDING",
          rawResponse: JSON.parse(JSON.stringify(response)),
          metadata: {
            source: "storefront",
            orderReference: response.CheckoutRequestID,
            teamId,
            teamSlug,
            currency: "KES",
            cart: input.cart,
            planId: resolved.main.planId,
            productId: resolved.main.productId,
            billingCycle: resolved.main.billingCycle,
            primaryDomain:
              resolved.upsellDomain?.domain || resolved.main.bundleDomains?.[0],
            quoteToken: input.quoteToken,
            quote,
          },
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

  /**
   * Initiate Jenga hosted card checkout for storefront cart.
   * Amount is always recomputed server-side from the cart payload.
   */
  initiateJengaCheckout: publicProcedure
    .input(initiateJengaCheckoutInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, teamId, teamSlug } = verifyStorefrontTokenOrThrow(input.storefrontToken);

      const resolved = resolveStorefrontCartQuoteInput(input.cart);
      const ipCountry = getTrustedCountryCodeSync(ctx.req.raw.headers);
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

      const quote = requireLockedQuote(input.quoteToken, resolved);
      if (quote.currency !== "KES") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Jenga checkout is currently available only for KES.",
        });
      }
      const amount = Math.ceil(quote.total);
      if (amount < 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payment amount.",
        });
      }

      const planLabel = resolved.main.planName || "Storefront checkout";
      const orderReference = generateJengaOrderReference();
      const phone = formatJengaPhone(input.customer.customerPhone);
      const now = new Date();
      const paymentTimeLimit = process.env.JENGA_PAYMENT_TIME_LIMIT || "15mins";

      const metadata: JengaPaymentMetadata = {
        orderReference,
        source: "storefront",
        returnOrigin: input.returnOrigin,
        returnPath: input.returnPath || "/cart",
        customer: {
          firstName: input.customer.customerFirstName,
          lastName: input.customer.customerLastName,
          email: input.customer.customerEmail,
          phone,
          address: input.customer.customerAddress,
          postalCode: input.customer.customerPostalCodeZip,
          countryCode: input.customer.countryCode,
        },
        currency: "KES",
        teamId: teamId ?? undefined,
        teamSlug,
        cart: input.cart,
        planId: resolved.main.planId,
        productId: resolved.main.productId,
        billingCycle: resolved.main.billingCycle,
        primaryDomain:
          resolved.upsellDomain?.domain || resolved.main.bundleDomains?.[0],
        quoteToken: input.quoteToken,
        quote,
      };

      const extraData = JSON.stringify({
        source: "storefront",
        returnOrigin: metadata.returnOrigin,
        returnPath: metadata.returnPath,
        orderReference,
      });

      try {
        const jenga = createJengaClientFromEnv();
        const { checkoutUrl, paymentData } = await jenga.initiateCardPayment({
          orderAmount: amount,
          orderReference,
          currency: "KES",
          productType: "Service",
          productDescription: planLabel.slice(0, 200),
          paymentTimeLimit,
          customerFirstName: input.customer.customerFirstName,
          customerLastName: input.customer.customerLastName,
          customerEmail: input.customer.customerEmail,
          customerPhone: phone,
          customerAddress: input.customer.customerAddress,
          customerPostalCodeZip: input.customer.customerPostalCodeZip,
          countryCode: input.customer.countryCode,
          extraData,
          // Echoed on IPN as customer.reference in some Jenga payloads
          secondaryReference: orderReference,
        });

        const transactionId = crypto.randomUUID();
        await db.insert(paymentTransaction).values({
          id: transactionId,
          userId,
          teamId,
          gateway: "JENGA",
          gatewayStatus: "INITIATED",
          gatewayMessage: "Storefront card checkout initiated",
          checkoutRequestId: orderReference,
          amount: amount.toFixed(2),
          currency: "KES",
          sourceAmount: String(quote.sourceTotal),
          sourceCurrency: quote.sourceCurrency,
          fxRate: String(quote.fxRate),
          fxProvider: quote.fxProvider,
          fxTimestamp: new Date(quote.fxTimestamp),
          fxExpiresAt: new Date(quote.exp),
          quoteToken: input.quoteToken,
          billingCountry: input.customer.countryCode,
          ipCountry,
          taxPolicyId: quote.taxPolicyId,
          taxRate: String(quote.taxRate),
          taxEvidence: {
            billingCountry: input.customer.countryCode,
            ipCountry,
            paymentCountry: null,
            mismatch: quote.taxEvidenceMismatch,
          },
          accountReference: orderReference,
          transactionDesc: "NiscCloud",
          phoneNumber: phone,
          status: "PENDING",
          rawResponse: { checkoutUrl, orderReference },
          metadata: metadata as unknown as Record<string, unknown>,
          initiatedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        await db.insert(paymentTransactionActivityLog).values({
          id: crypto.randomUUID(),
          transactionId,
          userId,
          action: "INITIATE",
          description: `Storefront Jenga card checkout. Plan: ${planLabel}`,
          metadata: {
            orderReference,
            amount,
            planId: resolved.main.planId ?? null,
            billingCycle: resolved.main.billingCycle,
          },
          ipAddress: null,
          userAgent: null,
          createdAt: now,
        });

        return {
          orderReference,
          checkoutUrl,
          paymentData,
          message: "Redirecting to secure card payment…",
        };
      } catch (error) {
        if (error instanceof JengaApiError) {
          throw new TRPCError({
            code: error.retryable ? "TIMEOUT" : "BAD_REQUEST",
            message:
              error.errorInfo?.userMessage ||
              getJengaUserFriendlyError(error.code) ||
              "Card payment initiation failed. Please try again.",
          });
        }
        if (error instanceof TRPCError) throw error;
        console.error("[Storefront][Jenga] initiate error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initiate card payment. Please try again.",
        });
      }
    }),

  /**
   * Poll Jenga payment status (DB only; updated by callback/IPN).
   */
  getJengaPaymentStatus: publicProcedure
    .input(getJengaPaymentStatusInputSchema)
    .query(async ({ input }) => {
      const { userId } = verifyStorefrontTokenOrThrow(input.storefrontToken);

      const transaction = await db.query.paymentTransaction.findFirst({
        where: and(
          eq(paymentTransaction.checkoutRequestId, input.orderReference),
          eq(paymentTransaction.gateway, "JENGA"),
          eq(paymentTransaction.userId, userId),
        ),
      });

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      const metadata = parseJengaMetadata(transaction.metadata);

      return {
        status: transaction.status as
          | "PENDING"
          | "PROCESSING"
          | "SUCCESS"
          | "FAILED"
          | "CANCELLED",
        orderReference: input.orderReference,
        amount: transaction.amount,
        paidAmount: transaction.paidAmount,
        currency: transaction.currency,
        failureReason:
          transaction.status === "FAILED" || transaction.status === "CANCELLED"
            ? transaction.gatewayMessage || "Payment was not completed."
            : undefined,
        orderIntent: metadata
          ? {
              cart: metadata.cart,
              planId: metadata.planId,
              productId: metadata.productId,
              billingCycle: metadata.billingCycle,
              primaryDomain: metadata.primaryDomain,
              quoteToken: metadata.quoteToken,
            }
          : null,
      };
    }),
});
