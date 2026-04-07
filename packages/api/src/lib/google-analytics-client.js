import { google, analyticsdata_v1beta, analyticsadmin_v1beta } from 'googleapis';
import { getGoogleAuthClient } from './google-auth';
/**
 * Client for Google Analytics 4 (Data API & Admin API) using a Service Account
 */
export class GoogleAnalyticsClient {
    analytics = null;
    admin = null;
    auth;
    constructor() {
        this.auth = getGoogleAuthClient();
        if (!this.auth) {
            throw new Error('Google Auth Client not initialized. Check GOOGLE_SERVICE_ACCOUNT_JSON.');
        }
    }
    async getAnalytics() {
        if (!this.analytics) {
            const client = await this.auth.getClient();
            this.analytics = google.analyticsdata({ version: 'v1beta', auth: client });
        }
        return this.analytics;
    }
    async getAdmin() {
        if (!this.admin) {
            const client = await this.auth.getClient();
            this.admin = google.analyticsadmin({ version: 'v1beta', auth: client });
        }
        return this.admin;
    }
    /**
     * List all GA4 properties accessible by the service account
     * and try to resolve their default URL via Data Streams.
     */
    async listAccessibleProperties() {
        try {
            const admin = await this.getAdmin();
            // 1. List Account Summaries to get high-level access info
            const summaries = await admin.accountSummaries.list();
            const accounts = summaries.data.accountSummaries || [];
            const properties = [];
            // 2. Extract properties from summaries
            for (const account of accounts) {
                if (account.propertySummaries) {
                    for (const prop of account.propertySummaries) {
                        const propertyId = prop.property?.split('/').pop();
                        if (!propertyId)
                            continue;
                        properties.push({
                            propertyId,
                            displayName: prop.displayName || 'Unknown Property',
                            defaultUrl: null // Will fetch below
                        });
                    }
                }
            }
            // 3. For each property, fetch Data Streams to find the URL
            // We run this in parallel but with a concurrency limit if needed (simplified here)
            const results = await Promise.allSettled(properties.map(async (p) => {
                try {
                    const streams = await admin.properties.dataStreams.list({
                        parent: `properties/${p.propertyId}`
                    });
                    // Find the first web stream with a valid URI
                    const webStream = streams.data.dataStreams?.find(s => s.type === 'WEB_DATA_STREAM' && s.webStreamData?.defaultUri);
                    return {
                        ...p,
                        defaultUrl: webStream?.webStreamData?.defaultUri || null
                    };
                }
                catch (e) {
                    console.warn(`Failed to fetch streams for property ${p.propertyId}`, e);
                    return p; // Return without URL on failure
                }
            }));
            // Filter out failures if necessary, or just return what we have
            return results
                .filter(r => r.status === 'fulfilled')
                //@ts-ignore
                .map(r => r.value);
        }
        catch (error) {
            console.error('GA4 Error listing properties:', error);
            // Fallback: don't crash the whole app if listing fails
            return [];
        }
    }
    /**
     * Get organic search performance data
     */
    async getOrganicPerformance(propertyId, startDate, endDate) {
        try {
            const analytics = await this.getAnalytics();
            const response = await analytics.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'date' }],
                    metrics: [
                        { name: 'sessions' },
                        { name: 'totalUsers' },
                        { name: 'conversions' },
                        { name: 'bounceRate' },
                        { name: 'engagementRate' }, // Added useful metric
                        { name: 'averageSessionDuration' }
                    ],
                    dimensionFilter: {
                        filter: {
                            fieldName: 'sessionSourceMedium',
                            stringFilter: {
                                value: 'google / organic',
                                matchType: 'EXACT' // Strictly organic google traffic
                            }
                        }
                    }
                },
            });
            return response.data;
        }
        catch (error) {
            console.error(`GA4 Error fetching organic performance for ${propertyId}:`, error);
            throw error;
        }
    }
    /**
     * Get top organic landing pages
     */
    async getTopLandingPages(propertyId, startDate, endDate, limit = 10) {
        try {
            const analytics = await this.getAnalytics();
            const response = await analytics.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'pagePath' }],
                    metrics: [
                        { name: 'sessions' },
                        { name: 'totalUsers' },
                        { name: 'conversions' },
                        { name: 'engagementRate' },
                        { name: 'bounceRate' },
                        { name: 'averageSessionDuration' }
                    ],
                    dimensionFilter: {
                        filter: {
                            fieldName: 'sessionSourceMedium',
                            stringFilter: {
                                value: 'google / organic',
                                matchType: 'EXACT'
                            }
                        }
                    },
                    limit: String(limit)
                },
            });
            return response.data;
        }
        catch (error) {
            console.error(`GA4 Error fetching landing pages for ${propertyId}:`, error);
            throw error;
        }
    }
    /**
     * Get organic traffic breakdown by country
     */
    async getTopCountries(propertyId, startDate, endDate, limit = 20) {
        try {
            const analytics = await this.getAnalytics();
            const response = await analytics.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'countryId' }],
                    metrics: [
                        { name: 'sessions' },
                        { name: 'totalUsers' }
                    ],
                    dimensionFilter: {
                        filter: {
                            fieldName: 'sessionSourceMedium',
                            stringFilter: {
                                value: 'google / organic',
                                matchType: 'EXACT'
                            }
                        }
                    },
                    limit: String(limit)
                },
            });
            return response.data;
        }
        catch (error) {
            console.error(`GA4 Error fetching countries for ${propertyId}:`, error);
            throw error;
        }
    }
    /**
     * Get organic traffic breakdown by device category
     */
    async getTopDevices(propertyId, startDate, endDate) {
        try {
            const analytics = await this.getAnalytics();
            const response = await analytics.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'deviceCategory' }],
                    metrics: [
                        { name: 'sessions' },
                        { name: 'totalUsers' }
                    ],
                    dimensionFilter: {
                        filter: {
                            fieldName: 'sessionSourceMedium',
                            stringFilter: {
                                value: 'google / organic',
                                matchType: 'EXACT'
                            }
                        }
                    }
                },
            });
            return response.data;
        }
        catch (error) {
            console.error(`GA4 Error fetching devices for ${propertyId}:`, error);
            throw error;
        }
    }
    /**
     * Get overall site stats (Session, Users, Engagement)
     * Useful for the high-level scorecards
     */
    async getRealtimeStats(propertyId, startDate, endDate) {
        try {
            const analytics = await this.getAnalytics();
            const response = await analytics.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    metrics: [
                        { name: 'sessions' },
                        { name: 'totalUsers' },
                        { name: 'engagementRate' },
                        { name: 'conversions' }
                    ],
                    // No dimension filter here if we want TOTAL site traffic, 
                    // BUT for SEO report we probably want only Organic?
                    // Let's stick to Organic for consistency with GSC data
                    dimensionFilter: {
                        filter: {
                            fieldName: 'sessionSourceMedium',
                            stringFilter: {
                                value: 'google / organic',
                                matchType: 'EXACT'
                            }
                        }
                    }
                },
            });
            return response.data;
        }
        catch (error) {
            console.error(`GA4 Error fetching stats for ${propertyId}:`, error);
            throw error;
        }
    }
}
