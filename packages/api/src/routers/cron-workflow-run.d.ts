export declare const cronWorkflowRunRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            jobKey?: string | undefined;
            limit?: number | undefined;
        } | undefined;
        output: {
            runs: {
                id: string;
                jobKey: string;
                name: string;
                status: string;
                version: number;
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            jobKey: string;
            name?: string | undefined;
            teamId?: string | undefined;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            name: string;
            version: number;
        };
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            createdById?: string;
        } & {
            graphStateJson: unknown;
            version: number;
        };
        meta: object;
    }>;
    patch: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            name?: string | undefined;
            status?: "completed" | "running" | "cancelled" | "failed" | "paused" | undefined;
            lastError?: string | null | undefined;
        };
        output: {
            id: string;
            name: string;
            status: string;
            version: number;
            updatedAt: Date;
        };
        meta: object;
    }>;
    saveGraph: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            version: number;
            graphStateJson: Record<string, unknown>;
        };
        output: {
            version: number;
        };
        meta: object;
    }>;
    recordEdgeSnapshot: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            runId: string;
            edgeId: string;
            sourceNodeId: string;
            targetNodeId: string;
            payload: Record<string, unknown>;
        };
        output: {
            ok: true;
            skipped: true;
        } | {
            ok: true;
            skipped: false;
        };
        meta: object;
    }>;
    linkInvoice: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            runId: string;
            platform: "google" | "meta" | "linkedin";
            invoiceId: string;
        };
        output: {
            ok: true;
        };
        meta: object;
    }>;
}>>;
