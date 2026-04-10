export declare const googleAdsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        generateAuthUrl: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                redirectUri?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    url: string;
                    state: string;
                };
                meta: {
                    generated_at: string;
                };
            };
            meta: object;
        }>;
        generateToken: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                code: string;
                redirectUri?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    accessToken: string;
                    refreshToken: string;
                    tokenType: string;
                    expiresIn: number;
                    expiresAt: string;
                };
                meta: {
                    generated_at: string;
                    integration_id: string;
                };
            };
            meta: object;
        }>;
        getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                success: boolean;
                data: null;
                meta: {
                    has_credentials: boolean;
                    created_at?: undefined;
                    updated_at?: undefined;
                };
            } | {
                success: boolean;
                data: {
                    integrationId: string;
                    hasAccessToken: boolean;
                    hasRefreshToken: boolean;
                    accessTokenExpiresAt: string | null;
                    isExpired: boolean | null;
                    scope: string | null;
                    status: string;
                    userId: string;
                    connected: boolean;
                };
                meta: {
                    has_credentials: boolean;
                    created_at: string;
                    updated_at: string;
                };
            };
            meta: object;
        }>;
        revokeToken: import("@trpc/server").TRPCMutationProcedure<{
            input: void;
            output: {
                success: boolean;
                data: {
                    revoked: boolean;
                };
                meta: {
                    revoked_at: string;
                };
            };
            meta: object;
        }>;
    }>>;
    accounts: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listAccessibleAccounts: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                forceRefresh?: boolean | undefined;
            } | undefined;
            output: {
                success: boolean;
                data: {
                    customerId: string;
                    accountName: string | null;
                    currencyCode: string | null;
                    timeZone: string | null;
                    status: string;
                    resourceName: string;
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
                customerId: string;
            };
            output: {
                success: boolean;
                data: {
                    customerId: string;
                    accountName: any;
                    currencyCode: any;
                    timeZone: any;
                    status: "ACTIVE" | "PAUSED" | "REMOVED";
                };
                meta: {
                    retrieved_at: string;
                    account_id: string;
                };
            };
            meta: object;
        }>;
    }>>;
    campaigns: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listCampaigns: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                customerId: string;
                timeRange?: {
                    since: string;
                    until: string;
                } | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    status: string;
                    advertising_channel_type: string | undefined;
                    advertising_channel_sub_type: string | undefined;
                    start_date: string | undefined;
                    end_date: string | undefined;
                    bidding_strategy_type: string | undefined;
                    budget_amount: number | null;
                    budget_period: string | undefined;
                    insights: {
                        impressions: string | null;
                        clicks: string | null;
                        cost: string | null;
                        ctr: string | null;
                        cpc: string | null;
                        conversions: string | null;
                        cost_per_conversion: string | null;
                        conversion_rate: string | null;
                        search_impression_share: string | null;
                    };
                }[];
                meta: {
                    retrieved_at: string;
                    total_campaigns: number;
                };
            };
            meta: object;
        }>;
        getCampaignDetails: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                customerId: string;
                campaignId: string;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: any;
                    status: string;
                    advertising_channel_type: string | undefined;
                    advertising_channel_sub_type: string | undefined;
                    start_date: any;
                    end_date: any;
                    bidding_strategy_type: string | undefined;
                    budget_amount: number | null;
                    budget_period: string | undefined;
                };
            };
            meta: object;
        }>;
        getCampaignTargeting: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                customerId: string;
                campaignId: string;
            };
            output: {
                success: boolean;
                data: {
                    label: string;
                    content: string;
                }[];
                debug: {
                    criterionId: string | null;
                    type: string | null;
                    negative: boolean;
                    displayName: string | null;
                    keywordText: string | null;
                    matchType: string | null;
                    location: string | null;
                    language: string | null;
                    ageRange: string | null;
                    gender: string | null;
                    userInterest: string | null;
                    userList: string | null;
                    topic: string | null;
                    placementUrl: string | null;
                }[];
                meta: {
                    total_criteria: number;
                };
            };
            meta: object;
        }>;
        getBulkAdGroupTargeting: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                customerId: string;
                adGroupIds: string[];
            };
            output: {
                success: boolean;
                data: Record<string, {
                    data: {
                        label: string;
                        content: string;
                    }[];
                    debug: any[];
                }>;
                meta: {
                    total_ad_groups: number;
                    total_criteria: number;
                };
            };
            meta: object;
        }>;
    }>>;
    adGroups: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listAdGroups: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                customerId: string;
                campaignId: string;
                timeRange?: {
                    since: string;
                    until: string;
                } | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    status: string;
                    type: string | undefined;
                    cpc_bid: number | null;
                    cpm_bid: number | null;
                    target_cpa: number | null;
                    target_roas: number | undefined;
                    insights: {
                        impressions: string | null;
                        clicks: string | null;
                        interactions: string | null;
                        cost: string | null;
                        ctr: string | null;
                        interaction_rate: string | null;
                        cpc: string | null;
                        conversions: string | null;
                        conversions_value: string | null;
                        all_conversions: string | null;
                        all_conversions_value: string | null;
                        cost_per_conversion: string | null;
                    };
                }[];
                meta: {
                    retrieved_at: string;
                    total_ad_groups: number;
                };
            };
            meta: object;
        }>;
    }>>;
    ads: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listAds: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                customerId: string;
                adGroupId: string;
                timeRange?: {
                    since: string;
                    until: string;
                } | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    type: string | undefined;
                    status: string;
                    headlines: string[] | undefined;
                    descriptions: string[] | undefined;
                    headline_part1: string | undefined;
                    headline_part2: string | undefined;
                    headline_part3: string | undefined;
                    description: string | undefined;
                    description2: string | undefined;
                    insights: {
                        impressions: string | null;
                        clicks: string | null;
                        interactions: string | null;
                        cost: string | null;
                        ctr: string | null;
                        interaction_rate: string | null;
                        cpc: string | null;
                        conversions: string | null;
                        conversions_value: string | null;
                        all_conversions: string | null;
                        all_conversions_value: string | null;
                        cost_per_conversion: string | null;
                    };
                }[];
                meta: {
                    retrieved_at: string;
                    total_ads: number;
                };
            };
            meta: object;
        }>;
        listAdsBulk: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                customerId: string;
                adGroupIds: string[];
                timeRange?: {
                    since: string;
                    until: string;
                } | undefined;
            };
            output: {
                success: boolean;
                data: Record<string, any[]>;
                meta: {
                    retrieved_at: string;
                    total_ad_groups: number;
                };
            };
            meta: object;
        }>;
    }>>;
    insights: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
}>>;
