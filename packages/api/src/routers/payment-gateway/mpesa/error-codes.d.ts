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
    retryAfter?: number;
}
/**
 * Common M-Pesa API error codes
 */
export declare const MPESA_ERROR_CODES: Record<string, MpesaErrorInfo>;
/**
 * M-Pesa STK Push Result Codes
 * These are returned in the callback ResultCode field
 */
export declare const MPESA_RESULT_CODES: Record<number, {
    description: string;
    explanation: string;
}>;
/**
 * M-Pesa Response Codes
 * These are returned in the ResponseCode field of the initial request
 */
export declare const MPESA_RESPONSE_CODES: Record<string, {
    description: string;
}>;
/**
 * Get error information for a given error code
 */
export declare function getMpesaErrorInfo(errorCode: string | number): MpesaErrorInfo | null;
/**
 * Get result code information for a given result code
 */
export declare function getMpesaResultCodeInfo(resultCode: number): {
    description: string;
    explanation: string;
} | null;
/**
 * Check if an error is retryable
 */
export declare function isRetryableError(errorCode: string | number): boolean;
/**
 * Get retry delay in seconds for an error
 */
export declare function getRetryDelay(errorCode: string | number): number;
/**
 * Check if a result code is terminal (transaction is complete)
 * Terminal codes mean we should stop polling
 */
export declare function isTerminalResultCode(resultCode: string | number): boolean;
/**
 * Check if a result code indicates processing (should continue polling)
 */
export declare function isProcessingResultCode(resultCode: string | number): boolean;
/**
 * Get user-friendly error message for a result code
 */
export declare function getUserFriendlyErrorMessage(resultCode: string | number): string;
