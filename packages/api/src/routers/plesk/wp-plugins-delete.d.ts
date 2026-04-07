export declare const wpPluginsDeleteRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            plugins: string[];
        };
        output: {
            data: {
                success: boolean;
                deletedPlugins: string[];
            };
        };
        meta: object;
    }>;
}>>;
