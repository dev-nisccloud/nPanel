export declare const notificationsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId?: string | undefined;
            teamId?: string | undefined;
            seen?: boolean | undefined;
            type?: "GENERAL" | "HOSTING" | "DOMAIN" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN" | undefined;
            priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
            since?: string | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            id: string;
            userId: string;
            teamId: string | null;
            type: "GENERAL" | "HOSTING" | "DOMAIN" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            title: string | null;
            message: string;
            link: string | null;
            metadata: unknown;
            seen: boolean;
            readAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        }[];
        meta: object;
    }>;
    getUnseenCount: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId?: string | undefined;
            teamId?: string | undefined;
        } | undefined;
        output: {
            count: number;
        };
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
            type: "GENERAL" | "HOSTING" | "DOMAIN" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            title: string | null;
            message: string;
            link: string | null;
            metadata: unknown;
            seen: boolean;
            readAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            userId: string;
            message: string;
            teamId?: string | undefined;
            type?: "GENERAL" | "HOSTING" | "DOMAIN" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN" | undefined;
            priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
            title?: string | undefined;
            link?: string | undefined;
            metadata?: unknown;
        };
        output: {
            id: string;
            userId: string;
            teamId: string | null;
            type: "GENERAL" | "HOSTING" | "DOMAIN" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            title: string | null;
            message: string;
            link: string | null;
            metadata: unknown;
            seen: boolean;
            readAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            title?: string | undefined;
            message?: string | undefined;
            link?: string | undefined;
            metadata?: unknown;
            priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
        };
        output: {
            id: string;
            userId: string;
            teamId: string | null;
            type: "GENERAL" | "HOSTING" | "DOMAIN" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            title: string | null;
            message: string;
            link: string | null;
            metadata: unknown;
            seen: boolean;
            readAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    markAsSeen: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            userId: string;
            teamId: string | null;
            type: "GENERAL" | "HOSTING" | "DOMAIN" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            title: string | null;
            message: string;
            link: string | null;
            metadata: unknown;
            seen: boolean;
            readAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    markAsUnseen: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            userId: string;
            teamId: string | null;
            type: "GENERAL" | "HOSTING" | "DOMAIN" | "SYSTEM" | "USER" | "TEAM" | "ORDER" | "PAYMENT" | "INVOICE" | "CREATIVE_BRIEF" | "CREATIVE_ASSET" | "SOCIAL_MEDIA" | "EMAIL_MARKETING" | "AD_CAMPAIGN";
            priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
            title: string | null;
            message: string;
            link: string | null;
            metadata: unknown;
            seen: boolean;
            readAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
        };
        meta: object;
    }>;
    markAllAsSeen: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            userId?: string | undefined;
            teamId?: string | undefined;
        };
        output: {
            count: number;
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
