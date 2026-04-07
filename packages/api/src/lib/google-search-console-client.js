import { google, searchconsole_v1 } from 'googleapis';
import { getGoogleAuthClient } from './google-auth';
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
            // Explicitly get the authorized client
            const client = await this.auth.getClient();
            this.sc = google.searchconsole({ version: 'v1', auth: client });
        }
        return this.sc;
    }
    /**
     * Get search analytics data
     */
    async getSearchAnalytics(siteUrl, startDate, endDate) {
        try {
            const sc = await this.getSc();
            const response = await sc.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['date'],
                    rowLimit: 1000,
                },
            });
            return response.data.rows || [];
        }
        catch (error) {
            console.error(`GSC Error fetching analytics for ${siteUrl}:`, error);
            throw error;
        }
    }
    /**
     * Get top pages
     */
    async getTopPages(siteUrl, startDate, endDate, limit = 20) {
        try {
            const sc = await this.getSc();
            const response = await sc.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['page'],
                    rowLimit: limit,
                },
            });
            return response.data.rows || [];
        }
        catch (error) {
            console.error(`GSC Error fetching top pages for ${siteUrl}:`, error);
            throw error;
        }
    }
    /**
     * Get top countries
     */
    async getTopCountries(siteUrl, startDate, endDate, limit = 10) {
        try {
            const sc = await this.getSc();
            const response = await sc.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['country'],
                    rowLimit: limit,
                },
            });
            return response.data.rows || [];
        }
        catch (error) {
            console.error(`GSC Error fetching top countries for ${siteUrl}:`, error);
            throw error;
        }
    }
    /**
     * Get top keywords
     */
    async getTopKeywords(siteUrl, startDate, endDate, limit = 20) {
        try {
            const sc = await this.getSc();
            const response = await sc.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['query'],
                    rowLimit: limit,
                },
            });
            return response.data.rows || [];
        }
        catch (error) {
            console.error(`GSC Error fetching top keywords for ${siteUrl}:`, error);
            throw error;
        }
    }
    /**
     * Get data grouped by device
     */
    async getTopDevices(siteUrl, startDate, endDate) {
        try {
            const sc = await this.getSc();
            const response = await sc.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['device'],
                    rowLimit: 10,
                },
            });
            return response.data.rows || [];
        }
        catch (error) {
            console.error(`GSC Error fetching device data for ${siteUrl}:`, error);
            throw error;
        }
    }
    /**
     * Get data grouped by search appearance (rich results)
     */
    async getSearchAppearance(siteUrl, startDate, endDate) {
        try {
            const sc = await this.getSc();
            const response = await sc.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['searchAppearance'],
                    rowLimit: 20,
                },
            });
            return response.data.rows || [];
        }
        catch (error) {
            console.error(`GSC Error fetching search appearance for ${siteUrl}:`, error);
            throw error;
        }
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
