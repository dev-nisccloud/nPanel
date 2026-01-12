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

				// Log successful initiation (without sensitive data)
				console.log(
					`[M-Pesa] STK Push initiated for user ${userId}, ` +
						`Transaction ID: ${transaction.id}, ` +
						`CheckoutRequestID: ${response.CheckoutRequestID}`
				);

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

				// Create M-Pesa client
				const mpesaClient = createMpesaClientFromEnv();

				// Query STK Push status
				const response = await mpesaClient.queryStkPush(input.checkoutRequestId);

				// Log query (without sensitive data)
				console.log(
					`[M-Pesa] STK Push query for user ${ctx.session.user.id}, ` +
						`CheckoutRequestID: ${input.checkoutRequestId}, ` +
						`ResultCode: ${response.ResultCode}`
				);

				return {
					success: true,
					data: {
						responseCode: response.ResponseCode,
						responseDescription: response.ResponseDescription,
						merchantRequestId: response.MerchantRequestID,
						checkoutRequestId: response.CheckoutRequestID,
						resultCode: response.ResultCode,
						resultDesc: response.ResultDesc,
					},
				};
			} catch (error) {
				console.error("[M-Pesa] STK Push query error:", error);

				// Handle M-Pesa API errors
				if (error instanceof MpesaApiError) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: error.description || "M-Pesa API error occurred",
						cause: {
							code: error.code,
							description: error.description,
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
					message: "Failed to query payment status. Please try again later.",
				});
			}
		}),
});
