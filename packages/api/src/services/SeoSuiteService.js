/**
 * Service layer for SEO Suite functionality.
 *
 * This service encapsulates all business logic for SEO features,
 * including DataForSEO API calls, data transformation, and caching.
 *
 * Based on OpenSEO's architecture patterns.
 */
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@npanel/db";
import { seoSuiteProject, seoSuiteDomainSnapshot, seoSuiteSavedKeyword, seoSuiteRankTracker, seoSuiteRankResult, seoSuiteBacklinkSnapshot, seoSuiteAuditRun, seoSuiteAuditPage, } from "@npanel/db/schema";
import { TRPCError } from "@trpc/server";
import { dataForSeoRequest, isDataForSeoConfigured } from "../lib/dataforseo-client";
import { mapDomainOverviewMetrics, mapRankedKeywords, mapPages, mapKeywordMetrics, mapBacklinksSummary, mapBacklinkItems, mapReferringDomains, mapBacklinksHistory, normalizeDomainInput, } from "../lib/dataforseo/mappers";
/* ------------------------------------------------------------------ */
/*  Cache Configuration                                                */
/* ------------------------------------------------------------------ */
const CACHE_TTL = {
    domainOverview: 12 * 60 * 60, // 12 hours
    keywords: 24 * 60 * 60, // 24 hours
    backlinks: 24 * 60 * 60, // 24 hours
    rankSnapshot: 60 * 60, // 1 hour
};
/* ------------------------------------------------------------------ */
/*  Domain Overview Service                                            */
/* ------------------------------------------------------------------ */
export async function getDomainOverview(input) {
    const locationCode = input.locationCode ?? 2840; // Default to US
    const languageCode = input.languageCode ?? "en";
    // Check for cached data first
    const cached = await db.query.seoSuiteDomainSnapshot.findFirst({
        where: and(eq(seoSuiteDomainSnapshot.projectId, input.projectId), eq(seoSuiteDomainSnapshot.target, input.domain)),
        orderBy: [desc(seoSuiteDomainSnapshot.capturedAt)],
    });
    // Return cached if less than 12 hours old
    if (cached && cached.capturedAt) {
        const age = Date.now() - new Date(cached.capturedAt).getTime();
        if (age < CACHE_TTL.domainOverview * 1000) {
            return {
                metrics: cached.metrics,
                rankedKeywords: cached.rankedKeywords ?? [],
                pages: cached.pages ?? [],
            };
        }
    }
    // Fetch fresh data from DataForSEO
    if (!isDataForSeoConfigured()) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "DataForSEO API credentials not configured",
        });
    }
    const target = normalizeDomainInput(input.domain, input.includeSubdomains);
    // Fetch domain rank overview
    const overviewResponse = await dataForSeoRequest({
        endpoint: "dataforseo_labs/v1/ranked_keywords/live",
        method: "POST",
        body: [
            {
                target,
                location_code: locationCode,
                language_code: languageCode,
                limit: 1,
            },
        ],
    });
    const result = overviewResponse?.tasks?.[0]?.result?.[0];
    const metrics = mapDomainOverviewMetrics(result);
    // Fetch top ranked keywords
    const keywordsResponse = await dataForSeoRequest({
        endpoint: "dataforseo_labs/v1/ranked_keywords/live",
        method: "POST",
        body: [
            {
                target,
                location_code: locationCode,
                language_code: languageCode,
                limit: 100,
                order_by: ["ranked_serp_element.serp_item.etv,desc"],
            },
        ],
    });
    const rankedKeywords = mapRankedKeywords(keywordsResponse?.tasks?.[0]?.result?.[0]?.items ?? []);
    // Fetch top pages
    const pagesResponse = await dataForSeoRequest({
        endpoint: "dataforseo_labs/v1/relevant_pages/live",
        method: "POST",
        body: [
            {
                target,
                location_code: locationCode,
                language_code: languageCode,
                limit: 50,
                order_by: ["metrics.organic.etv,desc"],
            },
        ],
    });
    const pages = mapPages(pagesResponse?.tasks?.[0]?.result?.[0]?.items ?? []);
    // Cache the result
    await db.insert(seoSuiteDomainSnapshot).values({
        id: crypto.randomUUID(),
        projectId: input.projectId,
        target: input.domain,
        metrics: metrics,
        rankedKeywords: rankedKeywords,
        pages: pages,
        capturedAt: new Date(),
    });
    return {
        metrics,
        rankedKeywords,
        pages,
    };
}
/* ------------------------------------------------------------------ */
/*  Keyword Research Service                                           */
/* ------------------------------------------------------------------ */
export async function searchKeywords(input) {
    if (!isDataForSeoConfigured()) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "DataForSEO API credentials not configured",
        });
    }
    const locationCode = input.locationCode ?? 2840;
    const languageCode = input.languageCode ?? "en";
    const limit = input.limit ?? 100;
    const response = await dataForSeoRequest({
        endpoint: "keywords_data/google_ads/keywords_for_keywords/live",
        method: "POST",
        body: [
            {
                keywords: [input.keyword],
                location_code: locationCode,
                language_code: languageCode,
                limit,
                sort_by: "search_volume",
            },
        ],
    });
    const items = response?.tasks?.[0]?.result?.[0]?.items ?? [];
    return mapKeywordMetrics(items);
}
export async function getRelatedKeywords(input) {
    if (!isDataForSeoConfigured()) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "DataForSEO API credentials not configured",
        });
    }
    const locationCode = input.locationCode ?? 2840;
    const languageCode = input.languageCode ?? "en";
    const limit = input.limit ?? 100;
    const response = await dataForSeoRequest({
        endpoint: "keywords_data/google_ads/keywords_for_keywords/live",
        method: "POST",
        body: [
            {
                keywords: [input.keyword],
                location_code: locationCode,
                language_code: languageCode,
                limit,
                sort_by: "search_volume",
            },
        ],
    });
    const items = response?.tasks?.[0]?.result?.[0]?.items ?? [];
    return mapKeywordMetrics(items);
}
/* ------------------------------------------------------------------ */
/*  Backlinks Service                                                  */
/* ------------------------------------------------------------------ */
export async function getBacklinksSummary(input) {
    // Check cache first
    const cached = await db.query.seoSuiteBacklinkSnapshot.findFirst({
        where: and(eq(seoSuiteBacklinkSnapshot.projectId, input.projectId), eq(seoSuiteBacklinkSnapshot.target, input.target)),
        orderBy: [desc(seoSuiteBacklinkSnapshot.capturedAt)],
    });
    if (cached && cached.capturedAt) {
        const age = Date.now() - new Date(cached.capturedAt).getTime();
        if (age < CACHE_TTL.backlinks * 1000) {
            return cached.summary;
        }
    }
    if (!isDataForSeoConfigured()) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "DataForSEO API credentials not configured",
        });
    }
    const response = await dataForSeoRequest({
        endpoint: "backlinks/v1/summary/live",
        method: "POST",
        body: [{ target: input.target }],
    });
    const result = response?.tasks?.[0]?.result?.[0];
    const summary = mapBacklinksSummary(result);
    // Cache the result
    await db.insert(seoSuiteBacklinkSnapshot).values({
        id: crypto.randomUUID(),
        projectId: input.projectId,
        target: input.target,
        summary: summary,
        capturedAt: new Date(),
    });
    return summary;
}
export async function getBacklinks(input) {
    if (!isDataForSeoConfigured()) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "DataForSEO API credentials not configured",
        });
    }
    const response = await dataForSeoRequest({
        endpoint: "backlinks/v1/backlinks/live",
        method: "POST",
        body: [
            {
                target: input.target,
                limit: input.limit ?? 100,
                offset: input.offset ?? 0,
                order_by: ["rank,desc"],
            },
        ],
    });
    const items = response?.tasks?.[0]?.result?.[0]?.items ?? [];
    return mapBacklinkItems(items);
}
export async function getReferringDomains(input) {
    if (!isDataForSeoConfigured()) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "DataForSEO API credentials not configured",
        });
    }
    const response = await dataForSeoRequest({
        endpoint: "backlinks/v1/referring_domains/live",
        method: "POST",
        body: [
            {
                target: input.target,
                limit: input.limit ?? 100,
                offset: input.offset ?? 0,
                order_by: ["backlinks,desc"],
            },
        ],
    });
    const items = response?.tasks?.[0]?.result?.[0]?.items ?? [];
    return mapReferringDomains(items);
}
export async function getBacklinksHistory(input) {
    if (!isDataForSeoConfigured()) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "DataForSEO API credentials not configured",
        });
    }
    const response = await dataForSeoRequest({
        endpoint: "backlinks/v1/history/live",
        method: "POST",
        body: [{ target: input.target }],
    });
    const items = response?.tasks?.[0]?.result?.[0]?.items ?? [];
    return mapBacklinksHistory(items);
}
/* ------------------------------------------------------------------ */
/*  Saved Keywords Service                                             */
/* ------------------------------------------------------------------ */
export async function getSavedKeywords(projectId) {
    return await db.query.seoSuiteSavedKeyword.findMany({
        where: eq(seoSuiteSavedKeyword.projectId, projectId),
        orderBy: [desc(seoSuiteSavedKeyword.createdAt)],
    });
}
export async function saveKeyword(input) {
    const existing = await db.query.seoSuiteSavedKeyword.findFirst({
        where: and(eq(seoSuiteSavedKeyword.projectId, input.projectId), eq(seoSuiteSavedKeyword.keyword, input.keyword)),
    });
    if (existing) {
        throw new TRPCError({
            code: "CONFLICT",
            message: "Keyword already saved",
        });
    }
    // Store metrics in metricsCache as JSON
    const metricsCache = {
        searchVolume: input.searchVolume ?? null,
        cpc: input.cpc ?? null,
        competition: input.competition ?? null,
        keywordDifficulty: input.keywordDifficulty ?? null,
    };
    const [keyword] = await db
        .insert(seoSuiteSavedKeyword)
        .values({
        id: crypto.randomUUID(),
        projectId: input.projectId,
        listId: input.listId ?? null,
        keyword: input.keyword,
        locationCode: input.locationCode ?? null,
        languageCode: input.languageCode ?? null,
        tags: input.tags ?? [],
        notes: input.notes ?? null,
        source: "manual",
        status: "idea",
        metricsCache: metricsCache,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
        .returning();
    return keyword;
}
export async function deleteKeyword(id) {
    await db.delete(seoSuiteSavedKeyword).where(eq(seoSuiteSavedKeyword.id, id));
}
/* ------------------------------------------------------------------ */
/*  Rank Tracking Service                                              */
/* ------------------------------------------------------------------ */
export async function getRankTrackers(projectId) {
    return await db.query.seoSuiteRankTracker.findMany({
        where: eq(seoSuiteRankTracker.projectId, projectId),
        orderBy: [desc(seoSuiteRankTracker.createdAt)],
    });
}
export async function createRankTracker(input) {
    const [tracker] = await db
        .insert(seoSuiteRankTracker)
        .values({
        id: crypto.randomUUID(),
        projectId: input.projectId,
        keyword: input.keyword,
        targetUrl: input.targetUrl,
        locationCode: input.locationCode ?? 2840,
        languageCode: input.languageCode ?? "en",
        createdAt: new Date(),
    })
        .returning();
    return tracker;
}
export async function getRankHistory(trackerId, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await db.query.seoSuiteRankResult.findMany({
        where: and(eq(seoSuiteRankResult.trackerId, trackerId), sql `${seoSuiteRankResult.capturedAt} >= ${since}`),
        orderBy: [desc(seoSuiteRankResult.capturedAt)],
    });
}
export const SeoSuiteService = {
    getDomainOverview,
    searchKeywords,
    getRelatedKeywords,
    getBacklinksSummary,
    getBacklinks,
    getReferringDomains,
    getBacklinksHistory,
    getSavedKeywords,
    saveKeyword,
    deleteKeyword,
    getRankTrackers,
    createRankTracker,
    getRankHistory,
};
