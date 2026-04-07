import { analyticsdata_v1beta } from 'googleapis';
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
     * List all GA4 properties accessible by the service account
     * and try to resolve their default URL via Data Streams.
     */
    listAccessibleProperties(): Promise<{
        propertyId: string;
        displayName: string;
        defaultUrl: string | null;
    }[]>;
    /**
     * Get organic search performance data
     */
    getOrganicPerformance(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    /**
     * Get top organic landing pages
     */
    getTopLandingPages(propertyId: string, startDate: string, endDate: string, limit?: number): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    /**
     * Get organic traffic breakdown by country
     */
    getTopCountries(propertyId: string, startDate: string, endDate: string, limit?: number): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    /**
     * Get organic traffic breakdown by device category
     */
    getTopDevices(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    /**
     * Get overall site stats (Session, Users, Engagement)
     * Useful for the high-level scorecards
     */
    getRealtimeStats(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
}
