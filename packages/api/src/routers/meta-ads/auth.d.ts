/**
 * Meta Ads Auth Router
 * Reuses existing SocialMediaIntegration for Meta OAuth
 * The social media marketing auth endpoints can be used directly
 */
export declare const metaAdsAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get stored Meta credentials (integration status)
     * Reuses the same integration as social media marketing
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
            };
            meta: {
                has_credentials: boolean;
                created_at: string;
                updated_at: string;
            };
        };
        meta: object;
    }>;
}>>;
