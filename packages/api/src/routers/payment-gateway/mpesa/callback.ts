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
		// Skip items without values
		if (item.Value === undefined || item.Value === null) {
			continue;
		}

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
	const resultCode = callback.Body.stkCallback.ResultCode;
	// Handle both number and string (0 or "0" means success)
	if (typeof resultCode === "number") {
		return resultCode === 0;
	}
	return resultCode === "0";
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
	// Ensure ResultCode is a number (schema transform should handle this, but double-check)
	const resultCode = typeof stkCallback.ResultCode === "string" 
		? parseInt(stkCallback.ResultCode, 10) 
		: stkCallback.ResultCode;
	const success = resultCode === 0;

	const resultCodeInfo = getMpesaResultCodeInfo(stkCallback.ResultCode);

	const result: {
		success: boolean;
		resultCode: number;
		resultDesc: string;
		resultCodeInfo?: { description: string; explanation: string };
		metadata?: ParsedCallbackMetadata;
	} = {
		success,
		resultCode,
		resultDesc: stkCallback.ResultDesc,
		resultCodeInfo: resultCodeInfo || undefined,
	};

	if (success && stkCallback.CallbackMetadata?.Item) {
		// Filter out items with undefined values before parsing
		const itemsWithValues = stkCallback.CallbackMetadata.Item.filter(
			(item): item is { Name: string; Value: string | number } => 
				item.Value !== undefined && item.Value !== null
		);
		if (itemsWithValues.length > 0) {
			result.metadata = parseCallbackMetadata(itemsWithValues);
		}
	}

	return result;
}
