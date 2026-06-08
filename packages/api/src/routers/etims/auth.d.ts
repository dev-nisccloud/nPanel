export declare const etimsAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get current eTIMS configuration status.
     * Used by the frontend to know if the device is initialized.
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
