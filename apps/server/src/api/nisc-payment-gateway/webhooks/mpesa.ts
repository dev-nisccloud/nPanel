/**
 * Nisc Payment Gateway - M-Pesa Webhook Handler
 * 
 * ISOLATED FROM MAIN NPANEL M-PESA WEBHOOKS
 * 
 * Callback URL: /api/nisc-gateway/webhooks/mpesa/:merchantId
 * This is SEPARATE from /api/webhooks/mpesa (nPanel's internal M-Pesa)
 */

import { Context } from "hono";
import { db, eq, and } from "@npanel/db";
import { randomUUID } from "node:crypto";
import {
  niscPaymentGatewayTransaction,
  niscPaymentGatewayMerchant,
  niscPaymentGatewayWebhookLog,
} from "@npanel/db/schema/nisc-payment-gateway";
import {
  validateMpesaCallback,
  getPaymentStatus,
  isPaymentSuccessful,
} from "@npanel/api/routers/payment-gateway/mpesa/callback";
import { claimWebhookEvent } from "@npanel/api/lib/webhook-idempotency";

/**
 * Nisc Gateway M-Pesa Webhook Handler
 * 
 * This handles callbacks for external merchants using the gateway
 */
export async function handleNiscGatewayMpesaWebhook(c: Context) {
  const req = c.req.raw;
  const merchantId = c.req.param("merchantId");

  try {
    const clientIp =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Verify merchant exists and is active
    const merchant = await db.query.niscPaymentGatewayMerchant.findFirst({
      where: eq(niscPaymentGatewayMerchant.id, merchantId),
    });

    if (!merchant || merchant.status !== "ACTIVE") {
      return c.json({
        ResultCode: 1,
        ResultDesc: "Invalid merchant",
      }, 400);
    }

    // Parse request body
    let body;
    let rawBodyText: string | null = null;
    try {
      rawBodyText = await req.text();

      if (!rawBodyText || rawBodyText.trim().length === 0) {
        return c.json({
          ResultCode: 0,
          ResultDesc: "Empty request received",
        });
      }

      body = JSON.parse(rawBodyText);
    } catch (parseError) {
      return c.json({
        ResultCode: 0,
        ResultDesc: "Request body parsing failed",
      });
    }

    // Validate M-Pesa callback structure
    let validatedCallback;
    try {
      validatedCallback = validateMpesaCallback(body);
    } catch (error) {
      return c.json({ error: "Invalid callback structure" }, 400);
    }

    const stkCallback = validatedCallback.Body.stkCallback;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const paymentStatus = getPaymentStatus(validatedCallback);
    const now = new Date();

    // Find gateway transaction by checkoutRequestId
    const transaction = await db.query.niscPaymentGatewayTransaction.findFirst({
      where: and(
        eq(niscPaymentGatewayTransaction.merchantId, merchantId),
        eq(niscPaymentGatewayTransaction.paymentTransactionId, checkoutRequestId)
      ),
    });

    if (!transaction) {
      return c.json({
        ResultCode: 0,
        ResultDesc: "Transaction not found",
      });
    }

    // Check if already processed
    if (transaction.status === "SUCCESS" && isPaymentSuccessful(validatedCallback)) {
      return c.json({
        ResultCode: 0,
        ResultDesc: "Already processed",
      });
    }

    // Idempotency check
    const idempotencyKey = `nisc_gateway:${merchantId}:${checkoutRequestId}:${paymentStatus.resultCode}`;
    const claimed = await claimWebhookEvent("nisc_gateway_mpesa", idempotencyKey);
    if (!claimed) {
      return c.json({
        ResultCode: 0,
        ResultDesc: "Duplicate callback",
      });
    }

    // Update transaction status
    if (isPaymentSuccessful(validatedCallback)) {
      // SUCCESS
      await db
        .update(niscPaymentGatewayTransaction)
        .set({
          status: "SUCCESS",
          mpesaReceiptNumber: paymentStatus.metadata?.mpesaReceiptNumber || null,
          mpesaTransactionDate: paymentStatus.metadata?.transactionDate || null,
          webhookDeliveryStatus: "PENDING",
          updatedAt: now,
        })
        .where(eq(niscPaymentGatewayTransaction.id, transaction.id));

      // Queue webhook delivery to merchant
      await deliverWebhookToMerchant(
        transaction,
        merchant,
        {
          status: "SUCCESS",
          receiptNumber: paymentStatus.metadata?.mpesaReceiptNumber || null,
          amount: paymentStatus.metadata?.amount || null,
          transactionDate: paymentStatus.metadata?.transactionDate || null,
          phoneNumber: paymentStatus.metadata?.phoneNumber || null,
        },
        clientIp
      );
    } else {
      // FAILED or CANCELLED
      const transactionStatus =
        paymentStatus.resultCode === 1032 ? "CANCELLED" : "FAILED";

      await db
        .update(niscPaymentGatewayTransaction)
        .set({
          status: transactionStatus,
          webhookDeliveryStatus: "PENDING",
          updatedAt: now,
        })
        .where(eq(niscPaymentGatewayTransaction.id, transaction.id));

      // Queue webhook delivery to merchant
      await deliverWebhookToMerchant(
        transaction,
        merchant,
        {
          status: transactionStatus,
          resultCode: paymentStatus.resultCode,
          resultDesc: paymentStatus.resultDesc,
        },
        clientIp
      );
    }

    return c.json({
      ResultCode: 0,
      ResultDesc: "Callback processed successfully",
    });
  } catch (error) {
    return c.json({
      ResultCode: 0,
      ResultDesc: "Callback received",
    });
  }
}

