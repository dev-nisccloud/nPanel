/**
 * M-Pesa API Error Codes and Mappings
 * Based on official M-Pesa Daraja API documentation
 */

export interface MpesaErrorInfo {
	code: string;
	message: string;
	mitigation: string;
	httpCode: number;
	retryable: boolean;
	retryAfter?: number; // seconds
}

/**
 * Common M-Pesa API error codes
 */
export const MPESA_ERROR_CODES: Record<string, MpesaErrorInfo> = {
	"400.002.02": {
		code: "400.002.02",
		message: "Bad Request – Invalid parameter",
		mitigation: "Ensure the request payload is set as per API documentation",
		httpCode: 400,
		retryable: false,
	},
	"404.001.03": {
		code: "404.001.03",
		message: "Invalid Access Token",
		mitigation: "Regenerate a new access token and use it before one hour expiry period. Also ensure you're using the correct consumer key and consumer secret",
		httpCode: 404,
		retryable: true,
		retryAfter: 0, // Retry immediately with new token
	},
	"404.001.01": {
		code: "404.001.01",
		message: "Resource not found",
		mitigation: "Make sure you are calling the correct API endpoint",
		httpCode: 404,
		retryable: false,
	},
	"405.001": {
		code: "405.001",
		message: "Method Not Allowed",
		mitigation: "Ensure you're passing the request as POST. Any other method will be rejected",
		httpCode: 405,
		retryable: false,
	},
	"500.001.1001": {
		code: "500.001.1001",
		message: "Merchant does not exist / Wrong credentials / Unable to lock subscriber",
		mitigation: "Ensure you're using the short code used on Go Live as BusinessShortCode parameter value in the request. Check Password encoding. Wait at least 1 minute between requests",
		httpCode: 500,
		retryable: true,
		retryAfter: 60, // Wait 1 minute
	},
	"500.003.02": {
		code: "500.003.02",
		message: "System is busy / Spike Arrest Violation",
		mitigation: "Retry the request after a short wait. Ensure your application/system is not sending excessive requests",
		httpCode: 500,
		retryable: true,
		retryAfter: 30, // Wait 30 seconds
	},
	"500.003.1001": {
		code: "500.003.1001",
		message: "Internal Server Error",
		mitigation: "Make sure everything on your side is correctly set up as per the documentation and your server is running as expected",
		httpCode: 500,
		retryable: true,
		retryAfter: 10,
	},
	"500.003.03": {
		code: "500.003.03",
		message: "Quota Violation",
		mitigation: "You are sending multiple requests that violate the API request limit. Ensure your application/system is not sending excessive requests",
		httpCode: 500,
		retryable: true,
		retryAfter: 60, // Wait 1 minute
	},
};

/**
 * M-Pesa STK Push Result Codes
 * These are returned in the callback ResultCode field
 */
export const MPESA_RESULT_CODES: Record<number, { description: string; explanation: string }> = {
	0: {
		description: "The service request is processed successfully",
		explanation: "The transaction has been processed successfully on M-PESA",
	},
	1: {
		description: "The balance is insufficient for the transaction",
		explanation: "The customer does not have enough money in their M-PESA account to complete the transaction",
	},
	2: {
		description: "Declined due to limit rule",
		explanation: "The amount provided is less than the allowed C2B transaction minimum (currently Ksh 1)",
	},
	3: {
		description: "Declined due to limit rule: greater than the maximum transaction amount",
		explanation: "The amount provided exceeds the allowed C2B transaction maximum",
	},
	4: {
		description: "Declined due to limit rule: would exceed daily transfer limit",
		explanation: "The transaction would exceed the customer's daily transfer limit (currently Ksh 500,000)",
	},
	8: {
		description: "Declined due to limit rule: would exceed the maximum balance",
		explanation: "Processing the transaction would exceed the Pay Bill or Till Number account balance limit",
	},
	17: {
		description: "Rule limited",
		explanation: "Transactions were initiated in succession (within 2 minutes) for the same amount to the same customer. Wait at least 2 minutes between such requests",
	},
	1019: {
		description: "Transaction has expired",
		explanation: "The transaction was not processed within the allowable time",
	},
	1025: {
		description: "An error occurred while sending a push request",
		explanation: "The USSD prompt message is too long (over 182 characters). Ensure the account reference value is not too long",
	},
	1032: {
		description: "Request cancelled by user",
		explanation: "The prompt was canceled by the user",
	},
	1037: {
		description: "DS timeout user cannot be reached",
		explanation: "The customer's phone could not be reached with the NIPUSH prompt (phone offline, busy, or ongoing session)",
	},
	2001: {
		description: "The initiator information is invalid",
		explanation: "The customer entered an incorrect M-PESA PIN. Advise the customer to use the correct PIN",
	},
	2028: {
		description: "The request is not permitted according to product assignment",
		explanation: "Either the TransactionType or PartyB is incorrect. For BuyGoods/Tills use CustomerBuyGoodsOnline, for Pay Bills use CustomerPayBillOnline",
	},
	8006: {
		description: "The security credential is locked",
		explanation: "The customer should contact Customer Care (call 100 or 200) for assistance",
	},
};

