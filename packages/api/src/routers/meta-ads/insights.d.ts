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
            publisherPlatform?: "facebook" | "instagram" | "audience_network" | "messenger" | undefined;
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
            publisherPlatform?: "facebook" | "instagram" | "audience_network" | "messenger" | undefined;
        };
        output: {
            success: boolean;
            data: any[];
            meta: {
                fallbackUsed: boolean;
                fallbackReason?: undefined;
            };
        } | {
            success: boolean;
            data: any[];
            meta: {
                fallbackUsed: boolean;
                fallbackReason: string;
            };
        };
        meta: object;
    }>;
    /**
     * Trigger a new AI campaign analysis
     */
    triggerAiAnalysis: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            campaignId: string;
            data: any;
            internalCampaignId?: string | undefined;
        };
        output: {
            success: boolean;
            analysisId: string;
            status: string;
        };
        meta: object;
    }>;
    /**
     * Get the status of a specific analysis
     */
    getAnalysisStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            analysisId: string;
        };
        output: {
            status: string;
            analysis: string | null;
            errorMessage: string | null;
        };
        meta: object;
    }>;
    /**
     * List all analyses for a campaign
     */
    listAnalyses: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            userId: string;
            metadata: unknown;
            errorMessage: string | null;
            campaignId: string;
            internalCampaignId: string | null;
            analysis: string | null;
        }[];
        meta: object;
    }>;
    /**
     * Get the latest completed analysis for a campaign
     */
    getLatestAnalysis: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            userId: string;
            metadata: unknown;
            errorMessage: string | null;
            campaignId: string;
            internalCampaignId: string | null;
            analysis: string | null;
        } | null;
        meta: object;
    }>;
}>>;
