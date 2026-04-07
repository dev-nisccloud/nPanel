export declare const pagespeedInsightsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getPageSpeed: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            url: string;
            strategy?: "mobile" | "desktop" | undefined;
            forceRefresh?: boolean | undefined;
        };
        output: any;
        meta: object;
    }>;
}>>;
