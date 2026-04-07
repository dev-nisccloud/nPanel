export declare const subscriptionUsageRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** Get existing usage row or create one for (subscriptionId, usageKind). Optionally set initialCredits on create. */
    getOrCreateUsage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionId: string;
            usageKind: string;
            initialCredits?: string | undefined;
        };
        output: {
            id: string;
            subscriptionId: string;
            usageKind: string;
            credits: string;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Get a single usage row by id. */
    getUsageById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            subscriptionId: string;
            usageKind: string;
            credits: string;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** List all usage rows for a subscription. */
    listForSubscription: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            subscriptionId: string;
        };
        output: {
            id: string;
            subscriptionId: string;
            usageKind: string;
            credits: string;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    /** Set credits to an absolute value and log the change. */
    setCredits: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionUsageId: string;
            credits: string;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
        };
        output: {
            id: string;
            subscriptionId: string;
            usageKind: string;
            credits: string;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Add or subtract credits (delta: positive = add, negative = consume) and log. Returns updated usage. */
    addCredits: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionUsageId: string;
            delta: string;
            action: "CREDIT_USE" | "CREDIT_ADD" | "CREDIT_RESET" | "CREDIT_ADJUST";
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
        };
        output: {
            usage: {
                id: string;
                subscriptionId: string;
                usageKind: string;
                credits: string;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            previousCredits: string;
            newCredits: string;
        };
        meta: object;
    }>;
    /** List activity logs for a subscription usage row. */
    listActivityLogs: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            subscriptionUsageId: string;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            items: {
                id: string;
                subscriptionUsageId: string;
                userId: string;
                action: string;
                description: string | null;
                metadata: unknown;
                ipAddress: string | null;
                userAgent: string | null;
                createdAt: Date;
            }[];
            total: number;
        };
        meta: object;
    }>;
}>>;
