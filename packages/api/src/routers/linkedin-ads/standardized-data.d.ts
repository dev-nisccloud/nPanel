/**
 * LinkedIn Standardized Data – public tRPC procedures.
 *
 * These are intentionally PUBLIC (no session required) so they can be called
 * directly from Postman / curl to harvest the complete reference lists that
 * will later be baked into static lookup maps in the frontend.
 *
 * Usage from Postman:
 *   GET /api/trpc/linkedInAds.standardizedData.getSeniorities
 *       ?input={"json":{"accessToken":"AQX...","start":0,"count":100}}
 *
 * Paginate by incrementing `start` until `paging.links` contains no "next" link.
 */
export declare const linkedInAdsStandardizedDataRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * GET_ALL /v2/seniorities
     *
     * Small finite list (~10 entries). Run once and build a static map.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US: string } } }], paging }
     */
    getSeniorities: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            start?: number | undefined;
            count?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    /**
     * GET_ALL /v2/industries
     *
     * ~150 stable entries ("static V1" per LinkedIn docs). Run once → static map.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US: string } } }], paging }
     */
    getIndustries: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            start?: number | undefined;
            count?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    /**
     * GET_ALL /v2/functions
     *
     * Small list (~26 job functions, e.g. "Finance", "Engineering"). Run once → static map.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US: string } } }], paging }
     */
    getFunctions: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            start?: number | undefined;
            count?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    /**
     * GET_ALL /v2/titles  (max 50 per page – paginate with start=0,50,100,…)
     *
     * Thousands of entries. Too many to maintain manually; use BATCH_GET at display time instead.
     * This GET_ALL is provided for discovery / building a complete offline snapshot.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US: string } }, function, superTitle }], paging }
     */
    getTitles: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            start?: number | undefined;
            count?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    /**
     * BATCH_GET /v2/titles?ids=id1&ids=id2&…
     *
     * Resolve specific title IDs to names at display time.
     * Pass the numeric IDs extracted from the campaign's targetingCriteria URNs.
     * Response shape: { results: { "9": { id, name: { localized: { en_US } }, … } }, statuses, errors }
     */
    getTitlesByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            ids: string[];
        };
        output: any;
        meta: object;
    }>;
    /**
     * GET_ALL /v2/skills  (max 50 per page – paginate with start=0,50,100,…)
     *
     * Thousands of entries. Use BATCH_GET (getSkillsByIds) at display time.
     * Response shape: { elements: [{ id, $URN, standardizedName, locale }], paging }
     */
    getSkills: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            start?: number | undefined;
            count?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    /**
     * BATCH_GET /v2/skills?ids=id1&ids=id2&…
     *
     * Resolve specific skill IDs at display time.
     * Response shape: { results: { "5": { id, standardizedName, locale } }, statuses, errors }
     */
    getSkillsByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            ids: string[];
        };
        output: any;
        meta: object;
    }>;
    /**
     * GET_ALL /v2/degrees  (paginated)
     *
     * Manageable set. Run once → static map, or use BATCH_GET (getDegreesByIds) at display time.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US } }, alias, rollup }], paging }
     */
    getDegrees: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            start?: number | undefined;
            count?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    /**
     * BATCH_GET /v2/degrees?ids=id1&ids=id2&…
     */
    getDegreesByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            ids: string[];
        };
        output: any;
        meta: object;
    }>;
    /**
     * GET_ALL /v2/fieldsOfStudy  (paginated)
     *
     * Large list. Use BATCH_GET (getFieldsOfStudyByIds) at display time.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US } }, rollupIds }], paging }
     */
    getFieldsOfStudy: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            start?: number | undefined;
            count?: number | undefined;
        };
        output: any;
        meta: object;
    }>;
    /**
     * BATCH_GET /v2/fieldsOfStudy?ids=id1&ids=id2&…
     */
    getFieldsOfStudyByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accessToken: string;
            ids: string[];
        };
        output: any;
        meta: object;
    }>;
}>>;
