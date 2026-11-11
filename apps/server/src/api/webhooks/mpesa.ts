import { Context } from "hono";
import { and, db, eq } from "@npanel/db";
import {
  paymentTransaction,
  paymentTransactionActivityLog,
} from "@npanel/db/schema";
import {
  validateMpesaCallback,
  getPaymentStatus,
  isPaymentSuccessful,
} from "@npanel/api/routers/payment-gateway/mpesa/callback";
import { sendEmail } from "@npanel/api/lib/email";
import { renderPaymentReceiptEmail } from "@npanel/api/lib/email-templates";
import { randomUUID } from "node:crypto";
import { claimWebhookEvent } from "@npanel/api/lib/webhook-idempotency";
import { applySuccessfulPaymentToInvoiceSafe } from "@npanel/api/lib/invoice-apply-gateway-payment";
import { resolveNiscCustomerNotificationRecipient } from "@npanel/api/lib/nisc-order-invoice-billing";
import { queryStkPushForUser } from "@npanel/api/routers/payment-gateway/mpesa/query-stk-push-status";
import { completeStorefrontOrderFromVerifiedPayment } from "@npanel/api/lib/storefront-order-completion";

/**
 * M-Pesa Webhook Handler
 */
export async function handleMpesaWebhook(c: Context) {
  const req = c.req.raw;
  try {
    const clientIp = req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    console.log(`[Webhook][M-Pesa] Received callback from IP: ${clientIp}`);

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
      console.error("[Webhook][M-Pesa] Failed to parse request body:", parseError);
      return c.json({
        ResultCode: 0,
        ResultDesc: "Request body parsing failed",
      });
    }

    let validatedCallback;
    try {
      validatedCallback = validateMpesaCallback(body);
    } catch (error) {
      console.error("[Webhook][M-Pesa] Invalid callback structure:", error);
      return c.json({ error: "Invalid callback structure" }, 400);
    }

    const stkCallback = validatedCallback.Body.stkCallback;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    const paymentStatus = getPaymentStatus(validatedCallback);
    const now = new Date();

    const transaction = await db.query.paymentTransaction.findFirst({
      where: and(
        eq(paymentTransaction.checkoutRequestId, checkoutRequestId),
        eq(paymentTransaction.gateway, "MPESA"),
      ),
    });

    if (!transaction) {
      return c.json({
        ResultCode: 0,
        ResultDesc: "Unknown checkout reference",
      });
    }

    // Daraja callbacks are not signed. Treat the callback only as a signal to
    // query Daraja server-to-server; never derive a terminal state from its body.
    await queryStkPushForUser(checkoutRequestId, transaction.userId);

    const verifiedTransaction = await db.query.paymentTransaction.findFirst({
      where: eq(paymentTransaction.id, transaction.id),
    });
    if (!verifiedTransaction) {
      return c.json({ ResultCode: 0, ResultDesc: "Transaction unavailable" });
    }

    if (verifiedTransaction.status === "SUCCESS") {
      await completeStorefrontOrderFromVerifiedPayment({
        checkoutRequestId,
        userId: verifiedTransaction.userId,
        teamId: verifiedTransaction.teamId,
        metadata: verifiedTransaction.metadata,
      });
    }

    const idempotencyKey =
      `${checkoutRequestId}:${verifiedTransaction.status}:${verifiedTransaction.gatewayStatus || "unknown"}`;
    const claimed = await claimWebhookEvent("mpesa_verified", idempotencyKey);
    if (!claimed) {
      return c.json({ ResultCode: 0, ResultDesc: "Duplicate callback" });
    }

    if (
      verifiedTransaction.status === "SUCCESS" &&
      isPaymentSuccessful(validatedCallback)
    ) {
      const callbackAmount = paymentStatus.metadata?.amount;
      const expectedAmount = Number(verifiedTransaction.amount);
      const amountMatches =
        callbackAmount != null &&
        Number.isFinite(callbackAmount) &&
        Number.isFinite(expectedAmount) &&
        Math.round(callbackAmount * 100) === Math.round(expectedAmount * 100);
      const receipt = amountMatches
        ? paymentStatus.metadata?.mpesaReceiptNumber || null
        : null;

      if (!amountMatches) {
        await db.insert(paymentTransactionActivityLog).values({
          id: randomUUID(),
          transactionId: verifiedTransaction.id,
          userId: verifiedTransaction.userId,
          action: "CALLBACK_METADATA_REJECTED",
          description: "M-Pesa callback metadata rejected: amount mismatch",
          metadata: {
            expectedAmount: verifiedTransaction.amount,
            callbackAmount: callbackAmount ?? null,
          },
          ipAddress: clientIp !== "unknown" ? clientIp : null,
          userAgent: req.headers.get("user-agent") || null,
          createdAt: now,
        });
      } else if (receipt && !verifiedTransaction.receiptNumber) {
        await db.update(paymentTransaction)
          .set({
            receiptNumber: receipt,
            gatewayTransactionId: receipt,
            paidAmount: verifiedTransaction.amount,
            updatedAt: now,
          })
          .where(eq(paymentTransaction.id, verifiedTransaction.id));
      }

      await applySuccessfulPaymentToInvoiceSafe(verifiedTransaction.id);

      if (transaction.status !== "SUCCESS") {
        try {
          const recipient = await resolveNiscCustomerNotificationRecipient({
            teamId: verifiedTransaction.teamId,
            userId: verifiedTransaction.userId,
          });
          if (recipient) {
            const formattedAmount = new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(expectedAmount);
            const emailHtml = await renderPaymentReceiptEmail({
              customerName: recipient.name,
              receiptNumber: receipt || "Payment Confirmed",
              transactionDate: now.toLocaleString(),
              amount: formattedAmount,
              currency: verifiedTransaction.currency,
              paymentMethod: "M-Pesa",
              supportEmail: "support@nisccloud.com",
              supportPhone: "+254 748 777 666",
            });
            await sendEmail({
              to: recipient.email,
              subject: `Payment Receipt - ${receipt || "Payment Confirmed"}`,
              html: emailHtml,
            });
          }
        } catch (emailError) {
          console.error("[Webhook][M-Pesa] Failed to send email:", emailError);
        }
      }
    }

    return c.json({
      ResultCode: 0,
      ResultDesc: "Callback verified",
    });
  } catch (error) {
    console.error("[Webhook][M-Pesa] Unexpected error:", error);
    return c.json({
      ResultCode: 1,
      ResultDesc: "Temporary processing failure",
    }, 503);
  }
}
