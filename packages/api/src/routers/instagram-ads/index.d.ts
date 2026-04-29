/**
 * Instagram Ads Router
 * This router specifically uses the Instagram standalone integration token
 * to access the Meta Marketing API for Instagram-related advertising data.
 */
export declare const instagramAdsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Ad accounts management endpoints specifically for Instagram
     */
    accounts: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listAdAccounts: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                forceRefresh?: boolean | undefined;
            } | undefined;
            output: {
                success: boolean;
                data: {
                    id: string;
                    accountId: string;
                    accountName: string | null;
                    currency: string | null;
                    timezone: string | null;
                    status: string;
                    spendLimit: string | null;
                    amountSpent: string | null;
                    balance: string | null;
                    instagramUserId: null;
                    updatedAt: Date;
                }[];
                meta: {
                    retrieved_at: string;
                    total_accounts: number;
                    source: string;
                };
            } | {
                success: boolean;
                data: {
                    updatedAt: string;
                    id: string;
                    integrationId: string;
                    accountId: any;
                    accountName: any;
                    currency: any;
                    timezone: any;
                    status: "ACTIVE" | "CLOSED" | "DISABLED" | "UNSETTLED" | "PENDING_REVIEW" | "IN_GRACE_PERIOD" | "PENDING_CLOSURE";
                    spendLimit: any;
                    amountSpent: any;
                    balance: any;
                    instagramUserId: any;
                    createdAt: Date;
                }[];
                meta: {
                    retrieved_at: string;
                    total_accounts: number;
                    source: string;
                };
            };
            meta: object;
        }>;
        getAccountDetails: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accountId: string;
            };
            output: {
                success: boolean;
                data: {
                    status: "ACTIVE" | "CLOSED" | "DISABLED" | "UNSETTLED" | "PENDING_REVIEW" | "IN_GRACE_PERIOD" | "PENDING_CLOSURE";
                    account_id: string;
                    name?: string;
                    currency?: string;
                    timezone_name?: string;
                    account_status?: number;
                    spend_cap?: string;
                    amount_spent?: string;
                    balance?: string;
                };
            };
            meta: object;
        }>;
        getConnectedInstagramAccounts: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accountId: string;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    username?: string;
                    name?: string;
                    profile_pic?: string;
                }[];
            };
            meta: object;
        }>;
    }>>;
    /**
     * Campaigns management endpoints specifically for Instagram
     */
    campaigns: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    /**
     * Ad sets management endpoints specifically for Instagram
     */
    adSets: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    /**
     * Ads management endpoints specifically for Instagram
     */
    ads: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    /**
     * Insights and reporting endpoints specifically for Instagram
     */
    insights: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    }>>;
}>>;
