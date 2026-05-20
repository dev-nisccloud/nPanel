import { google, analyticsdata_v1beta, analyticsadmin_v1beta } from 'googleapis';
import { getGoogleAuthClient } from './google-auth';

/**
 * Matches GA4 Traffic acquisition → "Organic Search" (session default channel group).
 * @see https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
 */
const GA4_ORGANIC_CHANNEL_GROUP = 'Organic Search';

const GA4_MAX_ROWS_PER_REQUEST = 10_000;

/**
 * Metric order for all organic SEO reports.
 * Uses activeUsers — same "Users" metric as standard GA4 acquisition reports.
 */
export const GA4_ORGANIC_METRIC_NAMES = [
    'sessions',
    'activeUsers',
    'conversions',
    'bounceRate',
    'engagementRate',
    'averageSessionDuration',
] as const;

export const GA4_ORGANIC_METRICS: analyticsdata_v1beta.Schema$Metric[] = GA4_ORGANIC_METRIC_NAMES.map(
    (name) => ({ name }),
);

const GA4_SUMMARY_METRICS: analyticsdata_v1beta.Schema$Metric[] = GA4_ORGANIC_METRICS;

const GA4_COUNTRY_DEVICE_METRICS: analyticsdata_v1beta.Schema$Metric[] = [
    { name: 'sessions' },
    { name: 'activeUsers' },
];

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

function parseMetricValues(
    metricValues: analyticsdata_v1beta.Schema$MetricValue[] | null | undefined,
): Ga4OrganicSummary {
    const get = (index: number) => metricValues?.[index]?.value ?? '0';
    const sessions = Number.parseInt(get(0), 10);
    const users = Number.parseInt(get(1), 10);
    const conversions = Number.parseInt(get(2), 10);
    const bounceFraction = Number.parseFloat(get(3));
    const engagementFraction = Number.parseFloat(get(4));
    const averageSessionDuration = Number.parseFloat(get(5));

    return {
        sessions,
        users,
        conversions,
        bounceRate: bounceFraction * 100,
        engagementRate: engagementFraction * 100,
        averageSessionDuration,
    };
}

/** Property-level totals from a single API row. */
export function ga4OrganicSummaryFromReportRow(
    metricValues: analyticsdata_v1beta.Schema$MetricValue[] | null | undefined,
): Ga4OrganicSummary {
    return parseMetricValues(metricValues);
}

/**
 * Prefer response.totals (metricAggregations TOTAL); else single aggregate row; else daily fallback.
 * @see https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/RunReportResponse
 */
export function ga4OrganicSummaryFromRunReportResponse(
    response: analyticsdata_v1beta.Schema$RunReportResponse | null | undefined,
): Ga4OrganicSummary {
    const totalsRow = response?.totals?.[0];
    if (totalsRow?.metricValues?.length) {
        return ga4OrganicSummaryFromReportRow(totalsRow.metricValues);
    }

    const hasDimensions = (response?.dimensionHeaders?.length ?? 0) > 0;
    const aggregateRow = !hasDimensions ? response?.rows?.[0] : undefined;
    if (aggregateRow?.metricValues?.length) {
        return ga4OrganicSummaryFromReportRow(aggregateRow.metricValues);
    }

    return ga4OrganicSummaryFromDailyRows(response?.rows ?? []);
}

/**
 * Fallback when totals are missing: sum sessions/conversions; session-weighted rates.
 * activeUsers must NOT be summed across days (GA4 counts unique users per period only).
 */
