export declare const openProviderAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Authenticate with OpenProvider API
     */
    login: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            username?: string | undefined;
            password?: string | undefined;
            ip?: string | undefined;
            useEnvCredentials?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: {
                token: string;
                reseller_id: number;
            };
        };
        meta: object;
    }>;
    /**
     * Validate authentication token
     */
    validateToken: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            token: string;
        };
        output: {
            success: boolean;
            valid: boolean;
            message: string;
        };
        meta: object;
    }>;
    /**
     * Get authentication status
     */
    getStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            token?: string | undefined;
        };
        output: {
            authenticated: boolean;
            message: string;
        };
        meta: object;
    }>;
}>>;
