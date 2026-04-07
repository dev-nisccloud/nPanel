export declare const googleAdsAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Generate Google OAuth URL for connecting account
     * Returns the OAuth URL with proper scopes and redirect URI
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
    /**
     * Exchange OAuth authorization code for tokens
     * Stores refresh token in database and creates/updates GoogleAdsIntegration record
     */
    generateToken: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            code: string;
            redirectUri?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                accessToken: string;
                refreshToken: string;
                tokenType: string;
                expiresIn: number;
                expiresAt: string;
            };
            meta: {
                generated_at: string;
                integration_id: string;
            };
        };
        meta: object;
    }>;
    /**
     * Get stored Google Ads credentials (integration status)
     */
    getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: null;
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
                hasRefreshToken: boolean;
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
    /**
     * Revoke Google Ads integration (disconnect)
     */
    revokeToken: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: {
            success: boolean;
            data: {
                revoked: boolean;
            };
            meta: {
                revoked_at: string;
            };
        };
        meta: object;
    }>;
}>>;
