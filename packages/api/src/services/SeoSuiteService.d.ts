/**
 * Service layer for SEO Suite functionality.
 *
 * This service encapsulates all business logic for SEO features,
 * including DataForSEO API calls, data transformation, and caching.
 *
 * Based on OpenSEO's architecture patterns.
 */
import { type DomainOverviewMetrics, type RankedKeywordResult, type PageResult, type KeywordMetric, type BacklinksSummary, type BacklinkItem, type ReferringDomainItem, type BacklinksHistoryPoint } from "../lib/dataforseo/mappers";
export declare function getDomainOverview(input: {
    projectId: string;
    domain: string;
    includeSubdomains: boolean;
    locationCode?: number;
    languageCode?: string;
}): Promise<{
    metrics: DomainOverviewMetrics;
    rankedKeywords: RankedKeywordResult[];
    pages: PageResult[];
}>;
export declare function searchKeywords(input: {
    keyword: string;
    locationCode?: number;
    languageCode?: string;
    limit?: number;
}): Promise<KeywordMetric[]>;
export declare function getRelatedKeywords(input: {
    keyword: string;
    locationCode?: number;
    languageCode?: string;
    limit?: number;
}): Promise<KeywordMetric[]>;
export declare function getBacklinksSummary(input: {
    projectId: string;
    target: string;
}): Promise<BacklinksSummary>;
export declare function getBacklinks(input: {
    target: string;
    limit?: number;
    offset?: number;
}): Promise<BacklinkItem[]>;
export declare function getReferringDomains(input: {
    target: string;
    limit?: number;
    offset?: number;
}): Promise<ReferringDomainItem[]>;
export declare function getBacklinksHistory(input: {
    target: string;
}): Promise<BacklinksHistoryPoint[]>;
export declare function getSavedKeywords(projectId: string): Promise<{
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    notes: string | null;
    source: string;
    tags: string[];
    locationCode: number | null;
    languageCode: string | null;
    projectId: string;
    listId: string | null;
    keyword: string;
    metricsCache: unknown;
}[]>;
export declare function saveKeyword(input: {
    projectId: string;
    keyword: string;
    listId?: string;
    searchVolume?: number;
    cpc?: number;
    competition?: number;
    keywordDifficulty?: number;
    locationCode?: number;
    languageCode?: string;
    tags?: string[];
    notes?: string;
}): Promise<{
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    notes: string | null;
    source: string;
    tags: string[];
    locationCode: number | null;
    languageCode: string | null;
    projectId: string;
    listId: string | null;
    keyword: string;
    metricsCache: unknown;
} | undefined>;
export declare function deleteKeyword(id: string): Promise<void>;
export declare function getRankTrackers(projectId: string): Promise<{
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    locationCode: number;
    languageCode: string;
    projectId: string;
    schedule: string;
    device: string;
    engine: string;
    enabled: boolean;
    lastRunAt: Date | null;
    nextRunAt: Date | null;
}[]>;
export declare function createRankTracker(input: {
    projectId: string;
    keyword: string;
    targetUrl: string;
    locationCode?: number;
    languageCode?: string;
}): Promise<{
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    locationCode: number;
    languageCode: string;
    projectId: string;
    schedule: string;
    device: string;
    engine: string;
    enabled: boolean;
    lastRunAt: Date | null;
    nextRunAt: Date | null;
} | undefined>;
export declare function getRankHistory(trackerId: string, days?: number): Promise<{
    id: string;
    url: string | null;
    projectId: string;
    rankKeywordId: string;
    checkedAt: Date;
    rankAbsolute: number | null;
    rankGroup: number | null;
    serpFeatures: string[];
    aiOverview: boolean;
    serpSnapshot: unknown;
}[]>;
export declare const SeoSuiteService: {
    readonly getDomainOverview: typeof getDomainOverview;
    readonly searchKeywords: typeof searchKeywords;
    readonly getRelatedKeywords: typeof getRelatedKeywords;
    readonly getBacklinksSummary: typeof getBacklinksSummary;
    readonly getBacklinks: typeof getBacklinks;
    readonly getReferringDomains: typeof getReferringDomains;
    readonly getBacklinksHistory: typeof getBacklinksHistory;
    readonly getSavedKeywords: typeof getSavedKeywords;
    readonly saveKeyword: typeof saveKeyword;
    readonly deleteKeyword: typeof deleteKeyword;
    readonly getRankTrackers: typeof getRankTrackers;
    readonly createRankTracker: typeof createRankTracker;
    readonly getRankHistory: typeof getRankHistory;
};
