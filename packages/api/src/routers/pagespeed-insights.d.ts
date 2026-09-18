export declare const pagespeedInsightsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getPageSpeed: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            url: string;
        };
        output: any;
        meta: object;
    }>;
    runPageSpeed: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            url: string;
        };
        output: any;
        meta: object;
    }>;
}>>;
