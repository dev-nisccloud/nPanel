export declare const imageGenImagesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            perPage?: number | undefined;
            query?: string | undefined;
        };
        output: {
            data: any[];
            hasMore: boolean;
        };
        meta: object;
    }>;
}>>;
