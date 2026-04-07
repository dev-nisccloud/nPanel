export declare const emailsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getBySiteId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            siteId: number;
        };
        output: {
            raw: string;
            parsed: unknown;
        };
        meta: object;
    }>;
}>>;
