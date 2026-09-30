import { Context } from "hono";
import { db, eq } from "@npanel/db";
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
      where: eq(paymentTransaction.checkoutRequestId, checkoutRequestId),
    });

    // If poll marked SUCCESS before the webhook arrived, still backfill receipt / paidAmount.
    if (transaction?.status === "SUCCESS" && isPaymentSuccessful(validatedCallback)) {
      const receipt = paymentStatus.metadata?.mpesaReceiptNumber || null;
      const paidFromCallback = paymentStatus.metadata?.amount;
      const needsReceipt = receipt && !transaction.receiptNumber;
      const needsPaidAmount =
        paidFromCallback != null &&
        Number.isFinite(paidFromCallback) &&
        !transaction.paidAmount;
      if (needsReceipt || needsPaidAmount) {
        await db.update(paymentTransaction)
          .set({
            ...(needsReceipt
              ? {
                  receiptNumber: receipt,
                  gatewayTransactionId: receipt,
                }
              : {}),
            ...(needsPaidAmount
              ? { paidAmount: String(Math.ceil(paidFromCallback)) }
              : {}),
            rawResponse: validatedCallback as any,
            updatedAt: now,
          })
          .where(eq(paymentTransaction.id, transaction.id));
      }
      await applySuccessfulPaymentToInvoiceSafe(transaction.id);
      return c.json({
        ResultCode: 0,
        ResultDesc: "Already processed",
      });
    }

    const idempotencyKey = `${checkoutRequestId}:${paymentStatus.resultCode}`;
    const claimed = await claimWebhookEvent("mpesa", idempotencyKey);
    if (!claimed) {
      return c.json({
        ResultCode: 0,
        ResultDesc: "Duplicate callback",
      });
    }

    if (isPaymentSuccessful(validatedCallback)) {
      if (transaction) {
        const receipt = paymentStatus.metadata?.mpesaReceiptNumber || null;
        const paidFromCallback = paymentStatus.metadata?.amount;
        await db.update(paymentTransaction)
          .set({
            status: "SUCCESS",
            gatewayStatus: "0",
            gatewayMessage: paymentStatus.resultDesc,
            gatewayTransactionId: receipt,
            receiptNumber: receipt,
            ...(paidFromCallback != null && Number.isFinite(paidFromCallback)
              ? { paidAmount: String(Math.ceil(paidFromCallback)) }
              : { paidAmount: transaction.amount }),
            rawResponse: validatedCallback as any,
            processedAt: now,
            updatedAt: now,
          })
          .where(eq(paymentTransaction.id, transaction.id));

        await db.insert(paymentTransactionActivityLog).values({
          id: randomUUID(),
          transactionId: transaction.id,
          userId: transaction.userId,
          action: "SUCCESS",
          description: `Payment completed successfully. Receipt: ${paymentStatus.metadata?.mpesaReceiptNumber}`,
          metadata: {
            receiptNumber: paymentStatus.metadata?.mpesaReceiptNumber,
            amount: paymentStatus.metadata?.amount,
            transactionDate: paymentStatus.metadata?.transactionDate,
            phoneNumber: paymentStatus.metadata?.phoneNumber,
          },
          ipAddress: clientIp !== "unknown" ? clientIp : null,
          userAgent: req.headers.get("user-agent") || null,
          createdAt: now,
        });

        await applySuccessfulPaymentToInvoiceSafe(transaction.id);

        // Async email sending
        try {
          const recipient = await resolveNiscCustomerNotificationRecipient({
            teamId: transaction.teamId,
            userId: transaction.userId,
          });

          if (recipient) {
            const formattedAmount = paymentStatus.metadata?.amount
              ? new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(paymentStatus.metadata.amount)
              : transaction.amount;

            const emailHtml = await renderPaymentReceiptEmail({
              customerName: recipient.name,
              receiptNumber: paymentStatus.metadata?.mpesaReceiptNumber || "N/A",
              transactionDate: now.toLocaleString(),
              amount: formattedAmount,
              currency: transaction.currency || "KES",
              paymentMethod: "M-Pesa",
              supportEmail: "support@nisccloud.com",
              supportPhone: "+254 748 777 666",
            });

            await sendEmail({
              to: recipient.email,
              subject: `Payment Receipt - ${paymentStatus.metadata?.mpesaReceiptNumber || "Payment Confirmed"}`,
              html: emailHtml,
            });
          }
        } catch (emailError) {
          console.error("[Webhook][M-Pesa] Failed to send email:", emailError);
        }
      }
    } else {
      const transactionStatus = paymentStatus.resultCode === 1032 ? "CANCELLED" : "FAILED";
      if (transaction) {
        await db.update(paymentTransaction)
          .set({
            status: transactionStatus,
            gatewayStatus: String(paymentStatus.resultCode),
            gatewayMessage: paymentStatus.resultDesc,
            rawError: validatedCallback as any,
            failedAt: transactionStatus === "FAILED" ? now : null,
            updatedAt: now,
          })
          .where(eq(paymentTransaction.id, transaction.id));

        await db.insert(paymentTransactionActivityLog).values({
          id: randomUUID(),
          transactionId: transaction.id,
          userId: transaction.userId,
          action: transactionStatus === "CANCELLED" ? "CANCEL" : "FAIL",
          description: transactionStatus === "CANCELLED"
            ? `Payment cancelled by user: ${paymentStatus.resultDesc}`
            : `Payment failed: ${paymentStatus.resultDesc}`,
          metadata: {
            resultCode: paymentStatus.resultCode,
            resultDesc: paymentStatus.resultDesc,
          },
          ipAddress: clientIp !== "unknown" ? clientIp : null,
          userAgent: req.headers.get("user-agent") || null,
          createdAt: now,
        });
      }
    }

    return c.json({
      ResultCode: 0,
      ResultDesc: "Callback processed successfully",
    });
  } catch (error) {
    console.error("[Webhook][M-Pesa] Unexpected error:", error);
    return c.json({
      ResultCode: 0,
      ResultDesc: "Callback received",
    });
  }
}
