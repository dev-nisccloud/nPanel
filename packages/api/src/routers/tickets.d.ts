export declare const ticketsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | undefined;
            assignedToId?: string | undefined;
            status?: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | undefined;
            priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
            type?: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS" | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            id: string;
            ticketNumber: string;
            lastMessage: string | null;
            lastMessageAt: Date | null;
            unreadCount: number;
            status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            customerName?: string | undefined;
            assignedToName?: string | null | undefined;
        }[];
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            ticketNumber: string;
            subject: string | null;
            description: string | null;
            type: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
            source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
            createdById: string;
            teamId: string | null;
            assignedToId: string | null;
            lastMessageId: string | null;
            lastMessageAt: Date | null;
            lastMessagePreview: string | null;
            unreadCount: number;
            customerUnreadCount: number;
            metadata: unknown;
            internalNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
            resolvedAt: Date | null;
            closedAt: Date | null;
            firstResponseAt: Date | null;
            lastResponseAt: Date | null;
            lastCustomerResponseAt: Date | null;
            lastAgentResponseAt: Date | null;
            createdBy?: {
                id: string;
                name: string | null;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            assignedTo?: {
                id: string;
                name: string | null;
                email: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subject?: string | undefined;
            description?: string | undefined;
            type?: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS" | undefined;
            priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
            source?: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE" | undefined;
            teamId?: string | undefined;
            metadata?: unknown;
        };
        output: {
            id: string;
            ticketNumber: string;
            subject: string | null;
            description: string | null;
            type: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
            source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
            createdById: string;
            teamId: string | null;
            assignedToId: string | null;
            lastMessageId: string | null;
            lastMessageAt: Date | null;
            lastMessagePreview: string | null;
            unreadCount: number;
            customerUnreadCount: number;
            metadata: unknown;
            internalNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
            resolvedAt: Date | null;
            closedAt: Date | null;
            firstResponseAt: Date | null;
            lastResponseAt: Date | null;
            lastCustomerResponseAt: Date | null;
            lastAgentResponseAt: Date | null;
            createdBy?: {
                id: string;
                name: string | null;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            assignedTo?: {
                id: string;
                name: string | null;
                email: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            subject?: string | undefined;
            description?: string | undefined;
            type?: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS" | undefined;
            priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
            status?: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | undefined;
            assignedToId?: string | null | undefined;
            internalNotes?: string | undefined;
            metadata?: unknown;
        };
        output: {
            id: string;
            ticketNumber: string;
            subject: string | null;
            description: string | null;
            type: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
            source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
            createdById: string;
            teamId: string | null;
            assignedToId: string | null;
            lastMessageId: string | null;
            lastMessageAt: Date | null;
            lastMessagePreview: string | null;
            unreadCount: number;
            customerUnreadCount: number;
            metadata: unknown;
            internalNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
            resolvedAt: Date | null;
            closedAt: Date | null;
            firstResponseAt: Date | null;
            lastResponseAt: Date | null;
            lastCustomerResponseAt: Date | null;
            lastAgentResponseAt: Date | null;
            createdBy?: {
                id: string;
                name: string | null;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            assignedTo?: {
                id: string;
                name: string | null;
                email: string;
            } | null | undefined;
        };
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
                readStatus: "SENT" | "DELIVERED" | "READ";
                readAt: Date | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
                editedAt: Date | null;
                deletedAt: Date | null;
                sender?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                attachments?: {
                    id: string;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileUrl: string;
                }[] | undefined;
            }[];
            total: number;
        };
        meta: object;
    }>;
    createMessage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            ticketId: string;
            content: string;
            isInternal?: boolean | undefined;
            attachments?: {
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileUrl: string;
                storageKey?: string | undefined;
            }[] | undefined;
        };
        output: {
            id: string;
            ticketId: string;
            senderId: string;
            content: string;
            isInternal: boolean;
            isSystem: boolean;
            readStatus: "SENT" | "DELIVERED" | "READ";
            readAt: Date | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
            editedAt: Date | null;
            deletedAt: Date | null;
            sender?: {
                id: string;
                name: string | null;
                email: string;
            } | undefined;
            attachments?: {
                id: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileUrl: string;
            }[] | undefined;
        };
        meta: object;
    }>;
    markMessageRead: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            messageId: string;
            readStatus: "SENT" | "DELIVERED" | "READ";
        };
        output: {
            id: string;
            ticketId: string;
            senderId: string;
            content: string;
            isInternal: boolean;
            isSystem: boolean;
            readStatus: "SENT" | "DELIVERED" | "READ";
            readAt: Date | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
            editedAt: Date | null;
            deletedAt: Date | null;
            sender?: {
                id: string;
                name: string | null;
                email: string;
            } | undefined;
            attachments?: {
                id: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileUrl: string;
            }[] | undefined;
        };
        meta: object;
    }>;
    assign: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            ticketId: string;
            assignedToId: string | null;
        };
        output: {
            id: string;
            ticketNumber: string;
            subject: string | null;
            description: string | null;
            type: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
            source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
            createdById: string;
            teamId: string | null;
            assignedToId: string | null;
            lastMessageId: string | null;
            lastMessageAt: Date | null;
            lastMessagePreview: string | null;
            unreadCount: number;
            customerUnreadCount: number;
            metadata: unknown;
            internalNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
            resolvedAt: Date | null;
            closedAt: Date | null;
            firstResponseAt: Date | null;
            lastResponseAt: Date | null;
            lastCustomerResponseAt: Date | null;
            lastAgentResponseAt: Date | null;
            createdBy?: {
                id: string;
                name: string | null;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            assignedTo?: {
                id: string;
                name: string | null;
                email: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    updateStatus: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            ticketId: string;
            status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
        };
        output: {
            id: string;
            ticketNumber: string;
            subject: string | null;
            description: string | null;
            type: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
            source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
            createdById: string;
            teamId: string | null;
            assignedToId: string | null;
            lastMessageId: string | null;
            lastMessageAt: Date | null;
            lastMessagePreview: string | null;
            unreadCount: number;
            customerUnreadCount: number;
            metadata: unknown;
            internalNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
            resolvedAt: Date | null;
            closedAt: Date | null;
            firstResponseAt: Date | null;
            lastResponseAt: Date | null;
            lastCustomerResponseAt: Date | null;
            lastAgentResponseAt: Date | null;
            createdBy?: {
                id: string;
                name: string | null;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            assignedTo?: {
                id: string;
                name: string | null;
                email: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    archive: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            ticketId: string;
        };
        output: {
            id: string;
            ticketNumber: string;
            subject: string | null;
            description: string | null;
            type: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
            source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
            createdById: string;
            teamId: string | null;
            assignedToId: string | null;
            lastMessageId: string | null;
            lastMessageAt: Date | null;
            lastMessagePreview: string | null;
            unreadCount: number;
            customerUnreadCount: number;
            metadata: unknown;
            internalNotes: string | null;
            createdAt: Date;
            updatedAt: Date;
            resolvedAt: Date | null;
            closedAt: Date | null;
            firstResponseAt: Date | null;
            lastResponseAt: Date | null;
            lastCustomerResponseAt: Date | null;
            lastAgentResponseAt: Date | null;
            createdBy?: {
                id: string;
                name: string | null;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            assignedTo?: {
                id: string;
                name: string | null;
                email: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    markAllTicketMessagesAsRead: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            ticketId: string;
        };
        output: {
            markedCount: number;
            ticket: {
                id: string;
                ticketNumber: string;
                subject: string | null;
                description: string | null;
                type: "GENERAL" | "TECHNICAL" | "BILLING" | "FEATURE" | "BUG" | "ACCOUNT" | "HOSTING" | "DOMAIN" | "EMAIL" | "WORDPRESS";
                priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
                status: "OPEN" | "CANCELLED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
                source: "WEB" | "EMAIL" | "API" | "CHAT" | "PHONE";
                createdById: string;
                teamId: string | null;
                assignedToId: string | null;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
                lastMessagePreview: string | null;
                unreadCount: number;
                customerUnreadCount: number;
                metadata: unknown;
                internalNotes: string | null;
                createdAt: Date;
                updatedAt: Date;
                resolvedAt: Date | null;
                closedAt: Date | null;
                firstResponseAt: Date | null;
                lastResponseAt: Date | null;
                lastCustomerResponseAt: Date | null;
                lastAgentResponseAt: Date | null;
                createdBy?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | undefined;
                team?: {
                    id: string;
                    name: string;
                    slug: string;
                } | null | undefined;
                assignedTo?: {
                    id: string;
                    name: string | null;
                    email: string;
                } | null | undefined;
            };
        };
        meta: object;
    }>;
}>>;
