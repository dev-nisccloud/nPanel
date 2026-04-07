import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import { request } from 'undici';
const LI_BASE = 'https://api.linkedin.com';
// Use the same API version the rest of the codebase targets.
const LI_VERSION = process.env.LINKEDIN_MARKETING_API_VERSION || process.env.LINKEDIN_API_VERSION || '202603';
/**
 * Thin wrapper around undici.request for LinkedIn v2 standardized-data endpoints.
 * These live at /v2/{entity} (not /rest/) and use locale-based params.
 */
async function callLinkedInV2(accessToken, path, params = {}) {
    const url = new URL(`${LI_BASE}${path}`);
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
    }
    const { statusCode, body } = await request(url.toString(), {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'LinkedIn-Version': LI_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
        },
    });
    const text = await body.text();
    if (statusCode >= 400) {
        let detail = text;
        try {
            detail = JSON.stringify(JSON.parse(text), null, 2);
        }
        catch { /* keep raw */ }
        throw new Error(`LinkedIn API ${statusCode} on ${path}: ${detail}`);
    }
    return JSON.parse(text);
}
/**
 * Shared input schema – every procedure accepts a bearer token + pagination.
 */
const paginationInput = z.object({
    /** LinkedIn OAuth 2 access token with r_ads (or r_basicprofile) scope. */
    accessToken: z.string().min(10, 'accessToken is required'),
    /** Zero-based offset for pagination. Default 0. */
    start: z.number().int().min(0).default(0),
    /**
     * Page size. LinkedIn caps titles/skills at 50; all other entities accept up to 100.
     * The procedure will clamp automatically.
     */
    count: z.number().int().min(1).max(200).default(100),
});
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
export const linkedInAdsStandardizedDataRouter = router({
    /**
     * GET_ALL /v2/seniorities
     *
     * Small finite list (~10 entries). Run once and build a static map.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US: string } } }], paging }
     */
    getSeniorities: publicProcedure
        .input(paginationInput)
        .query(async ({ input }) => {
        return callLinkedInV2(input.accessToken, '/v2/seniorities', {
            'locale.language': 'en',
            'locale.country': 'US',
            start: input.start,
            count: input.count,
        });
    }),
    /**
     * GET_ALL /v2/industries
     *
     * ~150 stable entries ("static V1" per LinkedIn docs). Run once → static map.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US: string } } }], paging }
     */
    getIndustries: publicProcedure
        .input(paginationInput)
        .query(async ({ input }) => {
        return callLinkedInV2(input.accessToken, '/v2/industries', {
            'locale.language': 'en',
            'locale.country': 'US',
            start: input.start,
            count: input.count,
        });
    }),
    /**
     * GET_ALL /v2/functions
     *
     * Small list (~26 job functions, e.g. "Finance", "Engineering"). Run once → static map.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US: string } } }], paging }
     */
    getFunctions: publicProcedure
        .input(paginationInput)
        .query(async ({ input }) => {
        return callLinkedInV2(input.accessToken, '/v2/functions', {
            locale: 'en_US',
            start: input.start,
            count: input.count,
        });
    }),
    /**
     * GET_ALL /v2/titles  (max 50 per page – paginate with start=0,50,100,…)
     *
     * Thousands of entries. Too many to maintain manually; use BATCH_GET at display time instead.
     * This GET_ALL is provided for discovery / building a complete offline snapshot.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US: string } }, function, superTitle }], paging }
     */
    getTitles: publicProcedure
        .input(paginationInput)
        .query(async ({ input }) => {
        return callLinkedInV2(input.accessToken, '/v2/titles', {
            locale: 'en_US',
            start: input.start,
            // LinkedIn enforces max 50 per page for titles.
            count: Math.min(input.count, 50),
        });
    }),
    /**
     * BATCH_GET /v2/titles?ids=id1&ids=id2&…
     *
     * Resolve specific title IDs to names at display time.
     * Pass the numeric IDs extracted from the campaign's targetingCriteria URNs.
     * Response shape: { results: { "9": { id, name: { localized: { en_US } }, … } }, statuses, errors }
     */
    getTitlesByIds: publicProcedure
        .input(z.object({
        accessToken: z.string().min(10),
        /** Numeric title IDs, e.g. ["1", "10012", "1003"] */
        ids: z.array(z.string()).min(1).max(100),
    }))
        .query(async ({ input }) => {
        const url = new URL(`${LI_BASE}/v2/titles`);
        for (const id of input.ids)
            url.searchParams.append('ids', id);
        url.searchParams.set('locale', 'en_US');
        const { statusCode, body } = await request(url.toString(), {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${input.accessToken}`,
                'LinkedIn-Version': LI_VERSION,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        });
        const text = await body.text();
        if (statusCode >= 400)
            throw new Error(`LinkedIn API ${statusCode}: ${text}`);
        return JSON.parse(text);
    }),
    /**
     * GET_ALL /v2/skills  (max 50 per page – paginate with start=0,50,100,…)
     *
     * Thousands of entries. Use BATCH_GET (getSkillsByIds) at display time.
     * Response shape: { elements: [{ id, $URN, standardizedName, locale }], paging }
     */
    getSkills: publicProcedure
        .input(paginationInput)
        .query(async ({ input }) => {
        return callLinkedInV2(input.accessToken, '/v2/skills', {
            'locale.language': 'en',
            'locale.country': 'US',
            start: input.start,
            count: Math.min(input.count, 50),
        });
    }),
    /**
     * BATCH_GET /v2/skills?ids=id1&ids=id2&…
     *
     * Resolve specific skill IDs at display time.
     * Response shape: { results: { "5": { id, standardizedName, locale } }, statuses, errors }
     */
    getSkillsByIds: publicProcedure
        .input(z.object({
        accessToken: z.string().min(10),
        ids: z.array(z.string()).min(1).max(100),
    }))
        .query(async ({ input }) => {
        const url = new URL(`${LI_BASE}/v2/skills`);
        for (const id of input.ids)
            url.searchParams.append('ids', id);
        url.searchParams.set('locale.language', 'en');
        url.searchParams.set('locale.country', 'US');
        const { statusCode, body } = await request(url.toString(), {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${input.accessToken}`,
                'LinkedIn-Version': LI_VERSION,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        });
        const text = await body.text();
        if (statusCode >= 400)
            throw new Error(`LinkedIn API ${statusCode}: ${text}`);
        return JSON.parse(text);
    }),
    /**
     * GET_ALL /v2/degrees  (paginated)
     *
     * Manageable set. Run once → static map, or use BATCH_GET (getDegreesByIds) at display time.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US } }, alias, rollup }], paging }
     */
    getDegrees: publicProcedure
        .input(paginationInput)
        .query(async ({ input }) => {
        return callLinkedInV2(input.accessToken, '/v2/degrees', {
            'locale.language': 'en',
            'locale.country': 'US',
            start: input.start,
            count: input.count,
        });
    }),
    /**
     * BATCH_GET /v2/degrees?ids=id1&ids=id2&…
     */
    getDegreesByIds: publicProcedure
        .input(z.object({
        accessToken: z.string().min(10),
        ids: z.array(z.string()).min(1).max(100),
    }))
        .query(async ({ input }) => {
        const url = new URL(`${LI_BASE}/v2/degrees`);
        for (const id of input.ids)
            url.searchParams.append('ids', id);
        url.searchParams.set('locale.language', 'en');
        url.searchParams.set('locale.country', 'US');
        const { statusCode, body } = await request(url.toString(), {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${input.accessToken}`,
                'LinkedIn-Version': LI_VERSION,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        });
        const text = await body.text();
        if (statusCode >= 400)
            throw new Error(`LinkedIn API ${statusCode}: ${text}`);
        return JSON.parse(text);
    }),
    /**
     * GET_ALL /v2/fieldsOfStudy  (paginated)
     *
     * Large list. Use BATCH_GET (getFieldsOfStudyByIds) at display time.
     * Response shape: { elements: [{ id, $URN, name: { localized: { en_US } }, rollupIds }], paging }
     */
    getFieldsOfStudy: publicProcedure
        .input(paginationInput)
        .query(async ({ input }) => {
        return callLinkedInV2(input.accessToken, '/v2/fieldsOfStudy', {
            'locale.language': 'en',
            'locale.country': 'US',
            start: input.start,
            count: input.count,
        });
    }),
    /**
     * BATCH_GET /v2/fieldsOfStudy?ids=id1&ids=id2&…
     */
    getFieldsOfStudyByIds: publicProcedure
        .input(z.object({
        accessToken: z.string().min(10),
        ids: z.array(z.string()).min(1).max(100),
    }))
        .query(async ({ input }) => {
        const url = new URL(`${LI_BASE}/v2/fieldsOfStudy`);
        for (const id of input.ids)
            url.searchParams.append('ids', id);
        url.searchParams.set('locale.language', 'en');
        url.searchParams.set('locale.country', 'US');
        const { statusCode, body } = await request(url.toString(), {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${input.accessToken}`,
                'LinkedIn-Version': LI_VERSION,
                'X-Restli-Protocol-Version': '2.0.0',
            },
        });
        const text = await body.text();
        if (statusCode >= 400)
            throw new Error(`LinkedIn API ${statusCode}: ${text}`);
        return JSON.parse(text);
    }),
});
