export declare const metaAdsCampaignsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List campaigns for a specific ad account
     * Returns campaigns directly from Meta API (no DB storage)
     */
    listCampaigns: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
            datePreset?: string | undefined;
            timeRange?: {
                since: string;
                until: string;
            } | undefined;
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
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
}>>;
