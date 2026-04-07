export declare const wpUpdatesInfoRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: {
            data: {
                installation: any;
                settings: any;
                core: {
                    currentVersion: any;
                    availableVersion: null;
                    needsUpdate: boolean;
                    updateType: any;
                };
                plugins: any[];
                themes: any[];
            };
        };
        meta: object;
    }>;
}>>;
