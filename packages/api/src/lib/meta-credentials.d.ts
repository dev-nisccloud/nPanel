/**
 * Get stored Meta access token (global integration)
 * Returns the access token if available and not expired, or null
 */
export declare function getStoredMetaAccessToken(): Promise<{
    accessToken: string;
    integrationId: string;
} | null>;
/**
 * Get stored Instagram access token (standalone integration)
 * Returns the access token if available and not expired, or null
 */
export declare function getStoredInstagramAccessToken(): Promise<{
    accessToken: string;
    integrationId: string;
} | null>;
/**
 * Get stored page access token for a specific Facebook Page
 * Returns the access token if available, not expired, and integration is active
 * Note: Filters by META_FACEBOOK platform to ensure correct platform token
 */
export declare function getStoredPageAccessToken(pageId: string): Promise<{
    accessToken: string;
    integrationId: string;
} | null>;
