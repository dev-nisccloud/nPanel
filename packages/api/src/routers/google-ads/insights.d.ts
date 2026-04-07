export declare const googleAdsInsightsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get daily performance metrics for a specific campaign
     */
    getDailyPerformance: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            campaignId: string;
            timeRange: {
                since: string;
                until: string;
            };
        };
        output: {
            success: boolean;
            data: {
                date: string | undefined;
                impressions: string;
                clicks: string;
                spend: string;
                conversions: string;
                conversions_value: string;
                interaction_rate: string;
                cpc: string;
                ctr: string;
            }[];
        };
        meta: object;
    }>;
    /**
     * Get breakdown metrics (device, geography, demographics)
     */
    getBreakdowns: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            campaignId: string;
            timeRange: {
                since: string;
                until: string;
            };
            breakdown: "device" | "region" | "gender" | "age_range" | "search_terms";
        };
        output: {
            success: boolean;
            data: Record<string, any>[];
        };
        meta: object;
    }>;
    /**
     * Get keyword performance for a specific campaign
     */
    getKeywordsPerformance: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            campaignId: string;
            timeRange: {
                since: string;
                until: string;
            };
        };
        output: {
            success: boolean;
            data: {
                keyword: string | undefined;
                matchType: string;
                status: string;
                impressions: number;
                clicks: number;
                spend: string;
                ctr: string;
                cpc: string;
                conversions: number;
            }[];
        };
        meta: object;
    }>;
    /**
     * Get network performance breakdown
     */
    getNetworkBreakdown: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            campaignId: string;
            timeRange: {
                since: string;
                until: string;
            };
        };
        output: {
            success: boolean;
            data: {
                network: string;
                impressions: number;
                clicks: number;
                spend: string;
            }[];
        };
        meta: object;
    }>;
    /**
     * Get time-of-day and day-of-week breakdown
     */
    getTimeOfDayBreakdown: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            customerId: string;
            campaignId: string;
            timeRange: {
                since: string;
                until: string;
            };
        };
        output: {
            success: boolean;
            data: {
                dayOfWeek: string;
                hour: number | undefined;
                impressions: number;
                clicks: number;
                spend: string;
            }[];
        };
        meta: object;
    }>;
}>>;
