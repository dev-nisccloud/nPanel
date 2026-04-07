export declare const etimsAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Generate OAuth 2.0 access token from KRA eTIMS
     */
    generateToken: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            grantType?: "client_credentials" | undefined;
        };
        output: {
            success: boolean;
            data: import("../../lib/etims-client").AuthResponse;
        };
        meta: object;
    }>;
    /**
     * Get current eTIMS configuration status
     */
    getConfiguration: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            isInitialized: boolean;
            config: null;
        } | {
            isInitialized: boolean;
            config: {
                kraPin: string;
                branchId: string;
                deviceSerialNumber: string;
                isSandbox: boolean;
                updatedAt: Date;
            };
        };
        meta: object;
    }>;
}>>;
