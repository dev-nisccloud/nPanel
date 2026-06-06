import { searchconsole_v1 } from 'googleapis';
export type GscPropertySummary = {
    clicks: number;
    impressions: number;
    /** CTR as percentage 0–100 (matches UI). */
    ctr: number;
    position: number;
};
/** Build summary from a single property-total API row (no dimensions). */
export declare function gscPropertySummaryFromRow(row: searchconsole_v1.Schema$ApiDataRow | null | undefined): GscPropertySummary;
/** Fallback: sum daily rows with impression-weighted average position. */
export declare function gscPropertySummaryFromDailyRows(rows: searchconsole_v1.Schema$ApiDataRow[]): GscPropertySummary;
/**
 * Client for Google Search Console API using a Service Account
 */
export declare class GoogleSearchConsoleClient {
    private sc;
    private auth;
    constructor();
    private getSc;
    /**
     * Paginated searchanalytics.query - matches GSC API guidance (startRow until empty).
     */
    private querySearchAnalyticsAllRows;
    private querySearchAnalytics;
    /**
     * Property-level totals for a date range (no dimensions) - matches GSC chart totals.
     */
    getSiteSummaryTotals(siteUrl: string, startDate: string, endDate: string): Promise<searchconsole_v1.Schema$ApiDataRow | null>;
    /**
     * Daily search analytics (date dimension), fully paginated.
     */
    getSearchAnalytics(siteUrl: string, startDate: string, endDate: string): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Top pages (by clicks), aggregated by page per Google guidance.
     */
    getTopPages(siteUrl: string, startDate: string, endDate: string, limit?: number): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Top countries (by clicks).
     */
    getTopCountries(siteUrl: string, startDate: string, endDate: string, limit?: number): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Top keywords/queries (by clicks).
     */
    getTopKeywords(siteUrl: string, startDate: string, endDate: string, limit?: number): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Traffic by device.
     */
    getTopDevices(siteUrl: string, startDate: string, endDate: string): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Search appearance types (step 1 of Google's two-step rich-result flow).
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
