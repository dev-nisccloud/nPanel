export declare const googleAdsAdsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List ads for a specific ad group
     * Uses GAQL to fetch ads with metrics
     */
    listAds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            adGroupId: string;
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
                type: string | undefined;
                status: string;
                headlines: string[] | undefined;
                descriptions: string[] | undefined;
                headline_part1: string | undefined;
                headline_part2: string | undefined;
                headline_part3: string | undefined;
                description: string | undefined;
                description2: string | undefined;
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
                total_ads: number;
            };
        };
        meta: object;
    }>;
    /**
     * Bulk list ads for multiple ad groups (for report export)
     * Uses a single GAQL query per chunk of ad groups, then aggregates by ad group + ad.
     */
    listAdsBulk: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            adGroupIds: string[];
            timeRange?: {
                since: string;
                until: string;
            } | undefined;
        };
        output: {
            success: boolean;
            data: Record<string, any[]>;
            meta: {
                retrieved_at: string;
                total_ad_groups: number;
            };
        };
        meta: object;
    }>;
}>>;
