export declare const databasesDeleteRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            siteId: number;
            databaseId: number;
        };
        output: {
            raw: string;
            parsed: any;
        };
        meta: object;
    }>;
}>>;
