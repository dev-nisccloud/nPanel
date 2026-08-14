/**
 * Live AI Support sessions for the FAB (guest cookie or authenticated user).
 * Does not require a Zeepo AI wallet. Sessions are tagged surface=support_fab
 * so they never mix into the Zeepo AI product history.
 */
import type { Context } from "../context";
export declare const zeepoAiSupportRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getOrCreate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            teamId?: string | undefined;
        };
        output: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            teamId: string | null;
            metadata: unknown;
            title: string | null;
        };
        meta: object;
    }>;
    getSession: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            session: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                metadata: unknown;
                title: string | null;
            };
            messages: {
                id: string;
                role: string;
                status: string;
                createdAt: Date;
                metadata: unknown;
                content: string | null;
            }[];
            toolInvocations: {
                id: string;
                status: string;
                messageId: string | null;
                toolName: string;
                result: unknown;
            }[];
        };
        meta: object;
    }>;
    openTicket: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            phone?: string | null | undefined;
            intent?: "support" | "sales" | undefined;
        };
        output: {
            _tool: "create_support_ticket";
            ok: true;
            alreadyOpen: boolean;
            ticketId: string;
            ticketNumber: string;
            intent: import("../lib/create-ai-support-ticket").AiSupportTicketIntent;
            subject: string;
        };
        meta: object;
    }>;
    guest: import("@trpc/server").TRPCBuiltRouter<{
        ctx: Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getOrCreate: import("@trpc/server").TRPCMutationProcedure<{
            input: void;
            output: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                metadata: unknown;
                title: string | null;
            };
            meta: object;
        }>;
        getSession: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                session: {
                    id: string;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    metadata: unknown;
                    title: string | null;
                };
                messages: {
                    id: string;
                    role: string;
                    status: string;
                    createdAt: Date;
                    metadata: unknown;
                    content: string | null;
                }[];
                toolInvocations: {
                    id: string;
                    status: string;
                    messageId: string | null;
                    toolName: string;
                    result: unknown;
                }[];
            };
            meta: object;
        }>;
        openTicket: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                sessionId: string;
                phone?: string | null | undefined;
                intent?: "support" | "sales" | undefined;
            };
            output: {
                _tool: "create_support_ticket";
                ok: true;
                alreadyOpen: boolean;
                ticketId: string;
                ticketNumber: string;
                intent: import("../lib/create-ai-support-ticket").AiSupportTicketIntent;
                subject: string;
            };
            meta: object;
        }>;
    }>>;
}>>;
