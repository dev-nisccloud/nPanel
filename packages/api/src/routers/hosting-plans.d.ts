export declare const hostingPlansRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            planType?: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING" | undefined;
            hostingSubType?: "EMAIL_HOSTING" | "WEB_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
            isActive?: boolean | undefined;
        } | undefined;
        output: {
            id: string;
            name: string;
            description: string | null;
            planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
            hostingSubType: "EMAIL_HOSTING" | "WEB_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            features: string[];
            highlights: string[];
            isPopular: boolean;
            isRecommended: boolean;
            niscPrice: string | null;
            niscCurrency: string;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
            setupFee: string | null;
            isActive: boolean;
            isDefault: boolean;
            pleskServicePlanId: string | null;
            pleskFilterId: string | null;
            pleskIpAddress: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            name: string;
            description: string | null;
            planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
            hostingSubType: "EMAIL_HOSTING" | "WEB_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            features: string[];
            highlights: string[];
            isPopular: boolean;
            isRecommended: boolean;
            niscPrice: string | null;
            niscCurrency: string;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
            setupFee: string | null;
            isActive: boolean;
            isDefault: boolean;
            pleskServicePlanId: string | null;
            pleskFilterId: string | null;
            pleskIpAddress: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
            description?: string | undefined;
            hostingSubType?: "EMAIL_HOSTING" | "WEB_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
            features?: string[] | undefined;
            highlights?: string[] | undefined;
            isPopular?: boolean | undefined;
            isRecommended?: boolean | undefined;
            niscPrice?: string | undefined;
            niscCurrency?: string | undefined;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
            setupFee?: string | undefined;
            isActive?: boolean | undefined;
            isDefault?: boolean | undefined;
            pleskServicePlanId?: string | undefined;
            pleskFilterId?: string | undefined;
            pleskIpAddress?: string | undefined;
        };
        output: {
            id: string;
            name: string;
            description: string | null;
            planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
            hostingSubType: "EMAIL_HOSTING" | "WEB_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            features: string[];
            highlights: string[];
            isPopular: boolean;
            isRecommended: boolean;
            niscPrice: string | null;
            niscCurrency: string;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
            setupFee: string | null;
            isActive: boolean;
            isDefault: boolean;
            pleskServicePlanId: string | null;
            pleskFilterId: string | null;
            pleskIpAddress: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            name?: string | undefined;
            description?: string | undefined;
            planType?: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING" | undefined;
            hostingSubType?: "EMAIL_HOSTING" | "WEB_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
            features?: string[] | undefined;
            highlights?: string[] | undefined;
            isPopular?: boolean | undefined;
            isRecommended?: boolean | undefined;
            niscPrice?: string | undefined;
            niscCurrency?: string | undefined;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
            setupFee?: string | undefined;
            isActive?: boolean | undefined;
            isDefault?: boolean | undefined;
            pleskServicePlanId?: string | undefined;
            pleskFilterId?: string | undefined;
            pleskIpAddress?: string | undefined;
        };
        output: {
            id: string;
            name: string;
            description: string | null;
            planType: "HOSTING" | "SEO" | "VIDEOGRAPHY" | "VISUAL_CREATIVE" | "SOCIAL_MEDIA_MARKETING" | "PAY_PER_CLICK_ADVERTISING";
            hostingSubType: "EMAIL_HOSTING" | "WEB_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            features: string[];
            highlights: string[];
            isPopular: boolean;
            isRecommended: boolean;
            niscPrice: string | null;
            niscCurrency: string;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
            setupFee: string | null;
            isActive: boolean;
            isDefault: boolean;
            pleskServicePlanId: string | null;
            pleskFilterId: string | null;
            pleskIpAddress: string | null;
            createdAt: Date;
            updatedAt: Date;
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
