export declare const niscBackupSettingsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getRestore: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    manageRestore: import("@trpc/server").TRPCMutationProcedure<{
        input: Record<string, unknown>;
        output: unknown;
        meta: object;
    }>;
    getSecurity: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    manageSecurity: import("@trpc/server").TRPCMutationProcedure<{
        input: Record<string, unknown>;
        output: unknown;
        meta: object;
    }>;
    getPrivacy: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    managePrivacy: import("@trpc/server").TRPCMutationProcedure<{
        input: Record<string, unknown>;
        output: unknown;
        meta: object;
    }>;
    getPanel: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    managePanel: import("@trpc/server").TRPCMutationProcedure<{
        input: Record<string, unknown>;
        output: unknown;
        meta: object;
    }>;
    getSnapshots: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    manageSnapshots: import("@trpc/server").TRPCMutationProcedure<{
        input: Record<string, unknown>;
        output: unknown;
        meta: object;
    }>;
    getBinary: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    manageBinary: import("@trpc/server").TRPCMutationProcedure<{
        input: Record<string, unknown>;
        output: unknown;
        meta: object;
    }>;
    getResource: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    manageResource: import("@trpc/server").TRPCMutationProcedure<{
        input: Record<string, unknown>;
        output: unknown;
        meta: object;
    }>;
    listNotificationIntegrationTypes: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    listEnabledNotificationIntegrations: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    getEnabledNotificationIntegration: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            type: string;
        };
        output: unknown;
        meta: object;
    }>;
    deleteEnabledNotificationIntegration: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            type: string;
        };
        output: unknown;
        meta: object;
    }>;
}>>;
