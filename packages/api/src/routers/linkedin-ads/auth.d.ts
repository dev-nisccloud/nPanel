/**
 * LinkedIn Ads Auth Router
 * Reuses existing SocialMediaIntegration for LinkedIn OAuth
 * Checks for Marketing API scopes (r_ads, r_ads_reporting)
 */
export declare const linkedInAdsAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get stored LinkedIn credentials (integration status)
     * Checks if token has Marketing API scopes
     */
    getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: {
                connected: boolean;
                hasAccessToken: boolean;
                accessTokenExpiresAt: null;
                isExpired: boolean;
                scope: null;
                status: null;
                integrationId?: undefined;
                userId?: undefined;
                hasAdsScopes?: undefined;
            };
            meta: {
                has_credentials: boolean;
                created_at?: undefined;
                updated_at?: undefined;
            };
        } | {
            success: boolean;
            data: {
                integrationId: string;
                hasAccessToken: boolean;
                accessTokenExpiresAt: string | null;
                isExpired: boolean | null;
                scope: string | null;
                status: string;
                userId: string;
                connected: boolean;
                hasAdsScopes: boolean;
            };
            meta: {
                has_credentials: boolean;
                created_at: string;
                updated_at: string;
            };
        };
        meta: object;
    }>;
    /**
     * Generate LinkedIn OAuth URL with Marketing API scopes
     * Reuses existing LinkedIn auth but ensures ads scopes are included
     */
    generateAuthUrl: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            redirectUri?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                url: string;
                state: string;
            };
            meta: {
                generated_at: string;
            };
        };
        meta: object;
    }>;
}>>;
