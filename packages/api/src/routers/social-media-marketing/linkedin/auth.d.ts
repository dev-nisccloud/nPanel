export declare const linkedinAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Generate access token from OAuth authorization code
     * App ID and App Secret come from environment variables
     * This is the main endpoint to use for token generation
     * Flow: code -> access token + refresh token
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
                expiresIn: number;
                expiresAt: string;
                refreshExpiresAt: string;
                scope: string;
            };
            meta: {
                generated_at: string;
                integration_id: string;
            };
        };
        meta: object;
    }>;
    /**
     * Refresh access token using refresh token
     * LinkedIn refresh tokens expire after 60 days
     */
    refreshToken: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            refreshToken: string;
        };
        output: {
            success: boolean;
            data: {
                accessToken: string;
                refreshToken: string;
                expiresIn: number;
                expiresAt: string;
                refreshExpiresAt: string;
            };
        };
        meta: object;
    }>;
    /**
     * Generate LinkedIn OAuth URL for connecting account
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
     * Get stored LinkedIn credentials (integration status)
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
                accessTokenExpiresAt: string | null;
                isExpired: boolean | null;
                scope: string | null;
                status: string;
                userId: string;
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
