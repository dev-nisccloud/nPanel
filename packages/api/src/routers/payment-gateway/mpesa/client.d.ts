import type { MpesaConfig, MpesaStkPushResponse, MpesaStkPushQueryResponse } from "./types";
import { type MpesaErrorInfo } from "./error-codes";
/**
 * Custom error class for M-Pesa API errors
 */
export declare class MpesaApiError extends Error {
    code: string | number;
    description: string;
    originalError?: Error | undefined;
    errorInfo?: MpesaErrorInfo;
    retryable: boolean;
    retryAfter?: number;
    constructor(code: string | number, description: string, originalError?: Error | undefined, errorInfo?: MpesaErrorInfo);
}
/**
 * M-Pesa API client
 */
export declare class MpesaClient {
    private config;
    private baseUrl;
    private tokenCache;
    constructor(config: MpesaConfig);
    /**
     * Generate OAuth access token
     */
    private getAccessToken;
    /**
     * Generate timestamp in M-Pesa format (YYYYMMDDHHmmss)
     */
    private generateTimestamp;
    /**
     * Generate password for STK Push
     * Format: Base64(BusinessShortCode + PassKey + Timestamp)
     *
     * @param timestamp - The timestamp in M-Pesa format (YYYYMMDDHHmmss)
     * @returns Base64 encoded string of (shortcode + passkey + timestamp)
     */
    private generatePassword;
    /**
     * Format phone number to M-Pesa format (254XXXXXXXXX)
     */
    private formatPhoneNumber;
    /**
     * Initiate STK Push payment request
     */
    initiateStkPush(params: {
        phoneNumber: string;
        amount: number;
        accountReference: string;
        transactionDesc?: string;
        callbackUrl?: string;
    }): Promise<MpesaStkPushResponse>;
    /**
     * Query STK Push payment status
     */
    queryStkPush(checkoutRequestId: string): Promise<MpesaStkPushQueryResponse>;
    /**
     * Get M-Pesa configuration (for validation purposes)
     */
    getConfig(): Omit<MpesaConfig, "consumerKey" | "consumerSecret" | "passkey">;
}
/**
 * Create M-Pesa client from environment variables
 */
export declare function createMpesaClientFromEnv(): MpesaClient;
