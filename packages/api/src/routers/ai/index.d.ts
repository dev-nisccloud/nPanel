export declare const aiRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    history: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getHistory: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | undefined;
                limit?: number | undefined;
                offset?: number | undefined;
            };
            output: {
                id: string;
                title: string | null;
                lastMessage: string | null;
                timestamp: Date;
                status: "ACTIVE" | "ESCALATED" | "CLOSED";
            }[];
            meta: object;
        }>;
        getById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                title: string | null;
                status: "ACTIVE" | "ESCALATED" | "CLOSED";
                createdAt: Date;
                updatedAt: Date;
                closedAt: Date | null;
                messages?: {
                    id: string;
                    chatId: string;
                    role: "user" | "system" | "assistant" | "tool";
                    content: string | null;
                    toolCalls: any;
                    toolCallId: string | null;
                    metadata: any;
                    createdAt: Date;
                }[] | undefined;
            };
            meta: object;
        }>;
    }>>;
    chat: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        start: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId?: string | undefined;
                initialMessage?: string | undefined;
            };
            output: {
                id: string;
                userId: string;
                teamId: string | null;
                title: string | null;
                status: "ACTIVE" | "ESCALATED" | "CLOSED";
                createdAt: Date;
                updatedAt: Date;
                closedAt: Date | null;
                messages?: {
                    id: string;
                    chatId: string;
                    role: "user" | "system" | "assistant" | "tool";
                    content: string | null;
                    toolCalls: any;
                    toolCallId: string | null;
                    metadata: any;
                    createdAt: Date;
                }[] | undefined;
            };
            meta: object;
        }>;
        sendMessage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                chatId: string;
                content: string;
            };
            output: {
                id: string;
                chatId: string;
                role: "user" | "system" | "assistant" | "tool";
                content: string | null;
                toolCalls: any;
                toolCallId: string | null;
                metadata: any;
                createdAt: Date;
            };
            meta: object;
        }>;
        escalate: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                chatId: string;
                reason?: string | undefined;
            };
            output: {
                success: boolean;
                ticketId: string;
                ticketNumber: string;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
}>>;
