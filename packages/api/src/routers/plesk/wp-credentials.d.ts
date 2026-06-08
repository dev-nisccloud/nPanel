export declare const wpCredentialsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
    getAccount: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
    updateAccount: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            installationId: number;
            login: unknown;
            password: unknown;
            retainPassword: unknown;
            email: unknown;
            language: unknown;
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
}>>;
