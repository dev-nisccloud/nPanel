export declare const openProviderResellerRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get reseller information including balance
     */
    getInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            with_statistics?: boolean | undefined;
            with_settings?: boolean | undefined;
            with_contacts?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Get reseller balance only (lightweight)
     */
    getBalance: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            balance: any;
            currency: string;
        };
        meta: object;
    }>;
}>>;
