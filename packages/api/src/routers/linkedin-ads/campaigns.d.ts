export declare const linkedInAdsCampaignsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List campaigns (ad sets) for a campaign group
     * Returns campaigns directly from LinkedIn API with optional insights
     */
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
    /**
     * Resolve targeting criteria URNs to human-readable names.
     * All API calls (industries, seniorities, titles, skills, degrees, fields of study,
     * functions, geos) are made in parallel for speed.
     * Parseable facets (genders, locales, age/staff/growth/experience ranges) are
     * resolved inline with no extra network hop.
     */
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
    /**
     * Get campaign details
     */
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
