export declare const emailsDeleteRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            siteId: number;
            name: string;
        };
        output: {
            raw: string;
            parsed: any;
        };
        meta: object;
    }>;
}>>;
