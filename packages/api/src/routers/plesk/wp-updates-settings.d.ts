export declare const wpUpdatesSettingsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            data: any;
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            settings: {
                core: "none" | "major" | "minor";
                plugins: {
                    forceUpdates: boolean;
                    newlyInstalledUpdates: boolean;
                    updateVulnerable: boolean;
                    deactivateVulnerable: boolean;
                };
                themes: {
                    forceUpdates: boolean;
                    newlyInstalledUpdates: boolean;
                    updateVulnerable: boolean;
                };
                safeUpdate: boolean;
            };
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
}>>;
