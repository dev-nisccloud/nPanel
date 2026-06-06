export declare function insertAndEnqueueAgentGeneration(params: {
    userId: string;
    teamId: string | null;
    sessionId: string;
    messageId: string | null;
    modelCategory: string;
    modelId: string;
    prompt?: string | null;
    inputs?: unknown;
    ctx: {
        ipAddress?: string | null;
        userAgent?: string | null;
    };
    /** Extra seconds to wait before QStash delivers this job to the worker.
     *  Use when multiple generations are enqueued in the same turn to
     *  stagger Replicate API calls and avoid HTTP 429 rate-limit errors. */
    delaySeconds?: number;
}): Promise<{
    generationId: string;
}>;
export declare const zeepoAgentGenerateRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getGeneration: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            generationId: string;
        };
        output: {
            data: any;
        };
        meta: object;
    }>;
    listBySession: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            sessionId: string;
        };
        output: {
            data: any[];
        };
        meta: object;
    }>;
}>>;
