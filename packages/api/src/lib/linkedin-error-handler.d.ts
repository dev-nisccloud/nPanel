import { LinkedInApiError } from './linkedin-client';
/**
 * Error types that can be returned by LinkedIn API error handler
 */
export type LinkedInErrorType = 'refresh-token' | 'bad-body' | 'unknown';
/**
 * Structured error information from LinkedIn API error handler
 */
export interface LinkedInErrorInfo {
    type: LinkedInErrorType;
    message: string;
    originalError?: LinkedInApiError;
}
/**
 * Comprehensive error handler for LinkedIn API errors
 * Based on common error codes and messages from LinkedIn API
 *
 * This handler categorizes errors into:
 * - refresh-token: Requires re-authentication (token expired, revoked, etc.)
 * - bad-body: Content/parameter validation errors
 * - unknown: Unhandled errors
 */
export declare class LinkedInErrorHandler {
    /**
     * Handle LinkedIn API error by checking error message and codes
     * Returns structured error information for proper handling
     */
    static handleError(error: LinkedInApiError | Error | string): LinkedInErrorInfo | undefined;
    /**
     * Check if error requires token refresh
     */
    static requiresTokenRefresh(error: LinkedInApiError | Error | string): boolean;
    /**
     * Check if error is a content/body validation error
     */
    static isBadBodyError(error: LinkedInApiError | Error | string): boolean;
    /**
     * Get user-friendly error message
     */
    static getErrorMessage(error: LinkedInApiError | Error | string): string;
}
