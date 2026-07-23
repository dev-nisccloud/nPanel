/**
 * Nisc Payment Gateway - Transactions
 * 
 * Query transaction history with full M-Pesa details
 */

import { z } from "zod";
import { eq, and, desc } from "@npanel/db";

import { protectedProcedure, router } from "../..";
import { db } from "@npanel/db";
import {
  niscPaymentGatewayTransaction,
  niscPaymentGatewayMerchant,
} from "@npanel/db/schema/nisc-payment-gateway";
import { paymentTransaction } from "@npanel/db/schema/payment-transactions";
import {
  assertGatewayReadAccess,
} from "../../lib/nisc-payment-gateway-access";

const listTransactionsSchema = z.object({
  merchantId: z.string(),
  status: z.enum(["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED"]).optional(),
  provider: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const transactionIdSchema = z.object({
  id: z.string(),
});

export const transactionsRouter = router({
  /**
   * List transactions for merchant with full M-Pesa details
   */
  list: protectedProcedure
    .input(listTransactionsSchema)
    .query(async ({ ctx, input }) => {
      // Verify merchant ownership
      const merchant = await db
        .select()
        .from(niscPaymentGatewayMerchant)
        .where(eq(niscPaymentGatewayMerchant.id, input.merchantId))
        .limit(1);

      if (!merchant[0]) {
        throw new Error("Merchant not found");
      }

      // Access control based on role
      assertGatewayReadAccess({
        actorUserId: ctx.session.user.id,
        role: ctx.session.user.role,
        ownerUserId: merchant[0].userId,
        teamId: merchant[0].teamId,
      });

      const conditions = [eq(niscPaymentGatewayTransaction.merchantId, input.merchantId)];

      if (input.status) {
        conditions.push(eq(niscPaymentGatewayTransaction.status, input.status));
      }

      if (input.provider) {
        conditions.push(eq(niscPaymentGatewayTransaction.provider, input.provider));
      }

      // Join with internal payment transaction to get full M-Pesa details
      const transactions = await db
        .select({
          // Gateway transaction fields
          id: niscPaymentGatewayTransaction.id,
          merchantId: niscPaymentGatewayTransaction.merchantId,
          apiKeyId: niscPaymentGatewayTransaction.apiKeyId,
          paymentTransactionId: niscPaymentGatewayTransaction.paymentTransactionId,
          clientReferenceId: niscPaymentGatewayTransaction.clientReferenceId,
          clientMetadata: niscPaymentGatewayTransaction.clientMetadata,
          provider: niscPaymentGatewayTransaction.provider,
          status: niscPaymentGatewayTransaction.status,
          webhookDeliveryStatus: niscPaymentGatewayTransaction.webhookDeliveryStatus,
          createdAt: niscPaymentGatewayTransaction.createdAt,
          updatedAt: niscPaymentGatewayTransaction.updatedAt,
          
          // Internal payment transaction fields (M-Pesa details)
          gateway: paymentTransaction.gateway,
          gatewayStatus: paymentTransaction.gatewayStatus,
          gatewayMessage: paymentTransaction.gatewayMessage,
          merchantRequestId: paymentTransaction.merchantRequestId,
          checkoutRequestId: paymentTransaction.checkoutRequestId,
          receiptNumber: paymentTransaction.receiptNumber,
          amount: paymentTransaction.amount,
          paidAmount: paymentTransaction.paidAmount,
          currency: paymentTransaction.currency,
          accountReference: paymentTransaction.accountReference,
          transactionDesc: paymentTransaction.transactionDesc,
          phoneNumber: paymentTransaction.phoneNumber,
          paymentStatus: paymentTransaction.status,
          rawResponse: paymentTransaction.rawResponse,
          initiatedAt: paymentTransaction.initiatedAt,
          processedAt: paymentTransaction.processedAt,
          failedAt: paymentTransaction.failedAt,
        })
        .from(niscPaymentGatewayTransaction)
        .innerJoin(
          paymentTransaction,
          eq(niscPaymentGatewayTransaction.paymentTransactionId, paymentTransaction.id)
        )
        .where(and(...conditions))
        .orderBy(desc(niscPaymentGatewayTransaction.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        transactions,
        pagination: {
          limit: input.limit,
          offset: input.offset,
          hasMore: transactions.length === input.limit,
        },
      };
    }),

  /**
   * Get transaction details with full M-Pesa information
   */
  getById: protectedProcedure
    .input(transactionIdSchema)
    .query(async ({ ctx, input }) => {
      const result = await db
        .select({
          // Gateway transaction fields
          id: niscPaymentGatewayTransaction.id,
          merchantId: niscPaymentGatewayTransaction.merchantId,
          apiKeyId: niscPaymentGatewayTransaction.apiKeyId,
          paymentTransactionId: niscPaymentGatewayTransaction.paymentTransactionId,
          clientReferenceId: niscPaymentGatewayTransaction.clientReferenceId,
          clientMetadata: niscPaymentGatewayTransaction.clientMetadata,
          provider: niscPaymentGatewayTransaction.provider,
          status: niscPaymentGatewayTransaction.status,
          webhookDeliveryStatus: niscPaymentGatewayTransaction.webhookDeliveryStatus,
          createdAt: niscPaymentGatewayTransaction.createdAt,
          updatedAt: niscPaymentGatewayTransaction.updatedAt,
          
          // Internal payment transaction fields (M-Pesa details)
          gateway: paymentTransaction.gateway,
          gatewayStatus: paymentTransaction.gatewayStatus,
          gatewayMessage: paymentTransaction.gatewayMessage,
          merchantRequestId: paymentTransaction.merchantRequestId,
          checkoutRequestId: paymentTransaction.checkoutRequestId,
          receiptNumber: paymentTransaction.receiptNumber,
          amount: paymentTransaction.amount,
          paidAmount: paymentTransaction.paidAmount,
          currency: paymentTransaction.currency,
          accountReference: paymentTransaction.accountReference,
          transactionDesc: paymentTransaction.transactionDesc,
          phoneNumber: paymentTransaction.phoneNumber,
          paymentStatus: paymentTransaction.status,
          rawResponse: paymentTransaction.rawResponse,
          initiatedAt: paymentTransaction.initiatedAt,
          processedAt: paymentTransaction.processedAt,
          failedAt: paymentTransaction.failedAt,
        })
        .from(niscPaymentGatewayTransaction)
        .innerJoin(
          paymentTransaction,
          eq(niscPaymentGatewayTransaction.paymentTransactionId, paymentTransaction.id)
        )
        .where(eq(niscPaymentGatewayTransaction.id, input.id))
        .limit(1);

      if (!result[0]) {
        throw new Error("Transaction not found");
      }

      // Verify merchant ownership
      const merchant = await db
        .select()
        .from(niscPaymentGatewayMerchant)
        .where(eq(niscPaymentGatewayMerchant.id, result[0].merchantId))
        .limit(1);

      if (!merchant[0]) {
        throw new Error("Merchant not found");
      }

      // Access control based on role
      assertGatewayReadAccess({
        actorUserId: ctx.session.user.id,
        role: ctx.session.user.role,
        ownerUserId: merchant[0].userId,
        teamId: merchant[0].teamId,
      });

      return {
        transaction: result[0],
      };
    }),
});
