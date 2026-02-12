import { google, analyticsdata_v1beta } from 'googleapis';
import { getGoogleAuthClient } from './google-auth';

/**
 * Client for Google Analytics 4 (Data API) using a Service Account
 */
export class GoogleAnalyticsClient {
    private analytics: analyticsdata_v1beta.Analyticsdata | null = null;
    private auth: any;

    constructor() {
        this.auth = getGoogleAuthClient();
        if (!this.auth) {
            throw new Error('Google Auth Client not initialized. Check GOOGLE_SERVICE_ACCOUNT_JSON.');
        }
    }

    private async getAnalytics() {
        if (!this.analytics) {
            // Explicitly get the authorized client
            const client = await this.auth.getClient();
            this.analytics = google.analyticsdata({ version: 'v1beta', auth: client });
        }
        return this.analytics;
    }

    /**
     * Get organic search performance data
     */
    async getOrganicPerformance(propertyId: string, startDate: string, endDate: string) {
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
                    }
                },
            });

            return response.data;
        } catch (error) {
            console.error(`GA4 Error fetching organic performance for ${propertyId}:`, error);
            throw error;
        }
    }

    /**
     * Get top organic landing pages
     */
    async getTopLandingPages(propertyId: string, startDate: string, endDate: string, limit = 10) {
        try {
            const analytics = await this.getAnalytics();
            const response = await analytics.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'pagePath' }],
                    metrics: [
                        { name: 'sessions' },
                        { name: 'conversions' }
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
        } catch (error) {
            console.error(`GA4 Error fetching landing pages for ${propertyId}:`, error);
            throw error;
        }
    }
}
