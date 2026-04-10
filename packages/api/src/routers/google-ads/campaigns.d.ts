type TargetingRow = {
    label: string;
    content: string;
};
export declare const googleAdsCampaignsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List campaigns for a specific Google Ads customer account
     * Uses GAQL (Google Ads Query Language) to fetch campaigns with metrics
     */
    listCampaigns: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            timeRange?: {
                since: string;
                until: string;
            } | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                status: string;
                advertising_channel_type: string | undefined;
                advertising_channel_sub_type: string | undefined;
                start_date: string | undefined;
                end_date: string | undefined;
                bidding_strategy_type: string | undefined;
                budget_amount: number | null;
                budget_period: string | undefined;
                insights: {
                    impressions: string | null;
                    clicks: string | null;
                    cost: string | null;
                    ctr: string | null;
                    cpc: string | null;
                    conversions: string | null;
                    cost_per_conversion: string | null;
                    conversion_rate: string | null;
                    search_impression_share: string | null;
                };
            }[];
            meta: {
                retrieved_at: string;
                total_campaigns: number;
            };
        };
        meta: object;
    }>;
    /**
     * Get campaign details for a specific campaign
     */
    getCampaignDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            campaignId: string;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: any;
                status: string;
                advertising_channel_type: string | undefined;
                advertising_channel_sub_type: string | undefined;
                start_date: any;
                end_date: any;
                bidding_strategy_type: string | undefined;
                budget_amount: number | null;
                budget_period: string | undefined;
            };
        };
        meta: object;
    }>;
    /**
     * Get campaign-level targeting criteria (campaign_criterion).
     */
    getCampaignTargeting: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            campaignId: string;
        };
        output: {
            success: boolean;
            data: TargetingRow[];
            debug: {
                criterionId: string | null;
                type: string | null;
                negative: boolean;
                displayName: string | null;
                keywordText: string | null;
                matchType: string | null;
                location: string | null;
                language: string | null;
                ageRange: string | null;
                gender: string | null;
                userInterest: string | null;
                userList: string | null;
                topic: string | null;
                placementUrl: string | null;
            }[];
            meta: {
                total_criteria: number;
            };
        };
        meta: object;
    }>;
    /**
     * Get ad group-level targeting criteria in bulk (ad_group_criterion).
     */
    getBulkAdGroupTargeting: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            adGroupIds: string[];
        };
        output: {
            success: boolean;
            data: Record<string, {
                data: TargetingRow[];
                debug: any[];
            }>;
            meta: {
                total_ad_groups: number;
                total_criteria: number;
            };
        };
        meta: object;
    }>;
}>>;
export {};
