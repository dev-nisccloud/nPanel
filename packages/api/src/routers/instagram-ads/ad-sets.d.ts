export declare const instagramAdsAdSetsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List ad sets for a campaign using Instagram token
     * GET /{campaign-id}/adsets
     */
    listAdSets: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignId: string;
            datePreset?: string | undefined;
            timeRange?: {
                since?: string | undefined;
                until?: string | undefined;
            } | undefined;
            publisherPlatform?: "facebook" | "instagram" | "audience_network" | "messenger" | undefined;
        };
        output: {
            data: {
                id: any;
                name: any;
                status: string;
                daily_budget: string | null;
                lifetime_budget: string | null;
                budget_remaining: string | null;
                bid_amount: any;
                targeting: any;
                publisher_platforms: any;
                instagram_positions: any;
                start_time: any;
                stop_time: any;
                created_time: any;
                updated_time: any;
                insights: {
                    reach: string | null;
                    impressions: string | null;
                    clicks: string | null;
                    link_clicks: string | null;
                    cpc: string | null;
                    ctr: string | null;
                    spend: string | null;
                    cpm: string | null;
                    cpp: string | null;
                    frequency: string | null;
                    unique_clicks: string | null;
                    unique_ctr: string | null;
                    purchase_roas: any;
                    quality_ranking: any;
                    engagement_rate_ranking: any;
                    conversion_rate_ranking: any;
                    cost_per_result: string | null;
                    leads: string | null;
                    cost_per_lead: string | null;
                    actions: any;
                } | null;
            }[];
            paging: {
                cursors?: {
                    before?: string;
                    after?: string;
                };
                next?: string;
                previous?: string;
            } | undefined;
        };
        meta: object;
    }>;
    /**
     * Get ad set details
     * GET /{ad-set-id}
     */
    getAdSetDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            adSetId: string;
            publisherPlatform?: "facebook" | "instagram" | "audience_network" | "messenger" | undefined;
        };
        output: {
            data: {
                id: any;
                name: any;
                status: string;
                daily_budget: any;
                lifetime_budget: any;
                budget_remaining: any;
                bid_amount: any;
                targeting: any;
                publisher_platforms: any;
                instagram_positions: any;
                start_time: any;
                stop_time: any;
                created_time: any;
                updated_time: any;
            };
        };
        meta: object;
    }>;
    /**
     * Get human-readable targeting description for an ad set
     * GET /{ad-set-id}/targetingsentencelines
     */
    getTargetingSentenceLines: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            adSetId: string;
        };
        output: {
            data: {
                content: string;
                children?: string[];
            }[];
        };
        meta: object;
    }>;
    /**
     * Get human-readable targeting descriptions for multiple ad sets in bulk
     */
    getBulkTargetingSentenceLines: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            adSetIds: string[];
        };
        output: {
            data: Record<string, any[]>;
        };
        meta: object;
    }>;
}>>;
