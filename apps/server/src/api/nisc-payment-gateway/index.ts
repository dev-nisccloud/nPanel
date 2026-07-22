/**
 * Nisc Payment Gateway - Public REST API (Hono)
 * 
 * SECURITY CRITICAL: External-facing API for merchants
 * Standalone service - can be deployed separately in future
 */

import * as crypto from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, and, desc } from "drizzle-orm";

import { db } from "@npanel/db";
import {
  niscPaymentGatewayTransaction,
  niscPaymentGatewayMerchantCredentials,
  niscPaymentGatewayApiKey,
  niscPaymentGatewayMerchant,
  niscPaymentGatewayRequestLog,
} from "@npanel/db/schema/nisc-payment-gateway";
import { paymentTransaction } from "@npanel/db/schema/payment-transactions";
import {
  validateApiKeyFormat,
  verifyApiKey,
  maskApiKeyPartial,
} from "@npanel/api/lib/nisc-payment-gateway-api-key";
import {
  decryptCredentials,
  type MpesaCredentials,
} from "@npanel/api/lib/nisc-payment-gateway-encryption";
import { incrementAccessLog } from "@npanel/api/lib/nisc-payment-gateway-access-log";
import { handleNiscGatewayMpesaWebhook } from "./webhooks/mpesa";
import { initiateGatewayMpesaStkPush } from "@npanel/api/lib/nisc-payment-gateway-mpesa";

// =============================================================================
// TYPES
// =============================================================================

type GatewayContext = {
  merchantId: string;
  merchantName: string;
  apiKeyId: string;
  keyName: string;
  permissions: string[];
  environment: string;
  ipAddress: string;
  userAgent: string;
};

// =============================================================================
// SCHEMAS
// =============================================================================

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default("KES"),
  phoneNumber: z.string().transform((val) => formatPhoneNumber(val)).pipe(z.string().regex(/^254\d{9}$/)),
  description: z.string().optional(),
  referenceId: z.string().optional(),
  metadata: z.any().optional(),
});

// =============================================================================
// HELPERS
// =============================================================================

function getClientIp(c: any): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = c.req.header("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/(\d{4})(\d{5})(\d{3})/, "$1*****$3");
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // Handle different formats:
  // 0712345678 -> 254712345678
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "254" + cleaned.substring(1);
  }
  // 712345678 -> 254712345678
  else if (cleaned.length === 9 && !cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  // +254712345678 or 254712345678 -> 254712345678
  else if (cleaned.startsWith("254") && cleaned.length === 12) {
    // Already in correct format
  }
  
  return cleaned;
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

async function authMiddleware(c: any, next: () => Promise<void>) {
  const startTime = Date.now();
  const requestId = nanoid();
  
  try {
    // Extract API key
    const authHeader = c.req.header("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({
        error: {
          code: "MISSING_API_KEY",
          message: "API key required. Use: Authorization: Bearer npg_...",
        },
      }, 401);
    }

    const apiKey = authHeader.substring(7);

    // Validate format
    if (!validateApiKeyFormat(apiKey)) {
      return c.json({
        error: {
          code: "INVALID_API_KEY_FORMAT",
          message: "Invalid API key format",
        },
      }, 401);
    }

    // Find matching key
    const apiKeyRecords = await db
      .select()
      .from(niscPaymentGatewayApiKey)
      .where(eq(niscPaymentGatewayApiKey.isActive, true));

    let matchedKey: (typeof apiKeyRecords)[0] | null = null;
    for (const record of apiKeyRecords) {
      if (await verifyApiKey(apiKey, record.keyHash)) {
        matchedKey = record;
        break;
      }
    }

    if (!matchedKey) {
      return c.json({
        error: {
          code: "INVALID_API_KEY",
          message: "API key is invalid or has been revoked",
        },
      }, 401);
    }

    // Check expiration
    if (matchedKey.expiresAt && matchedKey.expiresAt < new Date()) {
      return c.json({
        error: { code: "API_KEY_EXPIRED", message: "API key has expired" },
      }, 401);
    }

    // Get merchant
    const merchant = await db
      .select()
      .from(niscPaymentGatewayMerchant)
      .where(eq(niscPaymentGatewayMerchant.id, matchedKey.merchantId))
      .limit(1);

    if (!merchant[0] || merchant[0].status !== "ACTIVE") {
      return c.json({
        error: { code: "MERCHANT_NOT_ACTIVE", message: "Merchant account is not active" },
      }, 403);
    }

    // Attach context
    const gatewayContext: GatewayContext = {
      merchantId: merchant[0].id,
      merchantName: merchant[0].merchantName,
      apiKeyId: matchedKey.id,
      keyName: matchedKey.name,
      permissions: (matchedKey.permissions as string[]) || [],
      environment: matchedKey.environment,
      ipAddress: getClientIp(c),
      userAgent: c.req.header("user-agent") || "unknown",
    };

    c.set("gateway", gatewayContext);

    // Update last used
    db.update(niscPaymentGatewayApiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(niscPaymentGatewayApiKey.id, matchedKey.id))
      .then(() => {})
      .catch(() => {});

    // Continue
    await next();

    // Log request
    const statusCode = c.res.status;
    const durationMs = Date.now() - startTime;
    const timestamp = new Date();

    await db.insert(niscPaymentGatewayRequestLog).values({
      id: requestId,
      merchantId: gatewayContext.merchantId,
      apiKeyId: gatewayContext.apiKeyId,
      endpoint: c.req.path,
      method: c.req.method,
      path: c.req.path,
      requestHeaders: {},
      requestBody: {},
      ipAddress: gatewayContext.ipAddress,
      userAgent: gatewayContext.userAgent,
      statusCode,
      success: statusCode >= 200 && statusCode < 400,
      responseBody: {},
      timestamp,
      durationMs,
      year: timestamp.getUTCFullYear(),
      month: timestamp.getUTCMonth() + 1,
      day: timestamp.getUTCDate(),
      hour: timestamp.getUTCHours(),
      rateLimitHit: false,
    }).then(() => {}).catch(() => {});

    // Increment access log
    await incrementAccessLog(db, {
      merchantId: gatewayContext.merchantId,
      apiKeyId: gatewayContext.apiKeyId,
      endpoint: c.req.path,
      method: c.req.method,
      statusCode,
      success: statusCode >= 200 && statusCode < 400,
      rateLimitHit: false,
    }).then(() => {}).catch(() => {});

  } catch (error) {
    return c.json({
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    }, 500);
  }
}

