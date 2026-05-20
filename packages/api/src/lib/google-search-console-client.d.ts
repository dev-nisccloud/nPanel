import { searchconsole_v1 } from 'googleapis';

export type GscPropertySummary = {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
};

export declare function gscPropertySummaryFromRow(
    row: searchconsole_v1.Schema$ApiDataRow | null | undefined,
): GscPropertySummary;

export declare function gscPropertySummaryFromDailyRows(
    rows: searchconsole_v1.Schema$ApiDataRow[],
): GscPropertySummary;

/**
 * Client for Google Search Console API using a Service Account
 */
export declare class GoogleSearchConsoleClient {
    private sc;
    private auth;
    constructor();
    private getSc;
    private querySearchAnalyticsAllRows;
    private querySearchAnalytics;
    /**
     * Property-level totals for a date range (no dimensions).
     */
    getSiteSummaryTotals(siteUrl: string, startDate: string, endDate: string): Promise<searchconsole_v1.Schema$ApiDataRow | null>;
    /**
     * Daily search analytics (date dimension), fully paginated.
     */
    getSearchAnalytics(siteUrl: string, startDate: string, endDate: string): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Top pages (by clicks), aggregated by page.
     */
    getTopPages(siteUrl: string, startDate: string, endDate: string, limit?: number): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Get top countries
     */
    getTopCountries(siteUrl: string, startDate: string, endDate: string, limit?: number): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Get top keywords
     */
    getTopKeywords(siteUrl: string, startDate: string, endDate: string, limit?: number): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Get data grouped by device
     */
    getTopDevices(siteUrl: string, startDate: string, endDate: string): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Get data grouped by search appearance (rich results)
     */
    getSearchAppearance(siteUrl: string, startDate: string, endDate: string): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Get sitemaps status
     */
    getSitemaps(siteUrl: string): Promise<searchconsole_v1.Schema$WmxSitemap[]>;
    /**
     * List accessible sites
     */
    listSites(): Promise<searchconsole_v1.Schema$WmxSite[]>;
}
