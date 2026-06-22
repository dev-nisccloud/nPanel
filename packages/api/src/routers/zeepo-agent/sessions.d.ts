export declare const zeepoAgentSessionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            title?: string | undefined;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                teamId: string | null;
                status: string;
                userId: string;
                title: string | null;
            } | undefined;
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                teamId: string | null;
                status: string;
                userId: string;
                title: string | null;
            }[];
            total: any;
            page: number;
            limit: number;
        };
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            data: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                teamId: string | null;
                status: string;
                userId: string;
                title: string | null;
                messages: {
                    id: string;
                    createdAt: Date;
                    metadata: unknown;
                    role: string;
                    content: string | null;
                    toolCalls: unknown;
                    toolCallId: string | null;
                    sessionId: string;
                }[];
            };
        };
        meta: object;
    }>;
    updateTitle: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            title: string;
        };
        output: {
            success: true;
            title: string;
        };
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: true;
        };
        meta: object;
    }>;
}>>;