// =============================================================================
// ROUTES
// =============================================================================

export function createNiscPaymentGatewayRoutes() {
  const app = new Hono();

  // Health check (no auth)
  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      service: "nisc-payment-gateway",
      version: "1.0.0",
    });
  });

  // WEBHOOKS (no auth - M-Pesa sends callbacks)
  // ISOLATED FROM NPANEL'S /api/webhooks/mpesa
  app.post("/webhooks/mpesa/:merchantId", handleNiscGatewayMpesaWebhook);

  // All other routes require auth
  app.use("/v1/*", authMiddleware);

  // CREATE PAYMENT
  app.post("/v1/payments", async (c) => {
    try {
      const gateway = c.get("gateway") as GatewayContext;
      const body = await c.req.json();
      const input = createPaymentSchema.parse(body);

      // Get credentials
      // Map API key environment to credential environment
      // Handle both old ("live"/"test") and new ("PRODUCTION"/"SANDBOX") values
      const isProduction = gateway.environment === "PRODUCTION" || gateway.environment === "live";
      const credentialEnvironment = isProduction ? "PRODUCTION" : "SANDBOX";

      const credentials = await db
        .select()
        .from(niscPaymentGatewayMerchantCredentials)
        .where(
          and(
            eq(niscPaymentGatewayMerchantCredentials.merchantId, gateway.merchantId),
            eq(niscPaymentGatewayMerchantCredentials.provider, "MPESA"),
            eq(niscPaymentGatewayMerchantCredentials.isActive, true)
          )
        );

      // Filter by environment
      const matchedCredentials = credentials.filter(c => 
        c.environment === credentialEnvironment
      );

      if (matchedCredentials.length === 0) {
        return c.json({
          error: {
            code: "CREDENTIALS_NOT_CONFIGURED",
            message: `Payment provider credentials not configured for ${credentialEnvironment} environment`,
            debug: {
              apiKeyEnvironment: gateway.environment,
              requiredEnvironment: credentialEnvironment,
              availableCredentials: credentials.map(c => c.environment)
            }
          },
        }, 400);
      }

      const credentialRecord = matchedCredentials[0];

      // Decrypt credentials
      const mpesaCredentials = decryptCredentials<MpesaCredentials>(
        credentialRecord.credentialsEncrypted,
        credentialRecord.encryptionVersion
      );

      // Initiate M-Pesa STK push (uses dynamic URLs based on environment)
      const accountRef = input.referenceId || `NISCPAY-${Date.now().toString().slice(-8)}`;
      const stkResponse = await initiateGatewayMpesaStkPush(
        mpesaCredentials,
        credentialRecord.environment, // Merchant's chosen environment (SANDBOX/PRODUCTION)
        gateway.merchantId,
        {
          amount: input.amount,
          phoneNumber: input.phoneNumber,
          accountReference: accountRef,
          transactionDesc: input.description || "Payment",
        }
      );

      if (stkResponse.ResponseCode !== "0") {
        return c.json({
          error: {
            code: "MPESA_ERROR",
            message: stkResponse.ResponseDescription || "M-Pesa request failed",
          },
        }, 400);
      }

      // Create internal payment transaction record (like nPanel's own transactions)
      const now = new Date();
      const internalTransactionId = crypto.randomUUID();
      
      await db.insert(paymentTransaction).values({
        id: internalTransactionId,
        userId: gateway.merchantId, // Use merchantId as userId for gateway transactions
        teamId: null, // Gateway transactions don't belong to teams
        gateway: "MPESA",
        gatewayStatus: stkResponse.ResponseCode,
        gatewayMessage: stkResponse.ResponseDescription,
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        amount: input.amount.toString(),
        currency: "KES",
        accountReference: accountRef,
        transactionDesc: input.description || "Payment",
        phoneNumber: input.phoneNumber,
        status: stkResponse.ResponseCode === "0" ? "PROCESSING" : "PENDING",
        rawResponse: JSON.parse(JSON.stringify(stkResponse)),
        initiatedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      // Create gateway transaction linking to internal transaction
      const gatewayTransactionId = `gtx_${nanoid()}`;
      const transaction = await db.insert(niscPaymentGatewayTransaction).values({
        id: gatewayTransactionId,
        merchantId: gateway.merchantId,
        apiKeyId: gateway.apiKeyId,
        paymentTransactionId: internalTransactionId, // Link to internal payment transaction
        clientReferenceId: input.referenceId || null,
        clientMetadata: input.metadata || null,
        provider: "MPESA",
        status: "PENDING",
        webhookDeliveryStatus: "PENDING",
        webhookDeliveryAttempts: 0,
        createdAt: now,
        updatedAt: now,
      }).returning();

      return c.json({
        id: transaction[0].id,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: transaction[0].status,
        provider: transaction[0].provider,
        referenceId: transaction[0].clientReferenceId,
        createdAt: transaction[0].createdAt,
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: error.errors,
          },
        }, 400);
      }
      throw error;
    }
  });

  // GET PAYMENT BY ID
  app.get("/v1/payments/:id", async (c) => {
    const gateway = c.get("gateway") as GatewayContext;
    const id = c.req.param("id");

    const transaction = await db
      .select()
      .from(niscPaymentGatewayTransaction)
      .where(
        and(
          eq(niscPaymentGatewayTransaction.id, id),
          eq(niscPaymentGatewayTransaction.merchantId, gateway.merchantId)
        )
      )
      .limit(1);

    if (!transaction[0]) {
      return c.json({
        error: { code: "PAYMENT_NOT_FOUND", message: "Payment not found" },
      }, 404);
    }

    return c.json({
      id: transaction[0].id,
      status: transaction[0].status,
      provider: transaction[0].provider,
      referenceId: transaction[0].clientReferenceId,
      metadata: transaction[0].clientMetadata,
      webhookStatus: transaction[0].webhookDeliveryStatus,
      createdAt: transaction[0].createdAt,
      updatedAt: transaction[0].updatedAt,
    });
  });

  // LIST PAYMENTS
  app.get("/v1/payments", async (c) => {
    const gateway = c.get("gateway") as GatewayContext;
    const status = c.req.query("status");
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const conditions = [eq(niscPaymentGatewayTransaction.merchantId, gateway.merchantId)];
    if (status) {
      conditions.push(eq(niscPaymentGatewayTransaction.status, status));
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
      .limit(limit)
      .offset(offset);

    return c.json({
      payments: transactions,
      pagination: {
        limit,
        offset,
        hasMore: transactions.length === limit,
      },
    });
  });

  return app;
}
