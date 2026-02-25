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
	 * Get payment status by checkout ID (DB-only, no M-Pesa API).
	 * Used for polling after STK Push: webhook updates DB, client polls this.
	 * Matches pattern from solidarity-online-drivers-sacco (GET /api/mpesa/status).
	 */
	getPaymentStatusByCheckoutId: protectedProcedure
		.input(StkPushQueryRequestSchema)
		.query(async ({ input, ctx }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
			}
			const transaction = await prisma.paymentTransaction.findFirst({
				where: {
					checkoutRequestId: input.checkoutRequestId,
					userId: ctx.session.user.id,
				},
				select: {
					status: true,
					gatewayStatus: true,
					gatewayMessage: true,
				},
			});
			if (!transaction) {
				return { status: null, resultCode: null, resultDesc: null };
			}
			return {
				status: transaction.status,
				resultCode: transaction.gatewayStatus,
				resultDesc: transaction.gatewayMessage,
			};
		}),

	/**
	 * Query STK Push payment status (Daraja-first polling).
	 *
	 * Polls M-Pesa Daraja STK Query API first for immediate result; if Daraja returns
	 * processing/error, falls back to DB (webhook may have already updated). When Daraja
	 * returns a terminal result, we update the transaction table immediately (same as webhook).
	 *
	 * Security:
	 * - Requires authenticated user session
	 * - Validates checkout request ID; DB lookup scoped by userId
	 */
	queryStkPush: protectedProcedure
		.input(StkPushQueryRequestSchema)
		.query(async ({ input, ctx }) => {
			try {
				if (!ctx.session?.user?.id) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "Authentication required",
					});
				}

				const userId = ctx.session.user.id;

				// Lightweight read for terminal check only (status + fields needed for response)
				const terminalFields = {
					status: true,
					gatewayStatus: true,
					gatewayMessage: true,
					merchantRequestId: true,
					checkoutRequestId: true,
				} as const;
				const getTransaction = async () =>
					prisma.paymentTransaction.findFirst({
						where: {
							checkoutRequestId: input.checkoutRequestId,
							userId,
						},
					});
				const getTransactionForTerminalCheck = () =>
					prisma.paymentTransaction.findFirst({
						where: {
							checkoutRequestId: input.checkoutRequestId,
							userId,
						},
						select: terminalFields,
					});

				// Helper: return terminal state from DB (webhook already ran)
				const returnTerminalFromDb = (tx: { status: string; gatewayStatus: string | null; gatewayMessage: string | null; merchantRequestId: string | null; checkoutRequestId: string | null }) => {
					if (tx.status === "SUCCESS") {
						return {
							success: true as const,
							data: {
								responseCode: "0",
								responseDescription: "The service request is processed successfully.",
								merchantRequestId: tx.merchantRequestId || "",
								checkoutRequestId: tx.checkoutRequestId || "",
								resultCode: "0",
								resultDesc: tx.gatewayMessage || "Payment processed successfully",
							},
						};
					}
					if (tx.status === "FAILED" || tx.status === "CANCELLED") {
						const resultCode =
							tx.status === "CANCELLED"
								? "1032"
								: (() => {
										const n = tx.gatewayStatus ? parseInt(tx.gatewayStatus, 10) : null;
										return n === 1037 || n === 4999 ? "1" : tx.gatewayStatus || "1";
									})();
						return {
							success: true as const,
							data: {
								responseCode: resultCode,
								responseDescription: tx.gatewayMessage || `Payment ${tx.status.toLowerCase()}`,
								merchantRequestId: tx.merchantRequestId || "",
								checkoutRequestId: tx.checkoutRequestId || "",
								resultCode,
								resultDesc: tx.gatewayMessage || `Payment ${tx.status.toLowerCase()}`,
							},
						};
					}
					return null;
				};

				// 1) DB-first: lightweight read; if webhook already updated to terminal, return immediately (no Daraja call)
				const txFromDb = await getTransactionForTerminalCheck();
				if (txFromDb) {
					const terminal = returnTerminalFromDb(txFromDb);
					if (terminal) return terminal;
				}

				// 2) Not terminal in DB — call Daraja for current status
				try {
					const mpesaClient = createMpesaClientFromEnv();
					const response = await mpesaClient.queryStkPush(input.checkoutRequestId);

					const resultCode = response.ResultCode;
					const resultCodeStr = String(resultCode);
					const resultCodeNum = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
					const now = new Date();

					let dbTransaction = await getTransaction();
					if (!dbTransaction) {
						dbTransaction = await prisma.paymentTransaction.findFirst({
							where: { checkoutRequestId: input.checkoutRequestId },
						});
					}

					// Persist Daraja response and, if terminal, update status (same as webhook)
					if (dbTransaction) {
						const isSuccess = isTerminalResultCode(resultCodeNum) && resultCodeStr === "0";
						const isTerminal = isTerminalResultCode(resultCodeNum);
						await prisma.paymentTransaction.update({
							where: { id: dbTransaction.id },
							data: {
								rawResponse: isSuccess ? JSON.parse(JSON.stringify(response)) : dbTransaction.rawResponse,
								rawError: !isSuccess ? JSON.parse(JSON.stringify(response)) : dbTransaction.rawError,
								gatewayStatus: String(resultCode),
								gatewayMessage: response.ResultDesc || response.ResponseDescription,
								...(isTerminal && {
									status: resultCodeStr === "0" ? "SUCCESS" : resultCodeNum === 1032 ? "CANCELLED" : "FAILED",
									...(resultCodeStr === "0" ? { processedAt: now } : resultCodeNum === 1032 ? {} : { failedAt: now }),
								}),
								updatedAt: now,
							},
						});
						await prisma.paymentTransactionActivityLog.create({
							data: {
								id: crypto.randomUUID(),
								transactionId: dbTransaction.id,
								userId: dbTransaction.userId,
								action: isSuccess ? "QUERY_SUCCESS" : isTerminal ? "QUERY_FAILED" : "QUERY_PROCESSING",
								description: `M-Pesa query API: ${response.ResultDesc || response.ResponseDescription}`,
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

					if (isProcessingResultCode(resultCode)) {
						// Webhook may have already run: return DB terminal state so UI updates immediately
						const tx = await getTransactionForTerminalCheck();
						if (tx) {
							const fromDb = returnTerminalFromDb(tx);
							if (fromDb) return fromDb;
						}
						return {
							success: true,
							data: {
								responseCode: response.ResponseCode,
								responseDescription: response.ResponseDescription,
								merchantRequestId: response.MerchantRequestID,
								checkoutRequestId: response.CheckoutRequestID,
								resultCode: "1037",
								resultDesc: "Request still processing",
							},
						};
					}

					if (isTerminalResultCode(resultCode)) {
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
					// 2) Daraja failed or returned transient error → check DB (webhook may have run)
					const dbTransaction = await getTransactionForTerminalCheck();
					if (dbTransaction) {
						const terminal = returnTerminalFromDb(dbTransaction);
						if (terminal) return terminal;
					}

					// Log API error if we have a transaction (full row needed for id/userId)
					const txForLog =
						(await getTransaction()) ??
						(await prisma.paymentTransaction.findFirst({
							where: { checkoutRequestId: input.checkoutRequestId },
						}));
					if (txForLog) {
						const now = new Date();
						const errorCode = apiError instanceof MpesaApiError ? String(apiError.code) : "UNKNOWN";
						const errorMessage = apiError instanceof MpesaApiError ? apiError.description : (apiError instanceof Error ? apiError.message : "Unknown error");
						await prisma.paymentTransaction.update({
							where: { id: txForLog.id },
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
						await prisma.paymentTransactionActivityLog.create({
							data: {
								id: crypto.randomUUID(),
								transactionId: txForLog.id,
								userId: txForLog.userId,
								action: "QUERY_ERROR",
								description: `M-Pesa query API error: ${errorMessage}`,
								metadata: {
									errorCode,
									errorMessage,
									checkoutRequestId: input.checkoutRequestId,
								},
								createdAt: now,
							},
						});
					}

					// Re-check DB (webhook could have landed)
					const finalTx = await getTransactionForTerminalCheck();
					if (finalTx) {
						const terminal = returnTerminalFromDb(finalTx);
						if (terminal) return terminal;
					}

					// Return keep-polling for transient Daraja errors
					if (apiError instanceof MpesaApiError) {
						const errorCode = String(apiError.code);
						const errorMessage = apiError.description || "";

						if (errorCode === "429" || errorCode.includes("429")) {
							return { success: true, data: { responseCode: "0", responseDescription: "Request processing", merchantRequestId: "", checkoutRequestId: input.checkoutRequestId, resultCode: "1037", resultDesc: "Rate limit - request still processing" } };
						}
						if (errorCode === "403" || errorCode.includes("403") || errorMessage.includes("Incapsula")) {
							return { success: true, data: { responseCode: "0", responseDescription: "Request processing", merchantRequestId: "", checkoutRequestId: input.checkoutRequestId, resultCode: "1037", resultDesc: "Service temporarily unavailable" } };
						}
						if (errorCode.includes("500.001.1001") || errorMessage.includes("request not found")) {
							return { success: true, data: { responseCode: "0", responseDescription: "Request processing", merchantRequestId: "", checkoutRequestId: input.checkoutRequestId, resultCode: "1037", resultDesc: "Request not found - still processing" } };
						}
						if (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED")) {
							return { success: true, data: { responseCode: "0", responseDescription: "Request processing", merchantRequestId: "", checkoutRequestId: input.checkoutRequestId, resultCode: "1037", resultDesc: "Network issue - request still processing" } };
						}
						return { success: true, data: { responseCode: "0", responseDescription: "Request processing", merchantRequestId: "", checkoutRequestId: input.checkoutRequestId, resultCode: "1037", resultDesc: "Temporary error - request still processing" } };
					}

					return {
						success: true,
						data: {
							responseCode: "0",
							responseDescription: "Request processing",
							merchantRequestId: "",
							checkoutRequestId: input.checkoutRequestId,
							resultCode: "1037",
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
