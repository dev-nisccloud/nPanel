import { Context } from "hono";
import { db, eq } from "@npanel/db";
import {
  paymentTransaction,
  paymentTransactionActivityLog,
  user
} from "@npanel/db/schema";
import {
  validateMpesaCallback,
  getPaymentStatus,
  isPaymentSuccessful,
} from "@npanel/api/routers/payment-gateway/mpesa/callback";
import { sendEmail } from "@npanel/api/lib/email";
import { renderPaymentReceiptEmail } from "@npanel/api/lib/email-templates";
import { randomUUID } from "node:crypto";

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

    if (isPaymentSuccessful(validatedCallback)) {
      if (transaction) {
        await db.update(paymentTransaction)
          .set({
            status: "SUCCESS",
            gatewayStatus: "0",
            gatewayMessage: paymentStatus.resultDesc,
            gatewayTransactionId: paymentStatus.metadata?.mpesaReceiptNumber || null,
            receiptNumber: paymentStatus.metadata?.mpesaReceiptNumber || null,
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

        // Async email sending
        try {
          const userData = await db.query.user.findFirst({
            where: eq(user.id, transaction.userId),
            columns: { email: true, name: true },
          });

          if (userData?.email) {
            const formattedAmount = paymentStatus.metadata?.amount
              ? new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(paymentStatus.metadata.amount)
              : transaction.amount;

            const emailHtml = await renderPaymentReceiptEmail({
              customerName: userData.name || "Valued Customer",
              receiptNumber: paymentStatus.metadata?.mpesaReceiptNumber || "N/A",
              transactionDate: now.toLocaleString(),
              amount: formattedAmount,
              currency: transaction.currency || "KES",
              paymentMethod: "M-Pesa",
              supportEmail: "support@nisccloud.com",
              supportPhone: "+254 748 777 666",
            });

            await sendEmail({
              to: userData.email,
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