export function ga4OrganicSummaryFromDailyRows(
    rows: analyticsdata_v1beta.Schema$Row[],
): Ga4OrganicSummary {
    let sessions = 0;
    let conversions = 0;
    let weightedBounce = 0;
    let weightedEngagement = 0;
    let weightedDuration = 0;

    for (const row of rows) {
        const day = parseMetricValues(row.metricValues);
        const daySessions = day.sessions;
        sessions += daySessions;
        conversions += day.conversions;
        weightedBounce += (day.bounceRate / 100) * daySessions;
        weightedEngagement += (day.engagementRate / 100) * daySessions;
        weightedDuration += day.averageSessionDuration * daySessions;
    }

    return {
        sessions,
        users: 0,
        conversions,
        bounceRate: sessions > 0 ? (weightedBounce / sessions) * 100 : 0,
        engagementRate: sessions > 0 ? (weightedEngagement / sessions) * 100 : 0,
        averageSessionDuration: sessions > 0 ? weightedDuration / sessions : 0,
    };
}

function organicTrafficFilter(): analyticsdata_v1beta.Schema$FilterExpression {
    return {
        filter: {
            fieldName: 'sessionDefaultChannelGroup',
            stringFilter: {
                value: GA4_ORGANIC_CHANNEL_GROUP,
                matchType: 'EXACT',
            },
        },
    };
}

/**
 * Client for Google Analytics 4 (Data API & Admin API) using a Service Account
 */
export class GoogleAnalyticsClient {
    private analytics: analyticsdata_v1beta.Analyticsdata | null = null;
    private admin: analyticsadmin_v1beta.Analyticsadmin | null = null;
    private auth: any;

    constructor() {
        this.auth = getGoogleAuthClient();
        if (!this.auth) {
            throw new Error('Google Auth Client not initialized. Check GOOGLE_SERVICE_ACCOUNT_JSON.');
        }
    }

    private async getAnalytics() {
        if (!this.analytics) {
            const client = await this.auth.getClient();
            this.analytics = google.analyticsdata({ version: 'v1beta', auth: client });
        }
        return this.analytics;
    }

    private async getAdmin() {
        if (!this.admin) {
            const client = await this.auth.getClient();
            this.admin = google.analyticsadmin({ version: 'v1beta', auth: client });
        }
        return this.admin;
    }

