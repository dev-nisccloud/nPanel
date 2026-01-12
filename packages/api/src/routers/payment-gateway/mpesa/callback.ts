import { z } from "zod";
import { MpesaCallbackSchema, type ParsedCallbackMetadata } from "./types";
import { getMpesaResultCodeInfo } from "./error-codes";

/**
 * Parse M-Pesa callback metadata
 * Extracts useful information from the callback payload
 */
export function parseCallbackMetadata(
	items: Array<{ Name: string; Value: string | number }>
): ParsedCallbackMetadata {
	const metadata: ParsedCallbackMetadata = {};

	for (const item of items) {
		switch (item.Name) {
			case "Amount":
				metadata.amount = typeof item.Value === "number" ? item.Value : parseFloat(String(item.Value));
				break;
			case "MpesaReceiptNumber":
				metadata.mpesaReceiptNumber = String(item.Value);
				break;
			case "TransactionDate":
				metadata.transactionDate = String(item.Value);
				break;
			case "PhoneNumber":
				metadata.phoneNumber = String(item.Value);
				break;
			case "Balance":
				metadata.balance = typeof item.Value === "number" ? item.Value : parseFloat(String(item.Value));
				break;
		}
	}

	return metadata;
}

/**
 * Validate M-Pesa callback payload
 * 
 * Security: Validates the structure of the callback to ensure it's from M-Pesa
 */
export function validateMpesaCallback(payload: unknown): z.infer<typeof MpesaCallbackSchema> {
	try {
		return MpesaCallbackSchema.parse(payload);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(
				`Invalid M-Pesa callback structure: ${error.issues.map((i) => i.message).join(", ")}`
			);
		}
		throw error;
	}
}

/**
 * Check if callback indicates successful payment
 */
export function isPaymentSuccessful(callback: z.infer<typeof MpesaCallbackSchema>): boolean {
	return callback.Body.stkCallback.ResultCode === 0;
}

/**
 * Get payment status from callback
 */
export function getPaymentStatus(callback: z.infer<typeof MpesaCallbackSchema>): {
	success: boolean;
	resultCode: number;
	resultDesc: string;
	resultCodeInfo?: { description: string; explanation: string };
	metadata?: ParsedCallbackMetadata;
} {
	const stkCallback = callback.Body.stkCallback;
	const success = stkCallback.ResultCode === 0;

	const resultCodeInfo = getMpesaResultCodeInfo(stkCallback.ResultCode);

	const result: {
		success: boolean;
		resultCode: number;
		resultDesc: string;
		resultCodeInfo?: { description: string; explanation: string };
		metadata?: ParsedCallbackMetadata;
	} = {
		success,
		resultCode: stkCallback.ResultCode,
		resultDesc: stkCallback.ResultDesc,
		resultCodeInfo: resultCodeInfo || undefined,
	};

	if (success && stkCallback.CallbackMetadata?.Item) {
		result.metadata = parseCallbackMetadata(stkCallback.CallbackMetadata.Item);
	}

	return result;
}
