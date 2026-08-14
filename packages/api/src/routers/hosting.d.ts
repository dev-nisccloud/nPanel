export declare const hostingRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getDetailWithSubscription: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            subscriptionId: string;
            teamId?: string | undefined;
        };
        output: {
            hosting: any;
            subscription: {
                id: string;
                teamId: string | null;
                hostingPlanId: string;
                primaryDomain: string | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                notes: string | null;
                autoRenew: boolean;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING";
            } | null;
            serviceSubscription: {
                id: string;
                subscriptionDate: string | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
                nextRenewalDate: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "CANCELLED" | "SUSPENDED" | "FAILED";
                autoRenew: boolean;
            } | null;
        };
        meta: object;
    }>;
    getByPleskFilterId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pleskFilterId: string;
        };
        output: {
            id: string;
            teamId: string | null;
            hostingPlanId: string;
            primaryDomain: string | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            notes: string | null;
            autoRenew: boolean;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING";
        } | null;
        meta: object;
    }>;
    getHostingByDomainName: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            domainName: string;
            teamId?: string | undefined;
        };
        output: {
            hasHosting: boolean;
            subscriptionId: string | null;
        };
        meta: object;
    }>;
    linkToTeam: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionId: string;
            teamId: string;
            pleskFilterId: string;
            hostingPlanId?: string | undefined;
            hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
            nextRenewalDate?: unknown;
            expiryDate?: unknown;
            primaryDomain?: string | undefined;
            notes?: string | undefined;
            autoRenew?: boolean | undefined;
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
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
            nextRenewalDate?: unknown;
            expiryDate?: unknown;
            primaryDomain?: string | undefined;
            notes?: string | undefined;
            autoRenew?: boolean | undefined;
        };
        output: {
            success: boolean;
            id: string;
        };
        meta: object;
    }>;
}>>;
