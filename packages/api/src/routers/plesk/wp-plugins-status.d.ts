export declare const wpPluginsStatusRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    setStatus: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            slug: string;
            status: boolean;
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
}>>;
