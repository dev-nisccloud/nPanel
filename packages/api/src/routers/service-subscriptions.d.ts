export declare const serviceSubscriptionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    linkToSubscription: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionId: string;
            pleskFilterId: string;
            niscServicePlanId: string;
            teamId: string;
            hostingPlanId: string;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
            hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
            subscriptionDate?: unknown;
            expiryDate?: unknown;
            primaryDomain?: string | undefined;
            status?: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "FAILED" | "CANCELLED" | undefined;
            autoRenew?: boolean | undefined;
            notes?: string | undefined;
        };
        output: {
            id: string;
            niscServicePlanId: string;
            teamId: string | null;
            orderId: string | null;
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
            nextRenewalDate: Date | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "FAILED" | "CANCELLED";
            autoRenew: boolean;
            hostingSubscriptionId: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
            hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
        };
        meta: object;
    }>;
    getByHostingSubscriptionId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            hostingSubscriptionId: string;
        };
        output: {
            id: string;
            niscServicePlanId: string;
            teamId: string | null;
            teamName: string | null;
            orderId: string | null;
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
            nextRenewalDate: Date | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "FAILED" | "CANCELLED";
            autoRenew: boolean;
            hostingSubscriptionId: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
            hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            planName: string;
        } | null;
        meta: object;
    }>;
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | undefined;
            planType?: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING" | undefined;
            hostingSubType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
            status?: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "FAILED" | "CANCELLED" | undefined;
        } | undefined;
        output: {
            id: string;
            niscServicePlanId: string;
            teamId: string | null;
            teamName: string | null;
            orderId: string | null;
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
            nextRenewalDate: Date | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "EXPIRED" | "SUSPENDED" | "FAILED" | "CANCELLED";
            autoRenew: boolean;
            hostingSubscriptionId: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
            hostingSubType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            planName: string;
        }[];
        meta: object;
    }>;
}>>;
