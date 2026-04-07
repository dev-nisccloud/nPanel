export declare const wpPluginsInstallRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    install: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            slug: string;
            status?: boolean | undefined;
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
}>>;
