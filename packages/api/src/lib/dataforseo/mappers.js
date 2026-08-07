/**
 * Data transformation layer for DataForSEO API responses.
 *
 * This module provides mapper functions that transform raw, nested DataForSEO
 * responses into clean, flat, typed objects optimized for UI consumption.
 *
 * Key principles:
 * - Extract nested data from deeply nested API responses
 * - Round numbers for cleaner UI display
 * - Handle nulls explicitly (no undefined values)
 * - Normalize URLs (separate absolute vs relative)
 * - Return flat objects (no nested structures in UI)
 */
/* ------------------------------------------------------------------ */
/*  Helper Functions                                                   */
/* ------------------------------------------------------------------ */
/**
 * Safely round a number to the nearest integer, handling nulls
 */
function safeRound(value) {
    return value != null && Number.isFinite(value) ? Math.round(value) : null;
}
/**
 * Extract relative path from a full URL
 */
function toRelativePath(url) {
    if (!url)
        return null;
    try {
        const parsed = new URL(url);
        return parsed.pathname + parsed.search + parsed.hash;
    }
    catch {
        return url.startsWith("/") ? url : null;
    }
}
/**
 * Normalize domain input by removing protocol and trailing paths
 */
export function normalizeDomainInput(input, includeSubdomains) {
    let domain = input.trim().toLowerCase();
    // Remove protocol
    domain = domain.replace(/^https?:\/\//i, "");
    // Remove path, query, hash
    domain = domain.split("/")[0] || domain;
    domain = domain.split("?")[0] || domain;
    domain = domain.split("#")[0] || domain;
    // Add subdomain wildcard if requested
    if (includeSubdomains && !domain.startsWith("*.")) {
        domain = `*.${domain}`;
    }
    return domain;
}
/* ------------------------------------------------------------------ */
/*  Domain Overview Mappers                                            */
/* ------------------------------------------------------------------ */
/**
 * Transform raw DataForSEO domain rank overview response to clean metrics
 */
export function mapDomainOverviewMetrics(rawItem) {
    const metrics = rawItem?.metrics;
    const organic = metrics?.organic;
    const paid = metrics?.paid;
    return {
        domain: rawItem?.target || "",
        organicTraffic: safeRound(organic?.etv),
        organicKeywords: safeRound(organic?.count),
        backlinks: null, // Fetched separately via backlinks API
        referringDomains: null, // Fetched separately via backlinks API
        paidTraffic: safeRound(paid?.etv),
        paidKeywords: safeRound(paid?.count),
        pos1Keywords: safeRound(organic?.pos_1),
        pos2_3Keywords: safeRound(organic?.pos_2_3),
        pos4_10Keywords: safeRound(organic?.pos_4_10),
        pos11_20Keywords: safeRound(organic?.pos_11_20),
        pos21_50Keywords: safeRound(organic?.pos_21_50),
        pos51_100Keywords: safeRound(organic?.pos_51_100),
        hasData: (organic?.count ?? 0) > 0,
        fetchedAt: new Date().toISOString(),
    };
}
/**
 * Transform raw DataForSEO ranked keyword item to clean result
 */
export function mapRankedKeyword(rawItem) {
    const keywordData = rawItem?.keyword_data;
    const keywordInfo = keywordData?.keyword_info;
    const keywordProperties = keywordData?.keyword_properties;
    const rankedSerpElement = rawItem?.ranked_serp_element;
    const serpItem = rankedSerpElement?.serp_item;
    const keyword = keywordData?.keyword ?? rawItem?.keyword;
    if (!keyword)
        return null;
    const url = serpItem?.url ?? rankedSerpElement?.url ?? null;
    const relativeUrl = serpItem?.relative_url ??
        rankedSerpElement?.relative_url ??
        toRelativePath(url);
    const position = serpItem?.rank_absolute ?? rankedSerpElement?.rank_absolute;
    const traffic = serpItem?.etv ?? rankedSerpElement?.etv;
    const keywordDifficulty = keywordProperties?.keyword_difficulty ??
        keywordInfo?.keyword_difficulty;
    return {
        keyword,
        position: safeRound(position),
        searchVolume: safeRound(keywordInfo?.search_volume),
        traffic: safeRound(traffic),
        cpc: keywordInfo?.cpc ?? null,
        url,
        relativeUrl,
        keywordDifficulty: safeRound(keywordDifficulty),
    };
}
/**
 * Transform array of ranked keywords
 */
export function mapRankedKeywords(rawItems) {
    return rawItems
        .map(mapRankedKeyword)
        .filter((item) => item !== null);
}
/**
 * Transform raw DataForSEO page item to clean result
 */
export function mapPageItem(rawItem) {
    const page = rawItem?.page;
    if (!page)
        return null;
    return {
        page,
        relativePath: toRelativePath(page),
        organicTraffic: safeRound(rawItem?.metrics?.organic?.etv),
        keywords: safeRound(rawItem?.metrics?.organic?.count),
    };
}
/**
 * Transform array of page items
 */
export function mapPages(rawItems) {
    return rawItems
        .map(mapPageItem)
        .filter((item) => item !== null);
}
/**
 * Transform complete domain overview response
 */
export function transformDomainOverview(rawResponse) {
    const tasks = rawResponse?.tasks?.[0];
    const result = tasks?.result?.[0];
    if (!result) {
        return {
            metrics: {
                domain: "",
                organicTraffic: null,
                organicKeywords: null,
                backlinks: null,
                referringDomains: null,
                paidTraffic: null,
                paidKeywords: null,
                pos1Keywords: null,
                pos2_3Keywords: null,
                pos4_10Keywords: null,
                pos11_20Keywords: null,
                pos21_50Keywords: null,
                pos51_100Keywords: null,
                hasData: false,
                fetchedAt: new Date().toISOString(),
            },
            rankedKeywords: [],
            pages: [],
        };
    }
    return {
        metrics: mapDomainOverviewMetrics(result),
        rankedKeywords: [],
        pages: [],
    };
}
/* ------------------------------------------------------------------ */
/*  Keyword Research Mappers                                           */
/* ------------------------------------------------------------------ */
/**
 * Transform raw DataForSEO keyword data item to clean metric
 */
export function mapKeywordMetric(rawItem) {
    const keywordInfo = rawItem?.keyword_info;
    const keywordProperties = rawItem?.keyword_properties;
    return {
        keyword: rawItem?.keyword || "",
        searchVolume: safeRound(keywordInfo?.search_volume),
        cpc: keywordInfo?.cpc ?? null,
        competition: keywordInfo?.competition ?? null,
        competitionLevel: keywordInfo?.competition_level ?? null,
        lowTopOfPageBid: keywordInfo?.low_top_of_page_bid ?? null,
        highTopOfPageBid: keywordInfo?.high_top_of_page_bid ?? null,
        keywordDifficulty: safeRound(keywordProperties?.keyword_difficulty),
        monthlySearches: rawItem?.monthly_searches?.map((ms) => ({
            month: ms.month || "",
            searchVolume: safeRound(ms.search_volume),
        })) ?? null,
    };
}
/**
 * Transform array of keyword metrics
 */
export function mapKeywordMetrics(rawItems) {
    return rawItems.map(mapKeywordMetric);
}
/**
 * Transform related keywords response
 */
export function mapRelatedKeyword(rawItem) {
    const keywordInfo = rawItem?.keyword_data?.keyword_info;
    const keywordProperties = rawItem?.keyword_data?.keyword_properties;
    return {
        keyword: rawItem?.keyword || "",
        searchVolume: safeRound(keywordInfo?.search_volume),
        cpc: keywordInfo?.cpc ?? null,
        competition: keywordInfo?.competition ?? null,
        keywordDifficulty: safeRound(keywordProperties?.keyword_difficulty),
        relatedKeywords: rawItem?.related_keywords || [],
    };
}
/* ------------------------------------------------------------------ */
/*  Backlinks Mappers                                                  */
/* ------------------------------------------------------------------ */
/**
 * Transform raw DataForSEO backlinks summary to clean summary
 */
export function mapBacklinksSummary(rawItem) {
    const backlinksInfo = rawItem?.backlinks_info;
    return {
        target: rawItem?.target || "",
        backlinks: safeRound(backlinksInfo?.backlinks),
        backlinksSpam: safeRound(backlinksInfo?.backlinks_spam_score),
        brokenBacklinks: safeRound(backlinksInfo?.broken_backlinks),
        brokenPages: safeRound(backlinksInfo?.broken_pages),
        referringDomains: safeRound(backlinksInfo?.referring_domains),
        referringDomainsNofollow: safeRound(backlinksInfo?.referring_domains_nofollow),
        referringMainDomains: safeRound(backlinksInfo?.referring_main_domains),
        referringIps: safeRound(backlinksInfo?.referring_ips),
        fetchedAt: new Date().toISOString(),
    };
}
/**
 * Transform raw backlink item to clean result
 */
export function mapBacklinkItem(rawItem) {
    return {
        url: rawItem?.url || "",
        urlFrom: rawItem?.url_from || "",
        urlTo: rawItem?.url_to || "",
        anchor: rawItem?.anchor || null,
        dofollow: rawItem?.dofollow === true || rawItem?.dofollow === 1,
        alternateLinks: rawItem?.alternate_links || null,
        firstSeen: rawItem?.first_seen || null,
        lastSeen: rawItem?.last_seen || null,
        itemType: rawItem?.item_type || null,
    };
}
/**
 * Transform array of backlink items
 */
export function mapBacklinkItems(rawItems) {
    return rawItems.map(mapBacklinkItem);
}
/**
 * Transform raw referring domain item to clean result
 */
export function mapReferringDomain(rawItem) {
    return {
        domain: rawItem?.domain || "",
        backlinks: safeRound(rawItem?.backlinks),
        dofollow: safeRound(rawItem?.dofollow),
        nofollow: safeRound(rawItem?.nofollow),
        firstSeen: rawItem?.first_seen || null,
        lastSeen: rawItem?.last_seen || null,
    };
}
/**
 * Transform array of referring domains
 */
export function mapReferringDomains(rawItems) {
    return rawItems.map(mapReferringDomain);
}
/**
 * Transform backlinks history response
 */
export function mapBacklinksHistory(rawItems) {
    return rawItems.map((item) => ({
        date: item?.date || "",
        backlinks: safeRound(item?.backlinks),
        referringDomains: safeRound(item?.referring_domains),
    }));
}
/* ------------------------------------------------------------------ */
/*  Rank Tracking Mappers                                              */
/* ------------------------------------------------------------------ */
/**
 * Transform raw rank check result to clean result
 */
export function mapRankCheckResult(rawItem) {
    return {
        keyword: rawItem?.keyword || "",
        position: safeRound(rawItem?.se_results_count),
        previousPosition: null, // Calculated from historical data
        url: rawItem?.url || null,
        searchVolume: safeRound(rawItem?.keyword_data?.keyword_info?.search_volume),
        cpc: rawItem?.keyword_data?.keyword_info?.cpc ?? null,
        keywordDifficulty: safeRound(rawItem?.keyword_data?.keyword_properties?.keyword_difficulty),
        checkedAt: new Date().toISOString(),
    };
}
/**
 * Transform array of rank check results
 */
export function mapRankCheckResults(rawItems) {
    return rawItems.map(mapRankCheckResult);
}
/* ------------------------------------------------------------------ */
/*  Site Audit Mappers                                                 */
/* ------------------------------------------------------------------ */
/**
 * Transform raw audit page item to clean result
 */
export function mapAuditPage(rawItem) {
    const onPageInfo = rawItem?.onpage_score;
    const meta = rawItem?.meta;
    const checks = rawItem?.checks;
    return {
        url: rawItem?.url || "",
        statusCode: rawItem?.status_code ?? null,
        loadTime: safeRound(rawItem?.page_timing?.time_to_interactive),
        size: safeRound(rawItem?.size),
        title: meta?.title || null,
        metaDescription: meta?.description || null,
        h1: meta?.h1 || null,
        canonical: meta?.canonical || null,
        linksInternal: safeRound(rawItem?.links_count?.internal),
        linksExternal: safeRound(rawItem?.links_count?.external),
        imagesCount: safeRound(rawItem?.images_count),
        scriptsCount: safeRound(rawItem?.scripts_count),
        checks: checks || {},
    };
}
/**
 * Transform array of audit page items
 */
export function mapAuditPages(rawItems) {
    return rawItems.map(mapAuditPage);
}
