export interface ShortLivedTokenResponse {
    access_token: string;
    user_id: number | string;
    permissions?: string[] | string;
}
export interface LongLivedTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}
export interface InstagramProfile {
    id: string;
    user_id?: string;
    username?: string;
    account_type?: string;
    media_count?: number;
}
export declare const instagramAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Generate the Instagram (standalone) OAuth authorization URL.
     * The frontend opens this URL in a popup/redirect, the user authorizes,
     * Instagram redirects back to `redirectUri` with `?code=...`.
     */
    generateAuthUrl: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            redirectUri?: string | undefined;
            scopes?: string[] | undefined;
        };
        output: {
            success: boolean;
            data: {
                url: string;
                state: string;
                scopes: string[];
                redirectUri: string;
            };
            meta: {
                generated_at: string;
            };
        };
        meta: object;
    }>;
    /**
     * Exchange OAuth `code` for a long-lived Instagram User access token and
     * persist the integration. Mirrors the Meta/LinkedIn flow.
     *
     * Flow: code -> short-lived token (1h) -> long-lived token (60d).
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
                scope: string;
                profile: InstagramProfile | null;
            };
            meta: {
                generated_at: string;
                integration_id: string;
            };
        };
        meta: object;
    }>;
    /**
     * Refresh the stored long-lived Instagram access token. Mirrors LinkedIn's
     * refreshToken endpoint. Per Meta docs, the token must be at least 24h old
     * and still valid (within the 60-day window) for refresh to succeed.
     */
    refreshToken: import("@trpc/server").TRPCMutationProcedure<{
        input: Record<string, never> | undefined;
        output: {
            success: boolean;
            data: {
                accessToken: string;
                tokenType: string;
                expiresIn: number;
                expiresAt: string;
            };
        };
        meta: object;
    }>;
    /**
     * Get the stored Instagram credentials/integration status. Returns
     * `null` when no integration exists yet.
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
     * Fetch the connected Instagram professional account profile (id,
     * username, account_type, media_count, profile_picture_url). Uses the
     * stored long-lived token. Returns null when not connected.
     */
    getProfile: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: null;
            meta?: undefined;
        } | {
            success: boolean;
            data: InstagramProfile & {
                profile_picture_url?: string;
                name?: string;
                biography?: string;
                followers_count?: number;
                follows_count?: number;
            };
            meta: {
                retrieved_at: string;
                integration_id: string;
            };
        };
        meta: object;
    }>;
    /**
     * Disconnect the Instagram integration. We mark it as REVOKED but keep
     * the row for audit/activity history.
     */
    disconnect: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: {
            success: boolean;
            data: {
                disconnected: boolean;
            };
        };
        meta: object;
    }>;
}>>;
