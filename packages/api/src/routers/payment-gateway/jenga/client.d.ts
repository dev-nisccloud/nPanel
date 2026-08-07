import { type JengaErrorInfo } from "./error-codes";
import type { JengaConfig, JengaPaymentInitResult, JengaPaymentRequest } from "./types";
export declare class JengaApiError extends Error {
    code: string | number;
    description: string;
    originalError?: Error | undefined;
    errorInfo?: JengaErrorInfo;
    retryable: boolean;
    constructor(code: string | number, description: string, originalError?: Error | undefined, errorInfo?: JengaErrorInfo);
}
export declare class JengaCardPaymentClient {
    private config;
    private accessToken;
    private tokenExpiry;
    constructor(config: JengaConfig);
    private validateConfig;
    private getBaseUrl;
    getCheckoutUrl(): string;
    getDefaultCallbackUrl(): string;
    getMerchantCode(): string;
    /**
     * Authenticate with Jenga and cache the Bearer token until near expiry.
     */
    authenticate(): Promise<string>;
    /**
     * Signature formula (docs): merchantCode + orderReference + currency + orderAmount + callbackUrl
     * Note: orderAmount is signed as the numeric string used in concatenation (not necessarily toFixed).
     */
    generateSignature(orderReference: string, currency: string, orderAmount: number, callbackUrl: string): string;
    private validatePaymentRequest;
    initiateCardPayment(request: JengaPaymentRequest): Promise<JengaPaymentInitResult>;
}
/**
 * Create Jenga client from environment variables (see .env.jenga.example).
 */
export declare function createJengaClientFromEnv(): JengaCardPaymentClient;
/** Normalize phone to digits starting with country code when possible (Kenya default). */
export declare function formatJengaPhone(raw: string): string;
export declare function generateJengaOrderReference(): string;
