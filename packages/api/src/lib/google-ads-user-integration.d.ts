/**
 * Active Google Ads integration for the user, with access token refreshed when expired.
 */
export declare function getUserGoogleAdsIntegration(userId: string): Promise<{
    id: string;
    userId: string;
    status: string;
    refreshToken: string;
    accessToken: string;
    accessTokenExpiresAt: Date | null;
    scope: string | null;
    tokenType: string | null;
    lastTokenRefreshAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
