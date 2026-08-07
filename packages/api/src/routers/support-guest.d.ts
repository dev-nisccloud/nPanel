/**
 * Landing-page guest support tickets.
 *
 * Security:
 *  - Landing-origin gated (storefront browser rules)
 *  - Opaque httpOnly cookie (`nisc_support_guest`); only token hash stored
 *  - Guest may only access tickets created by their shadow GUEST user
 *  - Entering an email never grants access to another account's tickets
 *  - Claim on login uses the cookie, not email match
 */
import type { Context } from "../context";
export declare const supportGuestRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getSession: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            active: boolean;
            name?: string | undefined;
            email?: string | undefined;
            phone?: string | null | undefined;
            token?: string | undefined;
        };
        meta: object;
    }>;
    startSession: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            email: string;
            phone?: string | null | undefined;
        };
        output: {
            active: boolean;
            name?: string | undefined;
            email?: string | undefined;
            phone?: string | null | undefined;
            token?: string | undefined;
        };
        meta: object;
    }>;
    getList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number | undefined;
            offset?: number | undefined;
        } | undefined;
        output: {
            id: string;
            ticketNumber: string;
            lastMessage: string | null;
            lastMessageAt: Date | null;
            unreadCount: number;
            status: string;
            priority: string;
            subject?: string | null | undefined;
        }[];
        meta: object;
    }>;
    getMessages: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            ticketId: string;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            messages: {
                id: string;
                ticketId: string;
                senderId: string;
                content: string;
                isInternal: boolean;
                isSystem: boolean;
                readStatus: string;
                createdAt: Date;
                sender?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | null | undefined;
            }[];
            total: number;
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            message: string;
            subject?: string | undefined;
        };
        output: {
            ticketId: string;
            ticketNumber: string;
            messageId: string;
        };
        meta: object;
    }>;
    createMessage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            ticketId: string;
            content: string;
        };
        output: {
            id: string;
            ticketId: string;
            senderId: string;
            content: string;
            isInternal: boolean;
            isSystem: boolean;
            readStatus: string;
            createdAt: Date;
            sender?: {
                id: string;
                name: string | null;
                email: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    markAllRead: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            ticketId: string;
        };
        output: {
            markedCount: number;
        };
        meta: object;
    }>;
    /**
     * Merge guest-session tickets into the authenticated account.
     * Ownership is proven by the guest cookie, not by email match.
     * Allowed from landing or nPanel app (any authenticated customer with the cookie).
     */
    claimToAccount: import("@trpc/server").TRPCMutationProcedure<{
        input: void;
        output: {
            claimed: boolean;
            ticketCount: number;
        };
        meta: object;
    }>;
}>>;