/**
 * Deliver webhook to merchant's configured endpoint
 */
async function deliverWebhookToMerchant(
  transaction: any,
  merchant: any,
  payload: any,
  clientIp: string
) {
  const settings = merchant.settings as any;
  const webhookUrl = settings?.webhookUrl;

  if (!webhookUrl) {
    await db
      .update(niscPaymentGatewayTransaction)
      .set({ webhookDeliveryStatus: "NOT_CONFIGURED" })
      .where(eq(niscPaymentGatewayTransaction.id, transaction.id));
    return;
  }

  const webhookPayload = {
    event: "payment.completed",
    merchantId: merchant.id,
    transactionId: transaction.id,
    referenceId: transaction.clientReferenceId,
    metadata: transaction.clientMetadata,
    payment: payload,
    timestamp: new Date().toISOString(),
  };

  const sentAt = new Date();
  let success = false;
  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;

  try {
    // Sign webhook with merchant's webhook secret
    const webhookSecret = settings?.webhookSecret;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Nisc-Payment-Gateway/1.0",
      "X-Nisc-Gateway-Event": "payment.completed",
      "X-Nisc-Gateway-Merchant": merchant.id,
    };

    if (webhookSecret) {
      const crypto = await import("node:crypto");
      const signature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(webhookPayload))
        .digest("hex");
      headers["X-Nisc-Gateway-Signature"] = signature;
    }

    // Make HTTP request to merchant's webhook URL
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    responseStatus = response.status;
    responseBody = await response.text();
    success = response.ok;

    if (success) {
      await db
        .update(niscPaymentGatewayTransaction)
        .set({
          webhookDeliveryStatus: "DELIVERED",
          webhookDeliveredAt: new Date(),
          webhookDeliveryAttempts: transaction.webhookDeliveryAttempts + 1,
        })
        .where(eq(niscPaymentGatewayTransaction.id, transaction.id));
    } else {
      throw new Error(`HTTP ${responseStatus}: ${responseBody}`);
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db
      .update(niscPaymentGatewayTransaction)
      .set({
        webhookDeliveryStatus: "FAILED",
        webhookDeliveryAttempts: transaction.webhookDeliveryAttempts + 1,
        lastWebhookAttemptAt: new Date(),
      })
      .where(eq(niscPaymentGatewayTransaction.id, transaction.id));
  }

  // Log webhook delivery attempt
  await db.insert(niscPaymentGatewayWebhookLog).values({
    id: `whl_${randomUUID().replace(/-/g, "")}`,
    gatewayTransactionId: transaction.id,
    merchantId: merchant.id,
    webhookUrl,
    requestPayload: webhookPayload,
    requestHeaders: {},
    responseStatus,
    responseBody,
    responseHeaders: {},
    sentAt,
    respondedAt: responseStatus ? new Date() : null,
    durationMs: responseStatus ? Date.now() - sentAt.getTime() : null,
    success,
    errorMessage,
    attemptNumber: transaction.webhookDeliveryAttempts + 1,
    willRetry: !success && transaction.webhookDeliveryAttempts < 3, // Max 3 attempts
    nextRetryAt: !success ? new Date(Date.now() + 60000) : null, // Retry in 1 minute
  });
}
