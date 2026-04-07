export declare const linkedInAdsCampaignGroupsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List campaign groups for a specific ad account
     * Returns campaign groups directly from LinkedIn API with optional insights
     */
    listCampaignGroups: import("@trpc/server").TRPCQueryProcedure<{
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
                total_campaign_groups: number;
                paging: {
                    count?: number;
                    start?: number;
                    links?: Array<{
                        rel: string;
                        href: string;
                    }>;
                } | undefined;
            };
        };
        meta: object;
    }>;
    /**
     * Get campaign group details
     */
    getCampaignGroupDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
            campaignGroupId: string;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
}>>;
