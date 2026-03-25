import prisma from "@npanel/db";
// Note: These utilities need to be exported from the api package
// For now, we'll import them directly - in production, export them from packages/api/src/index.ts
import {
	validateMpesaCallback,
	getPaymentStatus,
	isPaymentSuccessful,
} from "@npanel/api/routers/payment-gateway/mpesa/callback";
import { sendEmail } from "@npanel/api/lib/email";
import { renderPaymentReceiptEmail } from "@npanel/api/lib/email-templates";

/**
 * M-Pesa Webhook Handler
 * 
 * This endpoint receives callbacks from M-Pesa after a payment is processed.
 * 
 * Security measures:
 * 1. IP Whitelist validation (M-Pesa IPs only) - TEMPORARILY DISABLED
 * 2. Request origin validation
 * 3. Payload structure validation
 * 4. Rate limiting (handled upstream)
 * 5. Logging for audit trail
 * 
 * Note: M-Pesa doesn't provide signature verification in STK Push callbacks,
 * so we rely on IP whitelisting and payload validation.
 * 
 * M-Pesa IP ranges (for reference - should be configured in firewall/load balancer):
 * - Sandbox: 196.201.214.0/24, 196.201.214.18, 196.201.214.19
 * - Live: 196.201.214.0/24, 196.201.214.18, 196.201.214.19, 196.201.214.20
 */
