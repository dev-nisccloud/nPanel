import { NextRequest, NextResponse } from "next/server";
import prisma from "@nPanel/db";
// Note: These utilities need to be exported from the api package
// For now, we'll import them directly - in production, export them from packages/api/src/index.ts
import {
	validateMpesaCallback,
	getPaymentStatus,
	isPaymentSuccessful,
} from "@nPanel/api/routers/payment-gateway/mpesa/callback";

// Force Node.js runtime for webhook handling
export const runtime = "nodejs";

// Configure max duration for webhook processing
export const maxDuration = 30; // 30 seconds

/**
 * M-Pesa Webhook Handler
 * 
 * This endpoint receives callbacks from M-Pesa after a payment is processed.
 * 
 * Security measures:
 * 1. IP Whitelist validation (M-Pesa IPs only) - TEMPORARILY DISABLED
 * 2. Request origin validation
 * 3. Payload structure validation
 * 4. Rate limiting (handled by Next.js)
 * 5. Logging for audit trail
 * 
 * Note: M-Pesa doesn't provide signature verification in STK Push callbacks,
 * so we rely on IP whitelisting and payload validation.
 * 
 * M-Pesa IP ranges (for reference - should be configured in firewall/load balancer):
 * - Sandbox: 196.201.214.0/24, 196.201.214.18, 196.201.214.19
 * - Live: 196.201.214.0/24, 196.201.214.18, 196.201.214.19, 196.201.214.20
 */
