export declare const metaAdsInsightsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get daily performance metrics for a specific entity
     */
    getDailyPerformance: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            entityId: string;
            level: "campaign" | "ad" | "adset";
            timeRange: {
                since: string;
                until: string;
            };
        };
        output: {
            success: boolean;
            data: any[];
        };
        meta: object;
    }>;
    /**
     * Get audience and platform breakdowns for a specific entity
     */
    getBreakdowns: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            entityId: string;
            level: "campaign" | "ad" | "adset";
            timeRange: {
                since: string;
                until: string;
            };
            breakdown: "region" | "gender" | "age" | "publisher_platform" | "device_platform" | "platform_position" | "hourly_stats_aggregated_by_audience_time_zone";
        };
        output: {
            success: boolean;
            data: any[];
        };
        meta: object;
    }>;
}>>;
