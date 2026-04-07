export declare const wordpressSubscriptionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getDetailWithSubscription: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: {
            installation: any;
            subscription: {
                id: string;
                teamId: string | null;
                installationId: number;
                hostingSubscriptionId: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
        };
        meta: object;
    }>;
    getByInstallationId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            installationId: number;
        };
        output: {
            id: string;
            teamId: string | null;
            installationId: number;
            hostingSubscriptionId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    linkToTeam: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            teamId: string;
            installationId: number;
            hostingPlanId?: string | undefined;
        };
        output: {
            success: boolean;
            id: string;
        };
        meta: object;
    }>;
    unlinkFromTeam: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionId: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    updateSubscription: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionId: string;
            hostingPlanId?: string | undefined;
        };
        output: {
            success: boolean;
            id: string;
        };
        meta: object;
    }>;
}>>;
