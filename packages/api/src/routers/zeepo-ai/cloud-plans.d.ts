export declare const zeepoAiCloudPlansRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            kind: "vps" | "vds" | "dedicated";
            search?: string | undefined;
            limit?: number | undefined;
            cursor?: number | undefined;
            ramGb?: number | undefined;
            cores?: number | undefined;
            cpu?: "intel" | "amd" | undefined;
            diskGb?: number | undefined;
            location?: string | undefined;
        };
        output: import("../../lib/agent-internal-tools").CloudPlansResult;
        meta: object;
    }>;
}>>;
