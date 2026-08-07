/**
 * Active Google Ads integration for a specific user, with access token refreshed when expired.
 */
export declare function getUserGoogleAdsIntegration(userId: string): Promise<{
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date | null;
    scope: string | null;
    tokenType: string | null;
    lastTokenRefreshAt: Date | null;
}>;
/**
 * Session-aware integration lookup.
 * Agency users share the latest active Google Ads integration across the agency.
 */
export declare function getGoogleAdsIntegrationForSession(params: {
    userId: string;
    role?: string | null;
}): Promise<{
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date | null;
    scope: string | null;
    tokenType: string | null;
    lastTokenRefreshAt: Date | null;
}>;