    /**
     * Paginated runReport for organic traffic (Organic Search channel).
     * @see https://developers.google.com/analytics/devguides/reporting/data/v1/basics#pagination
     */
    private async runOrganicReport(
        propertyId: string,
        requestBody: Omit<analyticsdata_v1beta.Schema$RunReportRequest, 'dateRanges' | 'dimensionFilter' | 'metrics'> & {
            dateRanges: analyticsdata_v1beta.Schema$DateRange[];
            metrics?: analyticsdata_v1beta.Schema$Metric[];
            maxRows?: number;
            /** When true, response includes `totals` with period-aggregate metrics. */
            includeTotals?: boolean;
        },
    ): Promise<analyticsdata_v1beta.Schema$RunReportResponse> {
        const analytics = await this.getAnalytics();
        const {
            maxRows,
            metrics: requestedMetrics,
            dateRanges,
            dimensions,
            orderBys,
            includeTotals = true,
        } = requestBody;
        const metrics = requestedMetrics ?? GA4_ORGANIC_METRICS;
        const allRows: analyticsdata_v1beta.Schema$Row[] = [];
        let offset = 0;
        let lastResponse: analyticsdata_v1beta.Schema$RunReportResponse = {};

        while (true) {
            const requestLimit = maxRows
                ? Math.min(GA4_MAX_ROWS_PER_REQUEST, maxRows - allRows.length)
                : GA4_MAX_ROWS_PER_REQUEST;

            if (maxRows && requestLimit <= 0) {
                break;
            }

            const response = await analytics.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges,
                    dimensions,
                    orderBys,
                    metrics,
                    dimensionFilter: organicTrafficFilter(),
                    metricAggregations: includeTotals ? ['TOTAL'] : undefined,
                    limit: String(requestLimit),
                    offset: String(offset),
                },
            });

            lastResponse = response.data;
            const rows = response.data.rows ?? [];
            allRows.push(...rows);

            if (maxRows && allRows.length >= maxRows) {
                return {
                    ...lastResponse,
                    rows: allRows.slice(0, maxRows),
                };
            }

            if (rows.length < requestLimit) {
                return {
                    ...lastResponse,
                    rows: allRows,
                };
            }

            offset += requestLimit;
        }

        return lastResponse;
    }

    private async runOrganicReportSafe(
        propertyId: string,
        requestBody: {
            dateRanges: analyticsdata_v1beta.Schema$DateRange[];
            metrics?: analyticsdata_v1beta.Schema$Metric[];
            dimensions?: analyticsdata_v1beta.Schema$Dimension[];
            orderBys?: analyticsdata_v1beta.Schema$OrderBy[];
            maxRows?: number;
            includeTotals?: boolean;
        },
    ) {
        try {
            return await this.runOrganicReport(propertyId, requestBody);
        } catch (error) {
            console.error(`GA4 Error querying property ${propertyId}:`, error);
            throw error;
        }
    }

    async listAccessibleProperties() {
        try {
            const admin = await this.getAdmin();

            const summaries = await admin.accountSummaries.list();
            const accounts = summaries.data.accountSummaries || [];

            const properties: {
                propertyId: string;
                displayName: string;
                defaultUrl: string | null;
            }[] = [];

            for (const account of accounts) {
                if (account.propertySummaries) {
                    for (const prop of account.propertySummaries) {
                        const propertyId = prop.property?.split('/').pop();
                        if (!propertyId) continue;

                        properties.push({
                            propertyId,
                            displayName: prop.displayName || 'Unknown Property',
                            defaultUrl: null,
                        });
                    }
                }
            }

            const results = await Promise.allSettled(
                properties.map(async (p) => {
                    try {
                        const streams = await admin.properties.dataStreams.list({
                            parent: `properties/${p.propertyId}`,
                        });

                        const webStream = streams.data.dataStreams?.find(
                            (s) => s.type === 'WEB_DATA_STREAM' && s.webStreamData?.defaultUri,
                        );

                        return {
                            ...p,
                            defaultUrl: webStream?.webStreamData?.defaultUri || null,
                        };
                    } catch (e) {
                        console.warn(`Failed to fetch streams for property ${p.propertyId}`, e);
                        return p;
                    }
                }),
            );

            return results
                .filter((r) => r.status === 'fulfilled')
                //@ts-ignore
                .map((r) => r.value);
        } catch (error) {
            console.error('GA4 Error listing properties:', error);
            return [];
        }
    }

    /** Period totals — uses response.totals from metricAggregations TOTAL. */
    async getOrganicPeriodTotals(propertyId: string, startDate: string, endDate: string) {
        return this.runOrganicReportSafe(propertyId, {
            dateRanges: [{ startDate, endDate }],
            metrics: GA4_SUMMARY_METRICS,
            includeTotals: true,
        });
    }

    /** Daily organic performance, paginated. */
    async getOrganicPerformance(propertyId: string, startDate: string, endDate: string) {
        return this.runOrganicReportSafe(propertyId, {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'date' }],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
            includeTotals: false,
        });
    }

    async getTopLandingPages(propertyId: string, startDate: string, endDate: string, limit = 10) {
        return this.runOrganicReportSafe(propertyId, {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'pagePath' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            maxRows: limit,
            includeTotals: false,
        });
    }

    async getTopCountries(propertyId: string, startDate: string, endDate: string, limit = 20) {
        return this.runOrganicReportSafe(propertyId, {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'countryId' }],
            metrics: GA4_COUNTRY_DEVICE_METRICS,
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            maxRows: limit,
            includeTotals: false,
        });
    }

    async getTopDevices(propertyId: string, startDate: string, endDate: string) {
        return this.runOrganicReportSafe(propertyId, {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: GA4_COUNTRY_DEVICE_METRICS,
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            maxRows: 10,
            includeTotals: false,
        });
    }

    /** @deprecated Use getOrganicPeriodTotals */
    async getRealtimeStats(propertyId: string, startDate: string, endDate: string) {
        return this.getOrganicPeriodTotals(propertyId, startDate, endDate);
    }
}
