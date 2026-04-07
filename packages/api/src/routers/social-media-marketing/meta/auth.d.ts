export declare const metaAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Generate long-lived access token from OAuth authorization code
     * App ID and App Secret come from environment variables
     * This is the main endpoint to use for token generation
     * Flow: code -> short-lived token -> long-lived token
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
     * Get long-lived page access token from user access token
     * Saves the page token to the database for future use
     */
    getPageToken: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            userAccessToken: string;
            pageId: string;
            teamId?: string | null | undefined;
        };
        output: {
            success: boolean;
            data: {
                accessToken: string;
                pageId: string;
                pageInfo: {
                    pageName?: string;
                    pageUsername?: string;
                    pagePicture?: string;
                    pageCategory?: string;
                };
            };
            meta: {
                retrieved_at: string;
                page_id: string;
                team_id: string | null;
            };
        };
        meta: object;
    }>;
    /**
     * Generate Facebook OAuth URL for connecting account
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
     * Get stored Meta credentials (integration status)
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
