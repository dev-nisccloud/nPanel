/**
 * Nisc Payment Gateway - Payments API
 * 
 * Create and query payment requests via gateway
 */

import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, and, desc } from "drizzle-orm";

import { db } from "@npanel/db";
import {
  niscPaymentGatewayTransaction,
  niscPaymentGatewayMerchantCredentials,
} from "@npanel/db/schema/nisc-payment-gateway";
import type { NiscPaymentGatewayRequest } from "@npanel/api/middleware/nisc-payment-gateway-auth";
import { requirePermission } from "@npanel/api/middleware/nisc-payment-gateway-auth";
import { decryptCredentials, type MpesaCredentials } from "@npanel/api/lib/nisc-payment-gateway-encryption";

// =============================================================================
// SCHEMAS
// =============================================================================

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default("KES"),
  phoneNumber: z.string().regex(/^254\d{9}$/),
  description: z.string().optional(),
  referenceId: z.string().optional(), // Client's reference
  metadata: z.record(z.unknown()).optional(),
});

const listPaymentsSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED"]).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// =============================================================================
// ROUTER
// =============================================================================

export const paymentsRouter = Router();

/**
 * Create payment request
 * 
 * POST /v1/payments
 */
paymentsRouter.post(
  "/",
  requirePermission("PAYMENT_CREATE"),
  async (req: NiscPaymentGatewayRequest, res) => {
    try {
      // Validate input
      const input = createPaymentSchema.parse(req.body);

      if (!req.niscGateway) {
        res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
        return;
      }

      const { merchant, apiKey } = req.niscGateway;

      // Get active M-Pesa credentials for merchant
      const credentials = await db
        .select()
        .from(niscPaymentGatewayMerchantCredentials)
        .where(
          and(
            eq(niscPaymentGatewayMerchantCredentials.merchantId, merchant.merchantId),
            eq(niscPaymentGatewayMerchantCredentials.provider, "MPESA"),
            eq(niscPaymentGatewayMerchantCredentials.environment, apiKey.environment === "live" ? "PRODUCTION" : "SANDBOX"),
            eq(niscPaymentGatewayMerchantCredentials.isActive, true)
          )
        )
        .limit(1);

      if (!credentials[0]) {
        res.status(400).json({
          error: {
            code: "CREDENTIALS_NOT_CONFIGURED",
            message: "Payment provider credentials not configured for this merchant",
          },
        });
        return;
      }

      // Decrypt credentials
      const mpesaCredentials = decryptCredentials<MpesaCredentials>(
        credentials[0].credentialsEncrypted,
        credentials[0].encryptionVersion
      );

      // TODO: Initiate M-Pesa STK push using mpesaCredentials
      // For now, create a pending transaction

      const gatewayTransactionId = `gtx_${nanoid()}`;
      const paymentTransactionId = `ptx_${nanoid()}`; // Would link to actual payment_transaction

      const transaction = await db.insert(niscPaymentGatewayTransaction).values({
        id: gatewayTransactionId,
        merchantId: merchant.merchantId,
        apiKeyId: apiKey.apiKeyId,
        paymentTransactionId,
        clientReferenceId: input.referenceId || null,
        clientMetadata: input.metadata || null,
        provider: "MPESA",
        status: "PENDING",
        webhookDeliveryStatus: "PENDING",
        webhookDeliveryAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      res.status(201).json({
        id: transaction[0].id,
        status: transaction[0].status,
        provider: transaction[0].provider,
        referenceId: transaction[0].clientReferenceId,
        createdAt: transaction[0].createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: error.errors,
          },
        });
        return;
      }

      throw error;
    }
  }
);

/**
 * Get payment by ID
 * 
 * GET /v1/payments/:id
 */
paymentsRouter.get(
  "/:id",
  requirePermission("PAYMENT_READ"),
  async (req: NiscPaymentGatewayRequest, res) => {
    if (!req.niscGateway) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    const { merchant } = req.niscGateway;

    const transaction = await db
      .select()
      .from(niscPaymentGatewayTransaction)
      .where(
        and(
          eq(niscPaymentGatewayTransaction.id, req.params.id),
          eq(niscPaymentGatewayTransaction.merchantId, merchant.merchantId)
        )
      )
      .limit(1);

    if (!transaction[0]) {
      res.status(404).json({
        error: {
          code: "PAYMENT_NOT_FOUND",
          message: "Payment not found",
        },
      });
      return;
    }

    res.json({
      id: transaction[0].id,
      status: transaction[0].status,
      provider: transaction[0].provider,
      referenceId: transaction[0].clientReferenceId,
      metadata: transaction[0].clientMetadata,
      webhookStatus: transaction[0].webhookDeliveryStatus,
      createdAt: transaction[0].createdAt,
      updatedAt: transaction[0].updatedAt,
    });
  }
);

/**
 * List payments
 * 
 * GET /v1/payments
 */
paymentsRouter.get(
  "/",
  requirePermission("PAYMENT_LIST"),
  async (req: NiscPaymentGatewayRequest, res) => {
    try {
      const input = listPaymentsSchema.parse(req.query);

      if (!req.niscGateway) {
        res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
        return;
      }

      const { merchant } = req.niscGateway;

      const conditions = [eq(niscPaymentGatewayTransaction.merchantId, merchant.merchantId)];

      if (input.status) {
        conditions.push(eq(niscPaymentGatewayTransaction.status, input.status));
      }

      const transactions = await db
        .select({
          id: niscPaymentGatewayTransaction.id,
          status: niscPaymentGatewayTransaction.status,
          provider: niscPaymentGatewayTransaction.provider,
          referenceId: niscPaymentGatewayTransaction.clientReferenceId,
          createdAt: niscPaymentGatewayTransaction.createdAt,
        })
        .from(niscPaymentGatewayTransaction)
        .where(and(...conditions))
        .orderBy(desc(niscPaymentGatewayTransaction.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      res.json({
        payments: transactions,
        pagination: {
          limit: input.limit,
          offset: input.offset,
          hasMore: transactions.length === input.limit,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: error.errors,
          },
        });
        return;
      }

      throw error;
    }
  }
);
