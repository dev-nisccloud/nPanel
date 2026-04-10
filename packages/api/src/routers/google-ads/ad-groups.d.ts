export declare const googleAdsAdGroupsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List ad groups for a specific campaign
     * Uses GAQL to fetch ad groups with metrics
     */
    listAdGroups: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            campaignId: string;
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
                type: string | undefined;
                cpc_bid: number | null;
                cpm_bid: number | null;
                target_cpa: number | null;
                target_roas: number | undefined;
                insights: {
                    impressions: string | null;
                    clicks: string | null;
                    interactions: string | null;
                    cost: string | null;
                    ctr: string | null;
                    interaction_rate: string | null;
                    cpc: string | null;
                    conversions: string | null;
                    conversions_value: string | null;
                    all_conversions: string | null;
                    all_conversions_value: string | null;
                    cost_per_conversion: string | null;
                };
            }[];
            meta: {
                retrieved_at: string;
                total_ad_groups: number;
            };
        };
        meta: object;
    }>;
}>>;
