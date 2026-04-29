export declare const instagramAdsCampaignsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List campaigns for a specific ad account
     * Returns campaigns directly from Meta API using Instagram token
     */
    listCampaigns: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
            datePreset?: string | undefined;
            timeRange?: {
                since: string;
                until: string;
            } | undefined;
            publisherPlatform?: "facebook" | "instagram" | "audience_network" | "messenger" | undefined;
        };
        output: {
            success: boolean;
            data: any[];
            meta: {
                retrieved_at: string;
                total_campaigns: number;
                paging: {
                    cursors?: {
                        before?: string;
                        after?: string;
                    };
                    next?: string;
                    previous?: string;
                } | undefined;
            };
        };
        meta: object;
    }>;
    /**
     * Get campaign details
     */
    getCampaignDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
            campaignId: string;
            publisherPlatform?: "facebook" | "instagram" | "audience_network" | "messenger" | undefined;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
}>>;
