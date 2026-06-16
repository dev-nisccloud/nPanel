export declare const jetbackupSystemRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getMasterEncryptionKey: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    factoryReset: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    exitDisasterRecovery: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    approveAgreement: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    approveShowcase: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
    listShowcase: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: unknown;
        meta: object;
    }>;
}>>;
