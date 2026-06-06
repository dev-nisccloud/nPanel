import { analyticsdata_v1beta } from 'googleapis';
/**
 * Metric order for all organic SEO reports.
 * Uses activeUsers - same "Users" metric as standard GA4 acquisition reports.
 */
export declare const GA4_ORGANIC_METRIC_NAMES: readonly ["sessions", "activeUsers", "conversions", "bounceRate", "engagementRate", "averageSessionDuration"];
export declare const GA4_ORGANIC_METRICS: analyticsdata_v1beta.Schema$Metric[];
export type Ga4OrganicSummary = {
    sessions: number;
    users: number;
    conversions: number;
    /** Percentage 0–100. */
    engagementRate: number;
    /** Percentage 0–100. */
    bounceRate: number;
    /** Seconds. */
    averageSessionDuration: number;
};
/** Property-level totals from a single API row. */
export declare function ga4OrganicSummaryFromReportRow(metricValues: analyticsdata_v1beta.Schema$MetricValue[] | null | undefined): Ga4OrganicSummary;
/**
 * Prefer response.totals (metricAggregations TOTAL); else single aggregate row; else daily fallback.
 * @see https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/RunReportResponse
 */
export declare function ga4OrganicSummaryFromRunReportResponse(response: analyticsdata_v1beta.Schema$RunReportResponse | null | undefined): Ga4OrganicSummary;
/**
 * Fallback when totals are missing: sum sessions/conversions; session-weighted rates.
 * activeUsers must NOT be summed across days (GA4 counts unique users per period only).
 */
export declare function ga4OrganicSummaryFromDailyRows(rows: analyticsdata_v1beta.Schema$Row[]): Ga4OrganicSummary;
/**
 * Client for Google Analytics 4 (Data API & Admin API) using a Service Account
 */
export declare class GoogleAnalyticsClient {
    private analytics;
    private admin;
    private auth;
    constructor();
    private getAnalytics;
    private getAdmin;
    /**
     * Paginated runReport for organic traffic (Organic Search channel).
     * @see https://developers.google.com/analytics/devguides/reporting/data/v1/basics#pagination
     */
    private runOrganicReport;
    private runOrganicReportSafe;
    listAccessibleProperties(): Promise<{
        propertyId: string;
        displayName: string;
        defaultUrl: string | null;
    }[]>;
    /** Period totals - uses response.totals from metricAggregations TOTAL. */
    getOrganicPeriodTotals(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    /** Daily organic performance, paginated. */
    getOrganicPerformance(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    getTopLandingPages(propertyId: string, startDate: string, endDate: string, limit?: number): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    getTopCountries(propertyId: string, startDate: string, endDate: string, limit?: number): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    getTopDevices(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    /** @deprecated Use getOrganicPeriodTotals */
    getRealtimeStats(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
}
