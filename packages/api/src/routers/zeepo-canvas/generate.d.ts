export declare const zeepoCanvasGenerateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    start: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            nodeId: string;
            modelCategory: string;
            modelId: string;
            teamId?: string | undefined;
            prompt?: string | undefined;
            inputs?: any;
        };
        output: {
            generationId: `${string}-${string}-${string}-${string}-${string}`;
            status: string;
        };
        meta: object;
    }>;
    getGeneration: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            generationId: string;
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
    getGenerationsByNode: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
            nodeId: string;
        };
        output: {
            data: any[];
        };
        meta: object;
    }>;
}>>;
