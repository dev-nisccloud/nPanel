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
export interface DomainOverviewMetrics {
    domain: string;
    organicTraffic: number | null;
    organicKeywords: number | null;
    backlinks: number | null;
    referringDomains: number | null;
    paidTraffic: number | null;
    paidKeywords: number | null;
    pos1Keywords: number | null;
    pos2_3Keywords: number | null;
    pos4_10Keywords: number | null;
    pos11_20Keywords: number | null;
    pos21_50Keywords: number | null;
    pos51_100Keywords: number | null;
    hasData: boolean;
    fetchedAt: string;
}
export interface RankedKeywordResult {
    keyword: string;
    position: number | null;
    searchVolume: number | null;
    traffic: number | null;
    cpc: number | null;
    url: string | null;
    relativeUrl: string | null;
    keywordDifficulty: number | null;
}
export interface PageResult {
    page: string;
    relativePath: string | null;
    organicTraffic: number | null;
    keywords: number | null;
}
export interface DomainOverviewTransformed {
    metrics: DomainOverviewMetrics;
    rankedKeywords: RankedKeywordResult[];
    pages: PageResult[];
}
export interface KeywordMetric {
    keyword: string;
    searchVolume: number | null;
    cpc: number | null;
    competition: number | null;
    competitionLevel: string | null;
    lowTopOfPageBid: number | null;
    highTopOfPageBid: number | null;
    keywordDifficulty: number | null;
    monthlySearches: Array<{
        month: string;
        searchVolume: number;
    }> | null;
}
export interface RelatedKeywordResult {
    keyword: string;
    searchVolume: number | null;
    cpc: number | null;
    competition: number | null;
    keywordDifficulty: number | null;
    relatedKeywords: string[];
}
export interface BacklinksSummary {
    target: string;
    backlinks: number | null;
    backlinksSpam: number | null;
    brokenBacklinks: number | null;
    brokenPages: number | null;
    referringDomains: number | null;
    referringDomainsNofollow: number | null;
    referringMainDomains: number | null;
    referringIps: number | null;
    fetchedAt: string;
}
export interface BacklinkItem {
    url: string;
    urlFrom: string;
    urlTo: string;
    anchor: string | null;
    dofollow: boolean;
    alternateLinks: string | null;
    firstSeen: string | null;
    lastSeen: string | null;
    itemType: string | null;
}
export interface ReferringDomainItem {
    domain: string;
    backlinks: number | null;
    dofollow: number | null;
    nofollow: number | null;
    firstSeen: string | null;
    lastSeen: string | null;
}
export interface BacklinksHistoryPoint {
    date: string;
    backlinks: number | null;
    referringDomains: number | null;
}
export interface RankCheckResult {
    keyword: string;
    position: number | null;
    previousPosition: number | null;
    url: string | null;
    searchVolume: number | null;
    cpc: number | null;
    keywordDifficulty: number | null;
    checkedAt: string;
}
export interface AuditPageItem {
    url: string;
    statusCode: number | null;
    loadTime: number | null;
    size: number | null;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    canonical: string | null;
    linksInternal: number | null;
    linksExternal: number | null;
    imagesCount: number | null;
    scriptsCount: number | null;
    checks: Record<string, boolean | null>;
}
export interface AuditIssueSummary {
    issueType: string;
    severity: "critical" | "error" | "warning" | "notice";
    count: number;
    affectedPages: string[];
}
/**
 * Normalize domain input by removing protocol and trailing paths
 */
export declare function normalizeDomainInput(input: string, includeSubdomains: boolean): string;
/**
 * Transform raw DataForSEO domain rank overview response to clean metrics
 */
export declare function mapDomainOverviewMetrics(rawItem: any): DomainOverviewMetrics;
/**
 * Transform raw DataForSEO ranked keyword item to clean result
 */
export declare function mapRankedKeyword(rawItem: any): RankedKeywordResult | null;
/**
 * Transform array of ranked keywords
 */
export declare function mapRankedKeywords(rawItems: any[]): RankedKeywordResult[];
/**
 * Transform raw DataForSEO page item to clean result
 */
export declare function mapPageItem(rawItem: any): PageResult | null;
/**
 * Transform array of page items
 */
export declare function mapPages(rawItems: any[]): PageResult[];
/**
 * Transform complete domain overview response
 */
export declare function transformDomainOverview(rawResponse: any): DomainOverviewTransformed;
/**
 * Transform raw DataForSEO keyword data item to clean metric
 */
export declare function mapKeywordMetric(rawItem: any): KeywordMetric;
/**
 * Transform array of keyword metrics
 */
export declare function mapKeywordMetrics(rawItems: any[]): KeywordMetric[];
/**
 * Transform related keywords response
 */
export declare function mapRelatedKeyword(rawItem: any): RelatedKeywordResult;
/**
 * Transform raw DataForSEO backlinks summary to clean summary
 */
export declare function mapBacklinksSummary(rawItem: any): BacklinksSummary;
/**
 * Transform raw backlink item to clean result
 */
export declare function mapBacklinkItem(rawItem: any): BacklinkItem;
/**
 * Transform array of backlink items
 */
export declare function mapBacklinkItems(rawItems: any[]): BacklinkItem[];
/**
 * Transform raw referring domain item to clean result
 */
export declare function mapReferringDomain(rawItem: any): ReferringDomainItem;
/**
 * Transform array of referring domains
 */
export declare function mapReferringDomains(rawItems: any[]): ReferringDomainItem[];
/**
 * Transform backlinks history response
 */
export declare function mapBacklinksHistory(rawItems: any[]): BacklinksHistoryPoint[];
/**
 * Transform raw rank check result to clean result
 */
export declare function mapRankCheckResult(rawItem: any): RankCheckResult;
/**
 * Transform array of rank check results
 */
export declare function mapRankCheckResults(rawItems: any[]): RankCheckResult[];
/**
 * Transform raw audit page item to clean result
 */
export declare function mapAuditPage(rawItem: any): AuditPageItem;
/**
 * Transform array of audit page items
 */
export declare function mapAuditPages(rawItems: any[]): AuditPageItem[];
