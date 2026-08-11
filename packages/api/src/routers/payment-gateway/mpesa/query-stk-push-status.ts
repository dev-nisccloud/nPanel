import * as crypto from "node:crypto";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	paymentTransaction,
	paymentTransactionActivityLog,
} from "@npanel/db/schema/payment-transactions";
import { createMpesaClientFromEnv, MpesaApiError } from "./client";
import {
	isProcessingResultCode,
	isTerminalResultCode,
} from "./error-codes";

export type StkPushQueryData = {
	responseCode: string;
	responseDescription: string;
	merchantRequestId: string;
	checkoutRequestId: string;
	resultCode: string;
	resultDesc?: string;
};

export type StkPushQueryResult = {
	success: true;
	data: StkPushQueryData;
};

const terminalFields = {
	status: true,
	gatewayStatus: true,
	gatewayMessage: true,
	merchantRequestId: true,
	checkoutRequestId: true,
} as const;

type TerminalTx = {
	status: string;
	gatewayStatus: string | null;
	gatewayMessage: string | null;
	merchantRequestId: string | null;
	checkoutRequestId: string | null;
};

function returnTerminalFromDb(tx: TerminalTx): StkPushQueryResult | null {
	if (tx.status === "SUCCESS") {
		return {
			success: true,
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
			success: true,
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
}

function processingResult(
	checkoutRequestId: string,
	resultDesc: string,
): StkPushQueryResult {
	return {
		success: true,
		data: {
			responseCode: "0",
			responseDescription: "Request processing",
			merchantRequestId: "",
			checkoutRequestId,
			resultCode: "1037",
			resultDesc,
		},
	};
}

/**
 * Daraja-first STK query scoped to a single user (storefront checkout).
 * Mirrors dashboard `paymentGateway.mpesa.queryStkPush` for instant UI feedback.
 */
export async function queryStkPushForUser(
	checkoutRequestId: string,
	userId: string,
): Promise<StkPushQueryResult> {
	const txWhere = and(
		eq(paymentTransaction.checkoutRequestId, checkoutRequestId),
		eq(paymentTransaction.userId, userId),
	);

	const getTransactionForTerminalCheck = () =>
		db.query.paymentTransaction.findFirst({
			where: txWhere,
			columns: terminalFields,
		});

	const getTransaction = () =>
		db.query.paymentTransaction.findFirst({ where: txWhere });

	const txFromDb = await getTransactionForTerminalCheck();
	if (txFromDb) {
		const terminal = returnTerminalFromDb(txFromDb);
		if (terminal) return terminal;
	}

	try {
		const mpesaClient = createMpesaClientFromEnv();
		const response = await mpesaClient.queryStkPush(checkoutRequestId);

		const resultCode = response.ResultCode;
		const resultCodeStr = String(resultCode);
		const resultCodeNum =
			typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
		const now = new Date();

		let dbTransaction = await getTransaction();
		if (!dbTransaction) {
			dbTransaction = await db.query.paymentTransaction.findFirst({
				where: eq(paymentTransaction.checkoutRequestId, checkoutRequestId),
			});
		}

		if (dbTransaction && dbTransaction.userId === userId) {
			const isSuccess = isTerminalResultCode(resultCodeNum) && resultCodeStr === "0";
			const isTerminal = isTerminalResultCode(resultCodeNum);
			await db
				.update(paymentTransaction)
				.set({
					rawResponse: isSuccess
						? JSON.parse(JSON.stringify(response))
						: dbTransaction.rawResponse,
					rawError: !isSuccess
						? JSON.parse(JSON.stringify(response))
						: dbTransaction.rawError,
					gatewayStatus: String(resultCode),
					gatewayMessage: response.ResultDesc || response.ResponseDescription,
					...(isTerminal && {
						status:
							resultCodeStr === "0"
								? "SUCCESS"
								: resultCodeNum === 1032
									? "CANCELLED"
									: "FAILED",
						...(resultCodeStr === "0"
							? {
									processedAt: now,
									...(dbTransaction.paidAmount
										? {}
										: {
												paidAmount: String(
													Math.ceil(Number.parseFloat(dbTransaction.amount) || 0),
												),
											}),
								}
							: resultCodeNum === 1032
								? {}
								: { failedAt: now }),
					}),
					updatedAt: now,
				})
				.where(eq(paymentTransaction.id, dbTransaction.id));
			await db.insert(paymentTransactionActivityLog).values({
				id: crypto.randomUUID(),
				transactionId: dbTransaction.id,
				userId: dbTransaction.userId,
				action: isSuccess
					? "QUERY_SUCCESS"
					: isTerminal
						? "QUERY_FAILED"
						: "QUERY_PROCESSING",
				description: `M-Pesa query API: ${response.ResultDesc || response.ResponseDescription}`,
				metadata: {
					resultCode: String(resultCode),
					resultDesc: response.ResultDesc,
					responseCode: response.ResponseCode,
					responseDescription: response.ResponseDescription,
					checkoutRequestId: response.CheckoutRequestID,
					merchantRequestId: response.MerchantRequestID,
				},
				ipAddress: null,
				userAgent: null,
				createdAt: now,
			});
		}

		if (isProcessingResultCode(resultCode)) {
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
		const dbTransaction = await getTransactionForTerminalCheck();
		if (dbTransaction) {
			const terminal = returnTerminalFromDb(dbTransaction);
			if (terminal) return terminal;
		}

		const txForLog = await getTransaction();
		if (txForLog) {
			const now = new Date();
			const errorCode =
				apiError instanceof MpesaApiError ? String(apiError.code) : "UNKNOWN";
			const errorMessage =
				apiError instanceof MpesaApiError
					? apiError.description
					: apiError instanceof Error
						? apiError.message
						: "Unknown error";
			await db
				.update(paymentTransaction)
				.set({
					rawError: JSON.parse(
						JSON.stringify({
							error: errorMessage,
							code: errorCode,
							timestamp: now.toISOString(),
							type: apiError instanceof MpesaApiError ? "MpesaApiError" : "Error",
						}),
					),
					gatewayStatus: errorCode,
					gatewayMessage: errorMessage,
					updatedAt: now,
				})
				.where(eq(paymentTransaction.id, txForLog.id));
		}

		const finalTx = await getTransactionForTerminalCheck();
		if (finalTx) {
			const terminal = returnTerminalFromDb(finalTx);
			if (terminal) return terminal;
		}

		if (apiError instanceof MpesaApiError) {
			const errorCode = String(apiError.code);
			const errorMessage = apiError.description || "";
			if (errorCode === "429" || errorCode.includes("429")) {
				return processingResult(checkoutRequestId, "Rate limit - request still processing");
			}
			if (
				errorCode === "403" ||
				errorCode.includes("403") ||
				errorMessage.includes("Incapsula")
			) {
				return processingResult(
					checkoutRequestId,
					"Service temporarily unavailable",
				);
			}
			if (
				errorCode.includes("500.001.1001") ||
				errorMessage.includes("request not found")
			) {
				return processingResult(checkoutRequestId, "Request not found - still processing");
			}
			if (
				errorMessage.includes("timeout") ||
				errorMessage.includes("network") ||
				errorMessage.includes("ECONNREFUSED")
			) {
				return processingResult(checkoutRequestId, "Network issue - request still processing");
			}
			return processingResult(checkoutRequestId, "Temporary error - request still processing");
		}

		return processingResult(checkoutRequestId, "Temporary error - request still processing");
	}
}
