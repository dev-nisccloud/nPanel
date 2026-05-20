import { analyticsdata_v1beta } from 'googleapis';

export declare const GA4_ORGANIC_METRIC_NAMES: readonly [
    'sessions',
    'activeUsers',
    'conversions',
    'bounceRate',
    'engagementRate',
    'averageSessionDuration',
];

export declare const GA4_ORGANIC_METRICS: analyticsdata_v1beta.Schema$Metric[];

export type Ga4OrganicSummary = {
    sessions: number;
    users: number;
    conversions: number;
    engagementRate: number;
    bounceRate: number;
    averageSessionDuration: number;
};

export declare function ga4OrganicSummaryFromReportRow(
    metricValues: analyticsdata_v1beta.Schema$MetricValue[] | null | undefined,
): Ga4OrganicSummary;

export declare function ga4OrganicSummaryFromRunReportResponse(
    response: analyticsdata_v1beta.Schema$RunReportResponse | null | undefined,
): Ga4OrganicSummary;

export declare function ga4OrganicSummaryFromDailyRows(
    rows: analyticsdata_v1beta.Schema$Row[],
): Ga4OrganicSummary;

export declare class GoogleAnalyticsClient {
    private analytics;
    private admin;
    private auth;
    constructor();
    private getAnalytics;
    private getAdmin;
    private runOrganicReport;
    private runOrganicReportSafe;
    listAccessibleProperties(): Promise<{
        propertyId: string;
        displayName: string;
        defaultUrl: string | null;
    }[]>;
    getOrganicPeriodTotals(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    getOrganicPerformance(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    getTopLandingPages(propertyId: string, startDate: string, endDate: string, limit?: number): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    getTopCountries(propertyId: string, startDate: string, endDate: string, limit?: number): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    getTopDevices(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
    getRealtimeStats(propertyId: string, startDate: string, endDate: string): Promise<analyticsdata_v1beta.Schema$RunReportResponse>;
}
