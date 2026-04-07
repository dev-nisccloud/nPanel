export declare const wpThemesListRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    installed: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
    catalog: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
            compatible?: boolean | undefined;
            downloadCount?: number | undefined;
            lastUpdatedAt?: "all" | "3M" | "6M" | "1y" | "2y" | undefined;
            page?: number | undefined;
            pageSize?: number | undefined;
            rating?: number | undefined;
            term?: string | undefined;
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
}>>;
