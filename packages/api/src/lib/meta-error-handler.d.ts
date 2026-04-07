import { MetaApiError } from './meta-client';
/**
 * Error types that can be returned by Meta API error handler
 */
export type MetaErrorType = 'refresh-token' | 'bad-body' | 'unknown';
/**
 * Structured error information from Meta API error handler
 */
export interface MetaErrorInfo {
    type: MetaErrorType;
    message: string;
    originalError?: MetaApiError;
}
/**
 * Comprehensive error handler for Meta/Facebook API errors
 * Based on common error codes and messages from Facebook Graph API
 *
 * This handler categorizes errors into:
 * - refresh-token: Requires re-authentication (token expired, revoked, etc.)
 * - bad-body: Content/parameter validation errors
 * - unknown: Unhandled errors
 */
export declare class MetaErrorHandler {
    /**
     * Handle Meta API error by checking error message and codes
     * Returns structured error information for proper handling
     */
    static handleError(error: MetaApiError | Error | string): MetaErrorInfo | undefined;
    /**
     * Check if error requires token refresh
     */
    static requiresTokenRefresh(error: MetaApiError | Error | string): boolean;
    /**
     * Check if error is a content/body validation error
     */
    static isBadBodyError(error: MetaApiError | Error | string): boolean;
    /**
     * Get user-friendly error message
     */
    static getErrorMessage(error: MetaApiError | Error | string): string;
}
