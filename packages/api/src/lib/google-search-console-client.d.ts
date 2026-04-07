import { searchconsole_v1 } from 'googleapis';
/**
 * Client for Google Search Console API using a Service Account
 */
export declare class GoogleSearchConsoleClient {
    private sc;
    private auth;
    constructor();
    private getSc;
    /**
     * Get search analytics data
     */
    getSearchAnalytics(siteUrl: string, startDate: string, endDate: string): Promise<searchconsole_v1.Schema$ApiDataRow[]>;
    /**
     * Get top pages
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