export async function POST(req: Request) {
	try {
		// Security: Validate request origin (logging only for now)
		const clientIp = req.headers.get("x-forwarded-for") ||
			req.headers.get("x-real-ip") ||
			"unknown";

		// Log incoming request for audit
		console.log(`[M-Pesa Webhook] Received callback from IP: ${clientIp}`);
		console.log(`[M-Pesa Webhook] Request headers:`, {
			contentType: req.headers.get("content-type"),
			contentLength: req.headers.get("content-length"),
			userAgent: req.headers.get("user-agent"),
		});

		// TODO: IP Whitelist validation - Temporarily disabled, will be implemented later
		// Optional: Validate IP whitelist (should be configured at infrastructure level)
		// For production, configure this at your load balancer/firewall level
		// const allowedIps = process.env.MPESA_ALLOWED_IPS?.split(",") || [];
		// if (allowedIps.length > 0 && !allowedIps.includes(clientIp) && clientIp !== "unknown") {
		// 	console.warn(`[M-Pesa Webhook] Rejected request from unauthorized IP: ${clientIp}`);
		// 	return Response.json(
		// 		{ error: "Unauthorized" },
		// 		{ status: 403 }
		// 	);
		// }

		// Parse and validate request body
		let body;
		let rawBodyText: string | null = null;
		try {
			// Check if body exists and has content
			rawBodyText = await req.text();

			if (!rawBodyText || rawBodyText.trim().length === 0) {
				console.warn("[M-Pesa Webhook] Received empty request body - returning success to prevent retries");
				// Return success to M-Pesa to prevent retries for empty/test requests
				return Response.json({
					ResultCode: 0,
					ResultDesc: "Empty request received",
				});
			}

			// Parse JSON
			body = JSON.parse(rawBodyText);
		} catch (parseError) {
			console.error("[M-Pesa Webhook] Failed to parse request body:", parseError);
			console.error("[M-Pesa Webhook] Raw body text:", rawBodyText || "Unable to read body");

			// Return success to M-Pesa to prevent retries for malformed requests
			// Log the error for investigation
			return Response.json({
				ResultCode: 0,
				ResultDesc: "Request body parsing failed",
			});
		}

		// Log raw body for debugging (remove in production if needed)
		console.log("[M-Pesa Webhook] Raw callback body:", JSON.stringify(body, null, 2));

		// Validate callback structure
		let validatedCallback;
		try {
			validatedCallback = validateMpesaCallback(body);
		} catch (error) {
			console.error("[M-Pesa Webhook] Invalid callback structure:", error);
			console.error("[M-Pesa Webhook] Received body structure:", {
				hasBody: !!body.Body,
				hasStkCallback: !!body.Body?.stkCallback,
				keys: Object.keys(body),
				bodyKeys: body.Body ? Object.keys(body.Body) : [],
			});
			return Response.json(
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

				// Send payment receipt email after DB transaction is recorded
				try {
					// Get user email
					const user = await prisma.user.findUnique({
						where: { id: transaction.userId },
						select: { email: true, name: true },
					});

					if (user?.email) {
						// Format transaction date
						const transactionDate = paymentStatus.metadata?.transactionDate
							? new Date(String(paymentStatus.metadata.transactionDate).replace(
								/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
								"$1-$2-$3T$4:$5:$6"
							)).toLocaleString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								timeZoneName: "short",
							})
							: new Date().toLocaleString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								timeZoneName: "short",
							});

						// Format amount
						const formattedAmount = paymentStatus.metadata?.amount
							? new Intl.NumberFormat("en-US", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							}).format(paymentStatus.metadata.amount)
							: transaction.amount;

						// Render and send email
						const emailHtml = await renderPaymentReceiptEmail({
							customerName: user.name || "Valued Customer",
							receiptNumber: paymentStatus.metadata?.mpesaReceiptNumber || "N/A",
							transactionDate: transactionDate,
							amount: formattedAmount,
							currency: transaction.currency || "KES",
							paymentMethod: "M-Pesa",
							supportEmail: "support@nisccloud.com",
							supportPhone: "+254 748 777 666",
						});

						await sendEmail({
							to: user.email,
							subject: `Payment Receipt - ${paymentStatus.metadata?.mpesaReceiptNumber || "Payment Confirmed"}`,
							html: emailHtml,
						});

						console.log(
							`[M-Pesa Webhook] Payment receipt email sent to ${user.email} for transaction ${transaction.id}`
						);
					}
				} catch (emailError) {
					console.error(
						`[M-Pesa Webhook] Failed to send payment receipt email for transaction ${transaction.id}:`,
						emailError
					);
					// Don't fail the webhook if email fails
				}
			} else {
				console.warn(
					`[M-Pesa Webhook] Payment successful but transaction not found - ` +
					`CheckoutRequestID: ${checkoutRequestId}`
				);
			}
		} else {
			console.warn(
				`[M-Pesa Webhook] Payment failed - ` +
				`ResultCode: ${paymentStatus.resultCode}, ` +
				`ResultDesc: ${paymentStatus.resultDesc}`
			);

			// Determine transaction status based on result code
			// ResultCode 1032 = Request cancelled by user -> CANCELLED
			// All other error codes -> FAILED
			const transactionStatus = paymentStatus.resultCode === 1032 ? "CANCELLED" : "FAILED";

			// Update transaction if found
			if (transaction) {
				await prisma.paymentTransaction.update({
					where: { id: transaction.id },
					data: {
						status: transactionStatus,
						gatewayStatus: String(paymentStatus.resultCode),
						gatewayMessage: paymentStatus.resultDesc,
						rawError: JSON.parse(JSON.stringify(validatedCallback)),
						failedAt: transactionStatus === "FAILED" ? now : null,
						updatedAt: now,
					},
				});

				// Create activity log for failed/cancelled payment
				await prisma.paymentTransactionActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						transactionId: transaction.id,
						userId: transaction.userId,
						action: transactionStatus === "CANCELLED" ? "CANCEL" : "FAIL",
						description: transactionStatus === "CANCELLED"
							? `Payment cancelled by user: ${paymentStatus.resultDesc}`
							: `Payment failed: ${paymentStatus.resultDesc}`,
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
		return Response.json({
			ResultCode: 0,
			ResultDesc: "Callback processed successfully",
		});
	} catch (error) {
		console.error("[M-Pesa Webhook] Error processing callback:", error);

		// Return success to M-Pesa to prevent retries
		// Log error for investigation
		return Response.json({
			ResultCode: 0,
			ResultDesc: "Callback received",
		});
	}
}

/**
 * Health check endpoint for webhook
 */
export async function GET() {
	return Response.json({
		status: "ok",
		service: "M-Pesa Webhook Handler",
		timestamp: new Date().toISOString(),
	});
}