/**
 * M-Pesa Response Codes
 * These are returned in the ResponseCode field of the initial request
 */
export const MPESA_RESPONSE_CODES: Record<string, { description: string }> = {
	"0": {
		description: "Success. Request accepted for processing",
	},
};

/**
 * Get error information for a given error code
 */
export function getMpesaErrorInfo(errorCode: string | number): MpesaErrorInfo | null {
	const code = String(errorCode);
	return MPESA_ERROR_CODES[code] || null;
}

/**
 * Get result code information for a given result code
 */
export function getMpesaResultCodeInfo(resultCode: number): { description: string; explanation: string } | null {
	return MPESA_RESULT_CODES[resultCode] || null;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(errorCode: string | number): boolean {
	const errorInfo = getMpesaErrorInfo(errorCode);
	return errorInfo?.retryable || false;
}

/**
 * Get retry delay in seconds for an error
 */
export function getRetryDelay(errorCode: string | number): number {
	const errorInfo = getMpesaErrorInfo(errorCode);
	return errorInfo?.retryAfter || 0;
}

/**
 * Terminal result codes that indicate the transaction is complete (success or failure)
 * These codes should stop polling immediately
 */
const TERMINAL_RESULT_CODES = new Set([
	0, // Success
	1, // Insufficient balance
	2, // Below minimum
	3, // Above maximum
	4, // Exceeds daily limit
	8, // Exceeds maximum balance
	17, // Rule limited
	1019, // Transaction expired
	1025, // Error sending push
	1032, // Request cancelled by user
	2001, // Invalid PIN
	2028, // Request not permitted
	8006, // Security credential locked
]);

/**
 * Processing result codes that indicate the transaction is still being processed
 * These codes should continue polling
 */
const PROCESSING_RESULT_CODES = new Set([
	4999, // Request processing
]);

/**
 * Check if a result code is terminal (transaction is complete)
 * Terminal codes mean we should stop polling
 */
export function isTerminalResultCode(resultCode: string | number): boolean {
	const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
	return TERMINAL_RESULT_CODES.has(code);
}

/**
 * Check if a result code indicates processing (should continue polling)
 */
export function isProcessingResultCode(resultCode: string | number): boolean {
	const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
	return PROCESSING_RESULT_CODES.has(code);
}

/**
 * Get user-friendly error message for a result code
 */
export function getUserFriendlyErrorMessage(resultCode: string | number): string {
	const code = typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;
	const codeInfo = getMpesaResultCodeInfo(code);
	
	if (codeInfo) {
		return codeInfo.description;
	}
	
	// Fallback messages for common codes
	const fallbackMessages: Record<number, string> = {
		0: "Payment completed successfully",
		1: "Insufficient balance in your M-Pesa account",
		2: "Amount is below the minimum transaction limit",
		3: "Amount exceeds the maximum transaction limit",
		4: "Transaction would exceed your daily transfer limit",
		8: "Transaction would exceed account balance limit",
		17: "Too many requests. Please wait a few minutes and try again",
		1019: "Payment request expired. Please initiate a new payment",
		1025: "Error sending payment request. Please try again",
		1032: "Payment request was cancelled",
		2001: "Incorrect M-Pesa PIN entered. Please try again with the correct PIN",
		2028: "Payment request not permitted. Please contact support",
		8006: "Your M-Pesa account is locked. Please contact M-Pesa customer care",
	};
	
	return fallbackMessages[code] || `Payment failed with error code ${code}`;
}