export declare const instagramAdsAdsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List ads for an ad set using Instagram token
     * GET /{ad-set-id}/ads
     */
    listAds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            adSetId: string;
            datePreset?: string | undefined;
            timeRange?: {
                since?: string | undefined;
                until?: string | undefined;
            } | undefined;
        };
        output: {
            data: {
                id: any;
                name: any;
                status: string;
                creative: any;
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
     * Get ad details
     * GET /{ad-id}
     */
    getAdDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            adId: string;
        };
        output: {
            data: {
                id: any;
                name: any;
                status: string;
                creative: any;
                created_time: any;
                updated_time: any;
            };
        };
        meta: object;
    }>;
    /**
     * List all ads for a campaign in bulk (with insights) using Instagram token
     */
    listCampaignAds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
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
                adset_id: any;
                name: any;
                status: string;
                creative: any;
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
}>>;
