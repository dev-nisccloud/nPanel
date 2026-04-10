export declare const linkedInAdsInsightsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Daily time series for a campaign group (LinkedIn "campaign group details" page)
     * Uses adAnalytics with timeGranularity=DAILY and pivot=CAMPAIGN_GROUP.
     */
    getDailyPerformance: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
            campaignGroupId: string;
            timeRange: {
                since: string;
                until: string;
            };
        };
        output: {
            success: boolean;
            data: {
                date: string;
                impressions: number;
                clicks: number;
                spend: number;
                conversions: number;
                leads: number;
                landingPageClicks: number;
                engagements: number;
                videoViews: number;
                videoCompletions: number;
            }[];
            meta: {
                retrieved_at: string;
                points: number;
            };
        };
        meta: object;
    }>;
    /**
     * Breakdowns using official pivot enums (device, placement, serving location, objective, demographics, etc.)
     * Uses adAnalytics timeGranularity=ALL.
     */
    getBreakdown: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
            campaignGroupId: string;
            timeRange: {
                since: string;
                until: string;
            };
            pivot: "IMPRESSION_DEVICE_TYPE" | "PLACEMENT_NAME" | "SERVING_LOCATION" | "CAMPAIGN" | "CREATIVE" | "OBJECTIVE_TYPE" | "MEMBER_COMPANY_SIZE" | "MEMBER_INDUSTRY" | "MEMBER_SENIORITY" | "MEMBER_JOB_TITLE" | "MEMBER_JOB_FUNCTION" | "MEMBER_COUNTRY_V2" | "MEMBER_REGION_V2" | "MEMBER_COMPANY";
        };
        output: {
            success: boolean;
            data: {
                pivot: string;
                impressions: number;
                clicks: number;
                spend: number;
            }[];
            meta: {
                retrieved_at: string;
                pivot: "OBJECTIVE_TYPE";
                fallbackUsed?: undefined;
            };
        } | {
            success: boolean;
            data: {
                pivot: string;
                rawPivot: string;
                pivotId: string;
                impressions: number;
                clicks: number;
                spend: number;
                conversions: number;
                leads: number;
                videoViews: number;
            }[];
            meta: {
                retrieved_at: string;
                pivot: "IMPRESSION_DEVICE_TYPE" | "PLACEMENT_NAME" | "SERVING_LOCATION" | "CAMPAIGN" | "CREATIVE" | "MEMBER_COMPANY_SIZE" | "MEMBER_INDUSTRY" | "MEMBER_SENIORITY" | "MEMBER_JOB_TITLE" | "MEMBER_JOB_FUNCTION" | "MEMBER_COUNTRY_V2" | "MEMBER_REGION_V2" | "MEMBER_COMPANY";
                fallbackUsed: boolean;
            };
        };
        meta: object;
    }>;
}>>;