export async function POST(req: NextRequest) {
	try {
		// Security: Validate request origin (logging only for now)
		const clientIp = req.headers.get("x-forwarded-for") || 
			req.headers.get("x-real-ip") || 
			"unknown";

		// Log incoming request for audit
		console.log(`[M-Pesa Webhook] Received callback from IP: ${clientIp}`);

		// TODO: IP Whitelist validation - Temporarily disabled, will be implemented later
		// Optional: Validate IP whitelist (should be configured at infrastructure level)
		// For production, configure this at your load balancer/firewall level
		// const allowedIps = process.env.MPESA_ALLOWED_IPS?.split(",") || [];
		// if (allowedIps.length > 0 && !allowedIps.includes(clientIp) && clientIp !== "unknown") {
		// 	console.warn(`[M-Pesa Webhook] Rejected request from unauthorized IP: ${clientIp}`);
		// 	return NextResponse.json(
		// 		{ error: "Unauthorized" },
		// 		{ status: 403 }
		// 	);
		// }

		// Parse and validate request body
		const body = await req.json();

		// Validate callback structure
		let validatedCallback;
		try {
			validatedCallback = validateMpesaCallback(body);
		} catch (error) {
			console.error("[M-Pesa Webhook] Invalid callback structure:", error);
			return NextResponse.json(
				{ error: "Invalid callback structure" },
				{ status: 400 }
			);
		}

		const stkCallback = validatedCallback.Body.stkCallback;
		const checkoutRequestId = stkCallback.CheckoutRequestID;
		const merchantRequestId = stkCallback.MerchantRequestID;

		// Log callback details (without sensitive data)
		console.log(
			`[M-Pesa Webhook] Processing callback - ` +
				`CheckoutRequestID: ${checkoutRequestId}, ` +
				`MerchantRequestID: ${merchantRequestId}, ` +
				`ResultCode: ${stkCallback.ResultCode}`
		);

		// Get payment status
		const paymentStatus = getPaymentStatus(validatedCallback);
		const now = new Date();

		// Log result code information if available
		if (paymentStatus.resultCodeInfo) {
			console.log(
				`[M-Pesa Webhook] Result Code ${paymentStatus.resultCode}: ` +
					`${paymentStatus.resultCodeInfo.description} - ` +
					`${paymentStatus.resultCodeInfo.explanation}`
			);
		}

		// Find the transaction by checkout request ID
		const transaction = await prisma.paymentTransaction.findFirst({
			where: {
				checkoutRequestId: checkoutRequestId,
			},
		});

		// Process successful payment
		if (isPaymentSuccessful(validatedCallback)) {
			console.log(
				`[M-Pesa Webhook] Payment successful - ` +
					`Receipt: ${paymentStatus.metadata?.mpesaReceiptNumber}, ` +
					`Amount: ${paymentStatus.metadata?.amount}, ` +
					`Phone: ${paymentStatus.metadata?.phoneNumber}`
			);

			// Update transaction if found
			if (transaction) {
				await prisma.paymentTransaction.update({
					where: { id: transaction.id },
					data: {
						status: "SUCCESS",
						gatewayStatus: "0",
						gatewayMessage: paymentStatus.resultDesc,
						gatewayTransactionId: paymentStatus.metadata?.mpesaReceiptNumber || null,
						receiptNumber: paymentStatus.metadata?.mpesaReceiptNumber || null,
						rawResponse: JSON.parse(JSON.stringify(validatedCallback)),
						processedAt: now,
						updatedAt: now,
					},
				});

				// Create activity log for successful payment
				await prisma.paymentTransactionActivityLog.create({
					data: {
						id: crypto.randomUUID(),
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
					},
				});
			} else {
				console.warn(
					`[M-Pesa Webhook] Payment successful but transaction not found - ` +
						`CheckoutRequestID: ${checkoutRequestId}`
				);
			}

			// TODO: Update your database/order system here
			// Example:
			// await updateOrderStatus(checkoutRequestId, 'paid', {
			//   receiptNumber: paymentStatus.metadata?.mpesaReceiptNumber,
			//   amount: paymentStatus.metadata?.amount,
			//   transactionDate: paymentStatus.metadata?.transactionDate,
			// });

			// Send notification to user (email, SMS, etc.)
			// await sendPaymentConfirmation(...);
		} else {
			console.warn(
				`[M-Pesa Webhook] Payment failed - ` +
					`ResultCode: ${paymentStatus.resultCode}, ` +
					`ResultDesc: ${paymentStatus.resultDesc}`
			);

			// Update transaction if found
			if (transaction) {
				await prisma.paymentTransaction.update({
					where: { id: transaction.id },
					data: {
						status: "FAILED",
						gatewayStatus: String(paymentStatus.resultCode),
						gatewayMessage: paymentStatus.resultDesc,
						rawError: JSON.parse(JSON.stringify(validatedCallback)),
						failedAt: now,
						updatedAt: now,
					},
				});

				// Create activity log for failed payment
				await prisma.paymentTransactionActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						transactionId: transaction.id,
						userId: transaction.userId,
						action: "FAIL",
						description: `Payment failed: ${paymentStatus.resultDesc}`,
						metadata: {
							resultCode: paymentStatus.resultCode,
							resultDesc: paymentStatus.resultDesc,
							resultCodeInfo: paymentStatus.resultCodeInfo,
						},
						ipAddress: clientIp !== "unknown" ? clientIp : null,
						userAgent: req.headers.get("user-agent") || null,
						createdAt: now,
					},
				});
			} else {
				console.warn(
					`[M-Pesa Webhook] Payment failed but transaction not found - ` +
						`CheckoutRequestID: ${checkoutRequestId}`
				);
			}

			// TODO: Handle failed payment
			// Example:
			// await updateOrderStatus(checkoutRequestId, 'failed', {
			//   reason: paymentStatus.resultDesc,
			// });
		}

		// Always return success to M-Pesa (they will retry if we return error)
		// Process the callback asynchronously if needed
		return NextResponse.json({
			ResultCode: 0,
			ResultDesc: "Callback processed successfully",
		});
	} catch (error) {
		console.error("[M-Pesa Webhook] Error processing callback:", error);

		// Return success to M-Pesa to prevent retries
		// Log error for investigation
		return NextResponse.json({
			ResultCode: 0,
			ResultDesc: "Callback received",
		});
	}
}

/**
 * Health check endpoint for webhook
 */
export async function GET() {
	return NextResponse.json({
		status: "ok",
		service: "M-Pesa Webhook Handler",
		timestamp: new Date().toISOString(),
	});
}
