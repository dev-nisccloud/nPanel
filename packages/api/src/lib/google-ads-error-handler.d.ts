/**
 * Google Ads API Error Handler
 * Handles errors from Google Ads API and converts them to user-friendly messages
 */
export interface GoogleAdsErrorInfo {
    type: 'refresh-token' | 'bad-body' | 'permission' | 'rate-limit' | 'unknown';
    message: string;
    originalError?: Error | unknown;
}
export declare class GoogleAdsErrorHandler {
    /**
     * Handle Google Ads API error by checking error message and codes
     * Returns structured error information for proper handling
     */
    static handleError(error: Error | unknown): GoogleAdsErrorInfo;
}
