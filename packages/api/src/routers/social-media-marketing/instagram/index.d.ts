export declare const instagramRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Authentication and token management endpoints for the standalone
     * Instagram API with Instagram Login flow (instagram.com / api.instagram.com
     * / graph.instagram.com).
     */
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
                    profile: import("./auth").InstagramProfile | null;
                };
                meta: {
                    generated_at: string;
                    integration_id: string;
                };
            };
            meta: object;
        }>;
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
        getProfile: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                success: boolean;
                data: null;
                meta?: undefined;
            } | {
                success: boolean;
                data: import("./auth").InstagramProfile & {
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
}>>;
