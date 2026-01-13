import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../../trpc";
import prisma from "@nPanel/db";
import {
	createMpesaClientFromEnv,
	MpesaApiError,
} from "./client";
import {
	StkPushRequestSchema,
	StkPushQueryRequestSchema,
} from "./types";
import {
	isTerminalResultCode,
	isProcessingResultCode,
} from "./error-codes";

/**
 * M-Pesa payment gateway router
 * 
 * Security measures implemented:
 * - All endpoints require authentication (protectedProcedure)
 * - Input validation using Zod schemas
 * - No hardcoded credentials (all from environment variables)
 * - Phone number sanitization and validation
 * - Amount validation (positive numbers only)
 * - Error handling without exposing sensitive information
 */
export const mpesaRouter = router({
	/**
	 * Initiate STK Push payment request
	 * 
	 * This endpoint initiates an M-Pesa STK Push payment request.
	 * The user will receive a prompt on their phone to enter their M-Pesa PIN.
	 * 
	 * Security:
	 * - Requires authenticated user session
	 * - Validates phone number format
	 * - Validates amount (must be positive)
	 * - All credentials from environment variables
	 */
	initiateStkPush: protectedProcedure
		.input(StkPushRequestSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				// Verify user is authenticated
				if (!ctx.session?.user?.id) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "Authentication required",
					});
				}

				const userId = ctx.session.user.id;
				const now = new Date();

				// Create M-Pesa client
				const mpesaClient = createMpesaClientFromEnv();

				// Initiate STK Push
				const response = await mpesaClient.initiateStkPush({
					phoneNumber: input.phoneNumber,
					amount: input.amount,
					accountReference: input.accountReference,
					transactionDesc: input.transactionDesc,
					callbackUrl: input.callbackUrl,
				});

				// Create payment transaction record
				const transactionId = crypto.randomUUID();
				const transaction = await prisma.paymentTransaction.create({
					data: {
						id: transactionId,
						userId,
						teamId: input.teamId || null,
						gateway: "MPESA",
						gatewayStatus: response.ResponseCode,
						gatewayMessage: response.ResponseDescription,
						merchantRequestId: response.MerchantRequestID,
						checkoutRequestId: response.CheckoutRequestID,
						amount: input.amount.toString(),
						currency: "KES",
						accountReference: input.accountReference || null,
						transactionDesc: input.transactionDesc || null,
						phoneNumber: input.phoneNumber,
						status: response.ResponseCode === "0" ? "PROCESSING" : "PENDING",
						rawResponse: JSON.parse(JSON.stringify(response)),
						initiatedAt: now,
						createdAt: now,
						updatedAt: now,
					},
				});

				// Create activity log for transaction initiation
				await prisma.paymentTransactionActivityLog.create({
					data: {
						id: crypto.randomUUID(),
						transactionId: transaction.id,
						userId,
						action: "INITIATE",
						description: `M-Pesa STK Push initiated. Response: ${response.ResponseDescription}`,
						metadata: {
							phoneNumber: input.phoneNumber,
							amount: input.amount,
							merchantRequestId: response.MerchantRequestID,
							checkoutRequestId: response.CheckoutRequestID,
						},
						ipAddress: null, // Can be added later if needed
						userAgent: null, // Can be added later if needed
						createdAt: now,
					},
				});


				return {
					success: true,
					data: {
						transactionId: transaction.id,
						merchantRequestId: response.MerchantRequestID,
						checkoutRequestId: response.CheckoutRequestID,
						responseCode: response.ResponseCode,
						responseDescription: response.ResponseDescription,
						customerMessage: response.CustomerMessage,
					},
				};
			} catch (error) {
				console.error("[M-Pesa] STK Push initiation error:", error);

				// Handle M-Pesa API errors
				if (error instanceof MpesaApiError) {
					// Log error transaction if we have user context
					if (ctx.session?.user?.id) {
						try {
							const userId = ctx.session.user.id;
							const now = new Date();
							const transactionId = crypto.randomUUID();

							await prisma.paymentTransaction.create({
								data: {
									id: transactionId,
									userId,
									teamId: input.teamId || null,
									gateway: "MPESA",
									gatewayStatus: String(error.code),
									gatewayMessage: error.description,
									amount: input.amount.toString(),
									currency: "KES",
									accountReference: input.accountReference || null,
									transactionDesc: input.transactionDesc || null,
									phoneNumber: input.phoneNumber,
									status: "FAILED",
									rawError: JSON.parse(
										JSON.stringify({
											code: error.code,
											description: error.description,
											errorInfo: error.errorInfo
												? {
														code: error.errorInfo.code,
														message: error.errorInfo.message,
														mitigation: error.errorInfo.mitigation,
														httpCode: error.errorInfo.httpCode,
														retryable: error.errorInfo.retryable,
														retryAfter: error.errorInfo.retryAfter,
													}
												: null,
											originalError: error.originalError?.message || null,
										})
									),
									initiatedAt: now,
									failedAt: now,
									createdAt: now,
									updatedAt: now,
								},
							});

							// Create activity log for failed transaction
							await prisma.paymentTransactionActivityLog.create({
								data: {
									id: crypto.randomUUID(),
									transactionId,
									userId,
									action: "FAIL",
									description: `M-Pesa STK Push initiation failed: ${error.description}`,
									metadata: {
										errorCode: error.code,
										errorDescription: error.description,
										errorInfo: error.errorInfo
											? {
													code: error.errorInfo.code,
													message: error.errorInfo.message,
													mitigation: error.errorInfo.mitigation,
													httpCode: error.errorInfo.httpCode,
													retryable: error.errorInfo.retryable,
													retryAfter: error.errorInfo.retryAfter,
												}
											: null,
										retryable: error.retryable,
										retryAfter: error.retryAfter,
										phoneNumber: input.phoneNumber,
										amount: input.amount,
									},
									ipAddress: null,
									userAgent: null,
									createdAt: now,
								},
							});
						} catch (dbError) {
							// Log database error but don't fail the request
							console.error("[M-Pesa] Failed to log error transaction:", dbError);
						}
					}

					// Log error with full details
					console.error(
						`[M-Pesa] API Error - Code: ${error.code}, ` +
							`Description: ${error.description}, ` +
							`Retryable: ${error.retryable}, ` +
							`RetryAfter: ${error.retryAfter || "N/A"}s`
					);

					throw new TRPCError({
						code: error.retryable ? "TIMEOUT" : "BAD_REQUEST",
						message: error.description || "M-Pesa API error occurred",
						cause: {
							code: error.code,
							description: error.description,
							errorInfo: error.errorInfo,
							retryable: error.retryable,
							retryAfter: error.retryAfter,
						},
					});
				}

				// Handle validation errors
				if (error instanceof z.ZodError) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid request data",
						cause: error.issues.map((issue) => ({
							field: issue.path.join("."),
							message: issue.message,
						})),
					});
				}

				// Handle tRPC errors (re-throw)
				if (error instanceof TRPCError) {
					throw error;
				}

				// Handle unexpected errors (don't expose internal details)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to initiate payment. Please try again later.",
				});
			}
		}),

	/**
	 * Query STK Push payment status
	 * 
	 * This endpoint queries the status of a previously initiated STK Push payment.
	 * 
	 * Security:
	 * - Requires authenticated user session
	 * - Validates checkout request ID
	 * - All credentials from environment variables
	 */
	queryStkPush: protectedProcedure
		.input(StkPushQueryRequestSchema)
		.query(async ({ input, ctx }) => {
			try {
				// Verify user is authenticated
				if (!ctx.session?.user?.id) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "Authentication required",
					});
				}

				// ALWAYS check database FIRST before calling M-Pesa API
				// This is critical because the webhook processes asynchronously
				// and we want to avoid unnecessary API calls that might hit rate limits
				const transaction = await prisma.paymentTransaction.findFirst({
					where: {
						checkoutRequestId: input.checkoutRequestId,
						userId: ctx.session.user.id, // Ensure user owns this transaction
					},
				});

				// If transaction exists and is in a terminal state, return immediately
				// This handles the case where webhook processed it but M-Pesa API query hasn't updated yet
				if (transaction) {
					if (transaction.status === "SUCCESS") {
						return {
							success: true,
							data: {
								responseCode: "0",
								responseDescription: "The service request is processed successfully.",
								merchantRequestId: transaction.merchantRequestId || "",
								checkoutRequestId: transaction.checkoutRequestId || "",
								resultCode: "0", // Success
								resultDesc: transaction.gatewayMessage || "Payment processed successfully",
							},
						};
					}

					// Handle failed or cancelled transactions
					if (transaction.status === "FAILED" || transaction.status === "CANCELLED") {
						// CRITICAL: When transaction is in terminal state in DB, we must return a terminal resultCode
						// Even if gatewayStatus is "1037" (which normally means "keep polling"), if the transaction
						// is FAILED/CANCELLED in DB, it means the webhook already processed it as terminal
						let resultCode: string;
						if (transaction.status === "CANCELLED") {
							resultCode = "1032"; // Cancelled
						} else {
							// For FAILED, use gatewayStatus if it's a terminal code, otherwise use "1" (generic failure)
							const gatewayStatusNum = transaction.gatewayStatus ? parseInt(transaction.gatewayStatus, 10) : null;
							// If gatewayStatus is 1037 or 4999 (processing codes), but transaction is FAILED,
							// it means webhook processed it as terminal, so use "1" (generic failure)
							if (gatewayStatusNum === 1037 || gatewayStatusNum === 4999) {
								resultCode = "1"; // Generic failure - transaction is terminal
							} else {
								resultCode = transaction.gatewayStatus || "1";
							}
						}
						
						return {
							success: true,
							data: {
								responseCode: resultCode,
								responseDescription: transaction.gatewayMessage || `Payment ${transaction.status.toLowerCase()}`,
								merchantRequestId: transaction.merchantRequestId || "",
								checkoutRequestId: transaction.checkoutRequestId || "",
								resultCode: resultCode,
								resultDesc: transaction.gatewayMessage || `Payment ${transaction.status.toLowerCase()}`,
							},
						};
					}
				}

				// CRITICAL: Only query M-Pesa API if transaction doesn't exist or is still pending
				// NEVER query M-Pesa API if transaction is already terminal in database
				// This prevents rate limiting and ensures we return terminal state immediately
				if (transaction && (transaction.status === "SUCCESS" || transaction.status === "FAILED" || transaction.status === "CANCELLED")) {
					// Transaction is already terminal - we should have returned above, but double-check
					// Return the terminal state from database (should have been returned above, but safety check)
					const terminalResultCode = transaction.status === "SUCCESS" 
						? "0" 
						: transaction.status === "CANCELLED" 
						? "1032" 
						: transaction.gatewayStatus || "1";
					return {
						success: true,
						data: {
							responseCode: terminalResultCode,
							responseDescription: transaction.gatewayMessage || `Payment ${transaction.status.toLowerCase()}`,
							merchantRequestId: transaction.merchantRequestId || "",
							checkoutRequestId: transaction.checkoutRequestId || "",
							resultCode: terminalResultCode,
							resultDesc: transaction.gatewayMessage || `Payment ${transaction.status.toLowerCase()}`,
						},
					};
				}
				
				// Only query M-Pesa API if transaction doesn't exist or is still pending
				// This reduces API calls and avoids rate limiting
				try {
					const mpesaClient = createMpesaClientFromEnv();
					const response = await mpesaClient.queryStkPush(input.checkoutRequestId);

					const resultCode = response.ResultCode;
					const resultCodeStr = String(resultCode);
					const resultCodeNum = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
					const now = new Date();

					// Log API response to database - find or create transaction
					let dbTransaction = transaction;
					if (!dbTransaction) {
						// Transaction might not exist yet, try to find it
						dbTransaction = await prisma.paymentTransaction.findFirst({
							where: {
								checkoutRequestId: input.checkoutRequestId,
							},
						});
					}

					// If transaction exists, log the query response
					if (dbTransaction) {
						// Update transaction with query response
						await prisma.paymentTransaction.update({
							where: { id: dbTransaction.id },
							data: {
								// Store raw response in rawResponse or rawError based on result
								rawResponse: isTerminalResultCode(resultCodeNum) && resultCodeStr === "0"
									? JSON.parse(JSON.stringify(response))
									: dbTransaction.rawResponse,
								rawError: !isTerminalResultCode(resultCodeNum) || resultCodeStr !== "0"
									? JSON.parse(JSON.stringify(response))
									: dbTransaction.rawError,
								gatewayStatus: String(resultCode),
								gatewayMessage: response.ResultDesc || response.ResponseDescription,
								updatedAt: now,
							},
						});

						// Create activity log for query response
						await prisma.paymentTransactionActivityLog.create({
							data: {
								id: crypto.randomUUID(),
								transactionId: dbTransaction.id,
								userId: ctx.session.user.id,
								action: isTerminalResultCode(resultCodeNum) && resultCodeStr === "0"
									? "QUERY_SUCCESS"
									: isTerminalResultCode(resultCodeNum)
									? "QUERY_FAILED"
									: "QUERY_PROCESSING",
								description: `M-Pesa query API response: ${response.ResultDesc || response.ResponseDescription}`,
								metadata: {
									resultCode: String(resultCode),
									resultDesc: response.ResultDesc,
									responseCode: response.ResponseCode,
									responseDescription: response.ResponseDescription,
									checkoutRequestId: response.CheckoutRequestID,
									merchantRequestId: response.MerchantRequestID,
								},
								createdAt: now,
							},
						});
					}
					
					// Check if this is a processing code (continue polling)
					if (isProcessingResultCode(resultCode)) {
						// Return a "processing" response to continue polling
						return {
							success: true,
							data: {
								responseCode: response.ResponseCode,
								responseDescription: response.ResponseDescription,
								merchantRequestId: response.MerchantRequestID,
								checkoutRequestId: response.CheckoutRequestID,
								resultCode: "1037", // Use 1037 to indicate "keep polling"
								resultDesc: "Request still processing",
							},
						};
					}

					// Check if this is a terminal code (stop polling)
					if (isTerminalResultCode(resultCode)) {
						// If resultCode is 0 (success), update transaction in DB if not already updated
						const resultCodeStr = String(resultCode);
						if (resultCodeStr === "0") {
							if (transaction && transaction.status !== "SUCCESS") {
								await prisma.paymentTransaction.update({
									where: { id: transaction.id },
									data: {
										status: "SUCCESS",
										gatewayStatus: "0",
										gatewayMessage: response.ResultDesc,
										updatedAt: new Date(),
									},
								});
							}
						}
						
						// Return the actual result code (terminal state)
						return {
							success: true,
							data: {
								responseCode: response.ResponseCode,
								responseDescription: response.ResponseDescription,
								merchantRequestId: response.MerchantRequestID,
								checkoutRequestId: response.CheckoutRequestID,
								resultCode: String(resultCode),
								resultDesc: response.ResultDesc,
							},
						};
					}

					// Unknown code - return as-is (likely terminal)
					return {
						success: true,
						data: {
							responseCode: response.ResponseCode,
							responseDescription: response.ResponseDescription,
							merchantRequestId: response.MerchantRequestID,
							checkoutRequestId: response.CheckoutRequestID,
							resultCode: String(resultCode),
							resultDesc: response.ResultDesc,
						},
					};
				} catch (apiError) {
					const now = new Date();
					
					// Log API error to database
					let dbTransaction = transaction;
					if (!dbTransaction) {
						dbTransaction = await prisma.paymentTransaction.findFirst({
							where: {
								checkoutRequestId: input.checkoutRequestId,
							},
						});
					}

					// Log the API error if transaction exists
					if (dbTransaction) {
						const errorCode = apiError instanceof MpesaApiError ? String(apiError.code) : "UNKNOWN";
						const errorMessage = apiError instanceof MpesaApiError ? apiError.description : (apiError instanceof Error ? apiError.message : "Unknown error");

						// Update transaction with error
						await prisma.paymentTransaction.update({
							where: { id: dbTransaction.id },
							data: {
								rawError: JSON.parse(JSON.stringify({
									error: errorMessage,
									code: errorCode,
									timestamp: now.toISOString(),
									type: apiError instanceof MpesaApiError ? "MpesaApiError" : "Error",
								})),
								gatewayStatus: errorCode,
								gatewayMessage: errorMessage,
								updatedAt: now,
							},
						});

						// Create activity log for API error
						await prisma.paymentTransactionActivityLog.create({
							data: {
								id: crypto.randomUUID(),
								transactionId: dbTransaction.id,
								userId: ctx.session.user.id,
								action: "QUERY_ERROR",
								description: `M-Pesa query API error: ${errorMessage}`,
								metadata: {
									errorCode: errorCode,
									errorMessage: errorMessage,
									errorType: apiError instanceof MpesaApiError ? "MpesaApiError" : "Error",
									checkoutRequestId: input.checkoutRequestId,
								},
								createdAt: now,
							},
						});
					}

					// CRITICAL: Before returning "keep polling", check DB status again
					// The webhook may have updated the transaction while we were making the API call
					const finalDbTransaction = dbTransaction || await prisma.paymentTransaction.findFirst({
						where: {
							checkoutRequestId: input.checkoutRequestId,
							userId: ctx.session.user.id,
						},
					});

					// If transaction is in terminal state, return that instead of "keep polling"
					if (finalDbTransaction) {
						if (finalDbTransaction.status === "SUCCESS") {
							return {
								success: true,
								data: {
									responseCode: "0",
									responseDescription: "The service request is processed successfully.",
									merchantRequestId: finalDbTransaction.merchantRequestId || "",
									checkoutRequestId: finalDbTransaction.checkoutRequestId || "",
									resultCode: "0",
									resultDesc: finalDbTransaction.gatewayMessage || "Payment processed successfully",
								},
							};
						}

						if (finalDbTransaction.status === "FAILED" || finalDbTransaction.status === "CANCELLED") {
							// CRITICAL: When transaction is terminal in DB, return terminal resultCode
							let resultCode: string;
							if (finalDbTransaction.status === "CANCELLED") {
								resultCode = "1032"; // Cancelled
							} else {
								// For FAILED, if gatewayStatus is processing code (1037/4999), use "1" (terminal)
								const gatewayStatusNum = finalDbTransaction.gatewayStatus ? parseInt(finalDbTransaction.gatewayStatus, 10) : null;
								if (gatewayStatusNum === 1037 || gatewayStatusNum === 4999) {
									resultCode = "1"; // Generic failure - transaction is terminal
								} else {
									resultCode = finalDbTransaction.gatewayStatus || "1";
								}
							}
							return {
								success: true,
								data: {
									responseCode: resultCode,
									responseDescription: finalDbTransaction.gatewayMessage || `Payment ${finalDbTransaction.status.toLowerCase()}`,
									merchantRequestId: finalDbTransaction.merchantRequestId || "",
									checkoutRequestId: finalDbTransaction.checkoutRequestId || "",
									resultCode: resultCode,
									resultDesc: finalDbTransaction.gatewayMessage || `Payment ${finalDbTransaction.status.toLowerCase()}`,
								},
							};
						}
					}

					// Handle M-Pesa API errors gracefully
					// Only continue polling for temporary errors, not terminal states
					if (apiError instanceof MpesaApiError) {
						const errorCode = String(apiError.code);
						const errorMessage = apiError.description || "";

						// Handle rate limiting (429) - temporary error, continue polling
						if (errorCode === "429" || errorCode.includes("429")) {
							return {
								success: true,
								data: {
									responseCode: "0",
									responseDescription: "Request processing",
									merchantRequestId: "",
									checkoutRequestId: input.checkoutRequestId,
									resultCode: "1037", // Use 1037 to indicate "keep polling"
									resultDesc: "Rate limit - request still processing",
								},
							};
						}

						// Handle 403 errors (Incapsula blocking, access token issues)
						// These are often temporary, but if persistent, should be treated as terminal
						// For now, continue polling but with a note that this might indicate a problem
						if (errorCode === "403" || errorCode.includes("403") || errorMessage.includes("Incapsula")) {
							return {
								success: true,
								data: {
									responseCode: "0",
									responseDescription: "Request processing",
									merchantRequestId: "",
									checkoutRequestId: input.checkoutRequestId,
									resultCode: "1037", // Use 1037 to indicate "keep polling"
									resultDesc: "Service temporarily unavailable - request still processing",
								},
							};
						}

						// Handle "request not found" error (500.001.1001) - this is expected during early polling
						if (errorCode.includes("500.001.1001") || errorMessage.includes("request not found")) {
							return {
								success: true,
								data: {
									responseCode: "0",
									responseDescription: "Request processing",
									merchantRequestId: "",
									checkoutRequestId: input.checkoutRequestId,
									resultCode: "1037", // Use 1037 to indicate "keep polling"
									resultDesc: "Request not found - still processing",
								},
							};
						}

						// Handle network/timeout errors - temporary, continue polling
						if (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED")) {
							return {
								success: true,
								data: {
									responseCode: "0",
									responseDescription: "Request processing",
									merchantRequestId: "",
									checkoutRequestId: input.checkoutRequestId,
									resultCode: "1037", // Use 1037 to indicate "keep polling"
									resultDesc: "Network issue - request still processing",
								},
							};
						}

						// For other API errors, continue polling (might be temporary)
						return {
							success: true,
							data: {
								responseCode: "0",
								responseDescription: "Request processing",
								merchantRequestId: "",
								checkoutRequestId: input.checkoutRequestId,
								resultCode: "1037", // Use 1037 to indicate "keep polling"
								resultDesc: "Temporary error - request still processing",
							},
						};
					}

					// For non-MpesaApiError errors, log and continue polling
					console.error(
						`[M-Pesa] Unexpected error during query (continuing to poll):`,
						apiError
					);
					return {
						success: true,
						data: {
							responseCode: "0",
							responseDescription: "Request processing",
							merchantRequestId: "",
							checkoutRequestId: input.checkoutRequestId,
							resultCode: "1037", // Use 1037 to indicate "keep polling"
							resultDesc: "Temporary error - request still processing",
						},
					};
				}
			} catch (error) {
				// This catch block should rarely be hit now since we handle most errors above
				console.error("[M-Pesa] STK Push query error (unhandled):", error);

				// Handle validation errors
				if (error instanceof z.ZodError) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid request data",
						cause: error.issues.map((issue) => ({
							field: issue.path.join("."),
							message: issue.message,
						})),
					});
				}

				// Handle tRPC errors (re-throw)
				if (error instanceof TRPCError) {
					throw error;
				}

				// Handle unexpected errors (don't expose internal details)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to query payment status. Please try again later.",
				});
			}
		}),
});
