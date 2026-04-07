export declare const wpPluginsAutoupdateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            plugins: {
                slug: string;
                autoUpdates?: boolean | undefined;
                status?: boolean | undefined;
            }[];
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
}>>;
