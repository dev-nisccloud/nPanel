import { google, searchconsole_v1 } from 'googleapis';
import { getGoogleAuthClient } from './google-auth';
/** Align with GSC Performance report default (web search). */
const GSC_SEARCH_TYPE = 'web';
/** Include fresh/preliminary data to match GSC UI recent days. */
const GSC_DATA_STATE = 'all';
const GSC_MAX_ROWS_PER_REQUEST = 25_000;
/** Build summary from a single property-total API row (no dimensions). */
export function gscPropertySummaryFromRow(row) {
    if (!row) {
        return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    }
    const clicks = row.clicks ?? 0;
    const impressions = row.impressions ?? 0;
    return {
        clicks,
        impressions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : (row.ctr ?? 0) * 100,
        position: row.position ?? 0,
    };
}
/** Fallback: sum daily rows with impression-weighted average position. */
export function gscPropertySummaryFromDailyRows(rows) {
    let clicks = 0;
    let impressions = 0;
    let weightedPosition = 0;
    for (const row of rows) {
        const rowClicks = row.clicks ?? 0;
        const rowImpressions = row.impressions ?? 0;
        clicks += rowClicks;
        impressions += rowImpressions;
        weightedPosition += (row.position ?? 0) * rowImpressions;
    }
    return {
        clicks,
        impressions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        position: impressions > 0 ? weightedPosition / impressions : 0,
    };
}
/**
 * Client for Google Search Console API using a Service Account
 */
export class GoogleSearchConsoleClient {
    sc = null;
    auth;
    constructor() {
        this.auth = getGoogleAuthClient();
        if (!this.auth) {
            throw new Error('Google Auth Client not initialized. Check GOOGLE_SERVICE_ACCOUNT_JSON.');
        }
    }
    async getSc() {
        if (!this.sc) {
            const client = await this.auth.getClient();
            this.sc = google.searchconsole({ version: 'v1', auth: client });
        }
        return this.sc;
    }
    /**
     * Paginated searchanalytics.query - matches GSC API guidance (startRow until empty).
     */
    async querySearchAnalyticsAllRows(siteUrl, options) {
        const sc = await this.getSc();
        const allRows = [];
        let startRow = 0;
        while (true) {
            const requestRowLimit = options.maxRows
                ? Math.min(GSC_MAX_ROWS_PER_REQUEST, options.maxRows - allRows.length)
                : GSC_MAX_ROWS_PER_REQUEST;
            if (options.maxRows && requestRowLimit <= 0) {
                break;
            }
            const response = await sc.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate: options.startDate,
                    endDate: options.endDate,
                    type: GSC_SEARCH_TYPE,
                    dataState: GSC_DATA_STATE,
                    dimensions: options.dimensions,
                    aggregationType: options.aggregationType,
                    rowLimit: requestRowLimit,
                    startRow,
                },
            });
            const rows = response.data.rows ?? [];
            allRows.push(...rows);
            if (options.maxRows && allRows.length >= options.maxRows) {
                return allRows.slice(0, options.maxRows);
            }
            if (rows.length < requestRowLimit) {
                break;
            }
            startRow += requestRowLimit;
        }
        return allRows;
    }
    async querySearchAnalytics(siteUrl, options) {
        try {
            return await this.querySearchAnalyticsAllRows(siteUrl, options);
        }
        catch (error) {
            console.error(`GSC Error querying analytics for ${siteUrl}:`, error);
            throw error;
        }
    }
    /**
     * Property-level totals for a date range (no dimensions) - matches GSC chart totals.
     */
    async getSiteSummaryTotals(siteUrl, startDate, endDate) {
        const rows = await this.querySearchAnalytics(siteUrl, { startDate, endDate });
        return rows[0] ?? null;
    }
    /**
     * Daily search analytics (date dimension), fully paginated.
     */
    async getSearchAnalytics(siteUrl, startDate, endDate) {
        return this.querySearchAnalytics(siteUrl, {
            startDate,
            endDate,
            dimensions: ['date'],
        });
    }
    /**
     * Top pages (by clicks), aggregated by page per Google guidance.
     */
    async getTopPages(siteUrl, startDate, endDate, limit = 20) {
        return this.querySearchAnalytics(siteUrl, {
            startDate,
            endDate,
            dimensions: ['page'],
            aggregationType: 'byPage',
            maxRows: limit,
        });
    }
    /**
     * Top countries (by clicks).
     */
    async getTopCountries(siteUrl, startDate, endDate, limit = 10) {
        return this.querySearchAnalytics(siteUrl, {
            startDate,
            endDate,
            dimensions: ['country'],
            maxRows: limit,
        });
    }
    /**
     * Top keywords/queries (by clicks).
     */
    async getTopKeywords(siteUrl, startDate, endDate, limit = 20) {
        return this.querySearchAnalytics(siteUrl, {
            startDate,
            endDate,
            dimensions: ['query'],
            maxRows: limit,
        });
    }
    /**
     * Traffic by device.
     */
    async getTopDevices(siteUrl, startDate, endDate) {
        return this.querySearchAnalytics(siteUrl, {
            startDate,
            endDate,
            dimensions: ['device'],
            maxRows: 10,
        });
    }
    /**
     * Search appearance types (step 1 of Google's two-step rich-result flow).
     */
    async getSearchAppearance(siteUrl, startDate, endDate) {
        return this.querySearchAnalytics(siteUrl, {
            startDate,
            endDate,
            dimensions: ['searchAppearance'],
            maxRows: 20,
        });
    }
    /**
     * Get sitemaps status
     */
    async getSitemaps(siteUrl) {
        try {
            const sc = await this.getSc();
            const response = await sc.sitemaps.list({
                siteUrl,
            });
            return response.data.sitemap || [];
        }
        catch (error) {
            console.error(`GSC Error fetching sitemaps for ${siteUrl}:`, error);
            throw error;
        }
    }
    /**
     * List accessible sites
     */
    async listSites() {
        try {
            const sc = await this.getSc();
            const response = await sc.sites.list();
            return response.data.siteEntry || [];
        }
        catch (error) {
            console.error('GSC Error listing sites:', error);
            throw error;
        }
    }
}
