export declare const wpThemesDeleteRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            themes: string[];
        };
        output: {
            data: {
                success: boolean;
                deletedThemes: string[];
            };
        };
        meta: object;
    }>;
}>>;
