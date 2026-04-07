export declare const linkedInAdsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Authentication endpoints
     * Reuses existing SocialMediaIntegration
     */
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                success: boolean;
                data: {
                    connected: boolean;
                    hasAccessToken: boolean;
                    accessTokenExpiresAt: null;
                    isExpired: boolean;
                    scope: null;
                    status: null;
                    integrationId?: undefined;
                    userId?: undefined;
                    hasAdsScopes?: undefined;
                };
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
                    accessTokenExpiresAt: string | null;
                    isExpired: boolean | null;
                    scope: string | null;
                    status: string;
                    userId: string;
                    connected: boolean;
                    hasAdsScopes: boolean;
                };
                meta: {
                    has_credentials: boolean;
                    created_at: string;
                    updated_at: string;
                };
            };
            meta: object;
        }>;
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
    }>>;
    /**
     * Ad accounts management endpoints
     */
    accounts: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listAdAccounts: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string | null;
                    currency: string | null;
                    timezone: string | null;
                    status: string | null;
                    servingStatuses: string[];
                    reference: string | null;
                    type: string | null;
                }[];
                meta: {
                    retrieved_at: string;
                    total_accounts: number;
                    paging: {
                        count?: number;
                        start?: number;
                        links?: Array<{
                            rel: string;
                            href: string;
                        }>;
                    } | undefined;
                };
            } | {
                success: boolean;
                data: never[];
                meta: {
                    retrieved_at: string;
                    total_accounts: number;
                    paging?: undefined;
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
                    id: string;
                    name: string | null;
                    currency: string | null;
                    timezone: string | null;
                    status: string | null;
                    servingStatuses: string[];
                    reference: string | null;
                    type: string | null;
                };
            };
            meta: object;
        }>;
    }>>;
    /**
     * Campaign groups management endpoints (Campaigns in UI)
     */
    campaignGroups: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    /**
     * Campaigns management endpoints (Ad Sets in UI)
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
                campaignGroupId: string;
                timeRange?: {
                    since?: string | undefined;
                    until?: string | undefined;
                } | undefined;
            };
            output: {
                success: boolean;
                data: any[];
                meta: {
                    retrieved_at: string;
                    total_campaigns: number;
                    paging: {
                        count?: number;
                        start?: number;
                        links?: Array<{
                            rel: string;
                            href: string;
                        }>;
                    } | undefined;
                    insightsDiagnostics: {
                        requested: boolean;
                        responseElements: number;
                        mappedCampaigns: number;
                        error: string | null;
                    };
                };
            };
            meta: object;
        }>;
        resolveTargetingCriteria: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                targetingCriteria: any;
            };
            output: {
                data: {
                    label: string;
                    content: string;
                }[];
                debug: {
                    facetKey: string;
                    url: string;
                    statusCode: number;
                    resolvedCount: number;
                    rawResponse: string;
                }[];
            };
            meta: object;
        }>;
        getCampaignDetails: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                campaignGroupId: string;
                campaignId: string;
            };
            output: {
                success: boolean;
                data: any;
            };
            meta: object;
        }>;
    }>>;
    /**
     * Creatives management endpoints (Ads in UI)
     */
    creatives: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listAccountCreatives: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accountId: string;
                pageSize?: number | undefined;
                pageToken?: string | undefined;
                campaignIds?: string[] | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: any;
                    name: any;
                    campaign: any;
                    account: any;
                    intendedStatus: string | null;
                    reviewStatus: string | null;
                    isServing: boolean;
                    servingHoldReasons: string[];
                    contentReference: any;
                    inlineContent: any;
                    leadgenCallToAction: {
                        label: string | null;
                        destination: any;
                    } | null;
                    createdAt: any;
                    lastModifiedAt: any;
                }[];
                meta: {
                    retrieved_at: string;
                    total_creatives: number;
                    nextPageToken: string | null;
                };
            };
            meta: object;
        }>;
        getCreativePreview: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accountId: string;
                creativeId: string;
                livePreviewCreative?: {
                    campaign: string;
                    intendedStatus?: string | undefined;
                    contentReference?: string | undefined;
                    inlineContent?: Record<any, unknown> | undefined;
                } | undefined;
            };
            output: {
                success: boolean;
                data: {
                    preview: any;
                    creative: any;
                    placement: any;
                }[];
                meta: {
                    retrieved_at: string;
                    total_previews: number;
                    previewSource: "none" | "accurate" | "live_action";
                    unsupportedCreativeType: boolean;
                    message?: undefined;
                };
            } | {
                success: boolean;
                data: never[];
                meta: {
                    retrieved_at: string;
                    total_previews: number;
                    unsupportedCreativeType: boolean;
                    message: string;
                    previewSource?: undefined;
                };
            };
            meta: object;
        }>;
        listCreatives: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accountId: string;
                campaignId: string;
                timeRange?: {
                    since?: string | undefined;
                    until?: string | undefined;
                } | undefined;
            };
            output: {
                success: boolean;
                data: any[];
                meta: {
                    retrieved_at: string;
                    total_creatives: number;
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
        getCreativeDetails: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                campaignId: string;
                creativeId: string;
            };
            output: {
                success: boolean;
                data: any;
            };
            meta: object;
        }>;
    }>>;
    /**
     * Public standardized-data endpoints (reference lists for targeting labels).
     * No session required – pass an accessToken in the input.
     * Use from Postman to harvest complete lists for building static maps.
     */
    standardizedData: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getSeniorities: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                start?: number | undefined;
                count?: number | undefined;
            };
            output: any;
            meta: object;
        }>;
        getIndustries: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                start?: number | undefined;
                count?: number | undefined;
            };
            output: any;
            meta: object;
        }>;
        getFunctions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                start?: number | undefined;
                count?: number | undefined;
            };
            output: any;
            meta: object;
        }>;
        getTitles: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                start?: number | undefined;
                count?: number | undefined;
            };
            output: any;
            meta: object;
        }>;
        getTitlesByIds: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                ids: string[];
            };
            output: any;
            meta: object;
        }>;
        getSkills: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                start?: number | undefined;
                count?: number | undefined;
            };
            output: any;
            meta: object;
        }>;
        getSkillsByIds: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                ids: string[];
            };
            output: any;
            meta: object;
        }>;
        getDegrees: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                start?: number | undefined;
                count?: number | undefined;
            };
            output: any;
            meta: object;
        }>;
        getDegreesByIds: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                ids: string[];
            };
            output: any;
            meta: object;
        }>;
        getFieldsOfStudy: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                start?: number | undefined;
                count?: number | undefined;
            };
            output: any;
            meta: object;
        }>;
        getFieldsOfStudyByIds: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken: string;
                ids: string[];
            };
            output: any;
            meta: object;
        }>;
    }>>;
}>>;
