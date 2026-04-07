export declare const subscriptionsUpdateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: number;
            name?: string | undefined;
            status?: number | undefined;
            ipAddress?: string | undefined;
            description?: string | undefined;
            adminDescription?: string | undefined;
            diskSpace?: number | undefined;
            maxSubdomains?: number | undefined;
            maxDomains?: number | undefined;
            maxDatabases?: number | undefined;
            www?: boolean | undefined;
        };
        output: {
            raw: string;
            parsed: any;
        };
        meta: object;
    }>;
}>>;
