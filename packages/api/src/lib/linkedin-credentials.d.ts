/**
 * Get stored LinkedIn access token (global integration)
 * Returns the access token if available and not expired, or null
 */
export declare function getStoredLinkedInAccessToken(): Promise<{
    accessToken: string;
    integrationId: string;
} | null>;
export declare function getStoredLinkedInAccessTokenForUser(userId: string): Promise<{
    accessToken: string;
    integrationId: string;
} | null>;
/**
 * Get stored page access token for a specific LinkedIn Organization
 * Returns the access token if available, not expired, and integration is active
 * Note: Filters by LINKEDIN platform to ensure correct platform token
 */
export declare function getStoredLinkedInPageAccessToken(pageId: string): Promise<{
    accessToken: string;
    integrationId: string;
} | null>;
