import { TRPCError } from '@trpc/server';
/**
 * Get Google Ads OAuth Client ID from environment variables
 */
export function getGoogleAdsClientId() {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    if (!clientId) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'GOOGLE_ADS_CLIENT_ID environment variable is not set',
        });
    }
    return clientId;
}
/**
 * Get Google Ads OAuth Client Secret from environment variables
 */
export function getGoogleAdsClientSecret() {
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    if (!clientSecret) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'GOOGLE_ADS_CLIENT_SECRET environment variable is not set',
        });
    }
    return clientSecret;
}
/**
 * Get Google Ads Developer Token from environment variables
 */
export function getGoogleAdsDeveloperToken() {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'GOOGLE_ADS_DEVELOPER_TOKEN environment variable is not set',
        });
    }
    return developerToken;
}
/**
 * Get Google Ads OAuth Redirect URI from environment variables
 */
export function getGoogleAdsRedirectUri() {
    return (process.env.GOOGLE_ADS_REDIRECT_URI ||
        `${process.env.FRONTEND_URL || process.env.VITE_PUBLIC_APP_URL || 'http://localhost:3001'}/agency/ad-campaigns/google-ads/callback`);
}
