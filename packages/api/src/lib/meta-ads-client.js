import { request } from 'undici';
export class MetaAdsApiError extends Error {
    code;
    message;
    type;
    errorSubcode;
    fbtraceId;
    constructor(code, message, type, errorSubcode, fbtraceId) {
        super(`Meta Ads API Error ${code}: ${message}`);
        this.code = code;
        this.message = message;
        this.type = type;
        this.errorSubcode = errorSubcode;
        this.fbtraceId = fbtraceId;
        this.name = 'MetaAdsApiError';
    }
}
/**
 * Meta Ads API Client
 * Specialized client for Meta Marketing API (Ads API)
 * Uses Graph API endpoints for ad accounts, campaigns, ad sets, and ads
 */
export class MetaAdsClient {
    config;
    constructor(config) {
        this.config = {
            accessToken: config.accessToken,
            apiVersion: config.apiVersion || process.env.META_API_VERSION || 'v24.0',
            baseUrl: config.baseUrl || 'https://graph.facebook.com',
        };
    }
    /**
     * Normalize account ID to ensure it has the 'act_' prefix
     * Meta API requires account IDs in format: act_123456789
     */
    normalizeAccountId(accountId) {
        if (!accountId) {
            return accountId;
        }
        // If it already starts with 'act_', return as-is
        if (accountId.startsWith('act_')) {
            return accountId;
        }
        // Otherwise, add the prefix
        return `act_${accountId}`;
    }
    /**
     * Make HTTP request to Meta Marketing API
     */
    async makeRequest(method, endpoint, params, body) {
        const url = new URL(`${this.config.baseUrl}/${this.config.apiVersion}${endpoint}`);
        // Add access token to params
        url.searchParams.set('access_token', this.config.accessToken);
        // Add additional params
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        url.searchParams.set(key, value.join(','));
                    }
                    else if (typeof value === 'object') {
                        url.searchParams.set(key, JSON.stringify(value));
                    }
                    else {
                        url.searchParams.set(key, String(value));
                    }
                }
            }
        }
        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (body && (method === 'POST' || method === 'PUT')) {
            requestOptions.body = JSON.stringify(body);
        }
        try {
            const response = await request(url.toString(), requestOptions);
            const responseData = (await response.body.json());
            // Check for API errors
            if (typeof responseData === 'object' &&
                responseData !== null &&
                'error' in responseData) {
                const error = responseData.error;
                throw new MetaAdsApiError(error.code, error.message, error.type, error.error_subcode, error.fbtrace_id);
            }
            return responseData;
        }
        catch (error) {
            if (error instanceof MetaAdsApiError) {
                throw error;
            }
            throw new MetaAdsApiError(500, 'Unknown error occurred', 'UnknownError');
        }
    }
    /**
     * List accessible ad accounts
     * GET /me/adaccounts
     */
    async getAdAccounts(fields) {
        const defaultFields = [
            'account_id',
            'name',
            'currency',
            'timezone_name',
            'account_status',
            'spend_cap',
            'amount_spent',
            'balance',
            'instagram_user_id', // ID of the Instagram account linked to this ad account (if any)
        ];
        const fieldsToFetch = fields || defaultFields;
        return this.makeRequest('GET', '/me/adaccounts', {
            fields: fieldsToFetch.join(','),
        });
    }
    /**
     * Get ad account details
     * GET /{ad-account-id}
     */
    async getAdAccountDetails(accountId, fields) {
        const defaultFields = [
            'account_id',
            'name',
            'currency',
            'timezone_name',
            'account_status',
            'spend_cap',
            'amount_spent',
            'balance',
        ];
        const fieldsToFetch = fields || defaultFields;
        // Normalize account ID to ensure it has 'act_' prefix
        const normalizedAccountId = this.normalizeAccountId(accountId);
        return this.makeRequest('GET', `/${normalizedAccountId}`, {
            fields: fieldsToFetch.join(','),
        });
    }
    /**
     * List campaigns for an ad account
     * GET /{ad-account-id}/campaigns
     */
    async getCampaigns(accountId, options) {
        const defaultFields = [
            'id',
            'name',
            'objective',
            'status',
            'daily_budget',
            'lifetime_budget',
            'budget_remaining',
            'start_time',
            'stop_time',
            'created_time',
            'updated_time',
        ];
        const params = {
            fields: (options?.fields || defaultFields).join(','),
        };
        if (options?.limit) {
            params.limit = options.limit;
        }
        if (options?.after) {
            params.after = options.after;
        }
        if (options?.filtering && options.filtering.length > 0) {
            params.filtering = JSON.stringify(options.filtering);
        }
        // Normalize account ID to ensure it has 'act_' prefix
        const normalizedAccountId = this.normalizeAccountId(accountId);
        return this.makeRequest('GET', `/${normalizedAccountId}/campaigns`, params);
    }
    /**
     * Get campaign details
     * GET /{campaign-id}
     */
    async getCampaignDetails(campaignId, fields) {
        const defaultFields = [
            'id',
            'name',
            'objective',
            'status',
            'daily_budget',
            'lifetime_budget',
            'budget_remaining',
            'start_time',
            'stop_time',
            'created_time',
            'updated_time',
        ];
        const fieldsToFetch = fields || defaultFields;
        return this.makeRequest('GET', `/${campaignId}`, {
            fields: fieldsToFetch.join(','),
        });
    }
    /**
     * List ad sets (optionally filtered by campaign)
     * GET /{ad-account-id}/adsets or GET /{campaign-id}/adsets
     */
    async getAdSets(parentId, options) {
        const defaultFields = [
            'id',
            'name',
            'status',
            'daily_budget',
            'lifetime_budget',
            'budget_remaining',
            'bid_amount',
            'targeting',
            'start_time',
            'stop_time',
            'created_time',
            'updated_time',
        ];
        const params = {
            fields: (options?.fields || defaultFields).join(','),
        };
        if (options?.limit) {
            params.limit = options.limit;
        }
        if (options?.after) {
            params.after = options.after;
        }
        if (options?.filtering && options.filtering.length > 0) {
            params.filtering = JSON.stringify(options.filtering);
        }
        return this.makeRequest('GET', `/${parentId}/adsets`, params);
    }
    /**
     * Get ad set details
     * GET /{ad-set-id}
     */
    async getAdSetDetails(adSetId, fields) {
        const defaultFields = [
            'id',
            'name',
            'status',
            'daily_budget',
            'lifetime_budget',
            'budget_remaining',
            'bid_amount',
            'targeting',
            'start_time',
            'stop_time',
            'created_time',
            'updated_time',
        ];
        const fieldsToFetch = fields || defaultFields;
        return this.makeRequest('GET', `/${adSetId}`, {
            fields: fieldsToFetch.join(','),
        });
    }
    /**
     * Get human-readable targeting description for an ad set
     * GET /{ad-set-id}/targetingsentencelines
     * Returns lines like "Location - Living In: Japan, United States", "Age: 20 - 24", etc.
     */
    async getTargetingSentenceLines(adSetId) {
        return this.makeRequest('GET', `/${adSetId}/targetingsentencelines`);
    }
    /**
     * List ads (optionally filtered by ad set)
     * GET /{ad-account-id}/ads or GET /{ad-set-id}/ads
     */
    async getAds(parentId, options) {
        const defaultFields = [
            'id',
            'name',
            'status',
            'creative',
            'created_time',
            'updated_time',
        ];
        const params = {
            fields: (options?.fields || defaultFields).join(','),
        };
        if (options?.limit) {
            params.limit = options.limit;
        }
        if (options?.after) {
            params.after = options.after;
        }
        if (options?.filtering && options.filtering.length > 0) {
            params.filtering = JSON.stringify(options.filtering);
        }
        return this.makeRequest('GET', `/${parentId}/ads`, params);
    }
    /**
     * Get ad details
     * GET /{ad-id}
     */
    async getAdDetails(adId, fields) {
        const defaultFields = [
            'id',
            'name',
            'status',
            'creative',
            'created_time',
            'updated_time',
        ];
        const fieldsToFetch = fields || defaultFields;
        return this.makeRequest('GET', `/${adId}`, {
            fields: fieldsToFetch.join(','),
        });
    }
    /**
     * Get insights (performance metrics)
     * GET /{entity-id}/insights
     * Supports levels: account, campaign, adset, ad
     */
    async getInsights(entityId, options) {
        const defaultMetrics = [
            'impressions',
            'clicks',
            'spend',
            'reach',
            'ctr',
            'cpc',
            'cpm',
            'cpp',
        ];
        const fieldsList = options?.metrics || defaultMetrics;
        const fieldsString = fieldsList.join(',');
        const params = {
            level: options?.level || 'account',
            // Meta API uses 'fields' parameter for insights endpoint
            fields: fieldsString,
        };
        if (options?.datePreset) {
            params.date_preset = options.datePreset;
        }
        if (options?.timeRange) {
            params.time_range = JSON.stringify({
                since: options.timeRange.since,
                until: options.timeRange.until,
            });
        }
        if (options?.timeIncrement) {
            params.time_increment = options.timeIncrement;
        }
        if (options?.breakdowns && options.breakdowns.length > 0) {
            params.breakdowns = options.breakdowns.join(',');
        }
        if (options?.limit) {
            params.limit = options.limit;
        }
        if (options?.after) {
            params.after = options.after;
        }
        return this.makeRequest('GET', `/${entityId}/insights`, params);
    }
    /**
     * Create a campaign
     * POST /{ad-account-id}/campaigns
     */
    async createCampaign(accountId, campaignData) {
        return this.makeRequest('POST', `/${accountId}/campaigns`, undefined, campaignData);
    }
    /**
     * Update a campaign
     * POST /{campaign-id}
     */
    async updateCampaign(campaignId, updates) {
        return this.makeRequest('POST', `/${campaignId}`, undefined, updates);
    }
    /**
     * Delete a campaign
     * DELETE /{campaign-id}
     */
    async deleteCampaign(campaignId) {
        return this.makeRequest('DELETE', `/${campaignId}`);
    }
    /**
     * Create an ad set
     * POST /{ad-account-id}/adsets
     */
    async createAdSet(accountId, adSetData) {
        return this.makeRequest('POST', `/${accountId}/adsets`, undefined, adSetData);
    }
    /**
     * Update an ad set
     * POST /{ad-set-id}
     */
    async updateAdSet(adSetId, updates) {
        return this.makeRequest('POST', `/${adSetId}`, undefined, updates);
    }
    /**
     * Delete an ad set
     * DELETE /{ad-set-id}
     */
    async deleteAdSet(adSetId) {
        return this.makeRequest('DELETE', `/${adSetId}`);
    }
    /**
     * Create an ad
     * POST /{ad-account-id}/ads
     */
    async createAd(accountId, adData) {
        return this.makeRequest('POST', `/${accountId}/ads`, undefined, adData);
    }
    /**
     * Update an ad
     * POST /{ad-id}
     */
    async updateAd(adId, updates) {
        return this.makeRequest('POST', `/${adId}`, undefined, updates);
    }
    /**
     * Delete an ad
     * DELETE /{ad-id}
     */
    async deleteAd(adId) {
        return this.makeRequest('DELETE', `/${adId}`);
    }
    /**
     * Get Instagram accounts connected/authorized for use with an ad account
     * GET /{ad-account-id}/connected_instagram_accounts
     * Requires: ads_read scope
     * Returns the list of Instagram User IDs that are authorized to run ads
     * via this ad account (linked through a Facebook Page or Business Manager).
     */
    async getConnectedInstagramAccounts(accountId) {
        const normalizedAccountId = this.normalizeAccountId(accountId);
        return this.makeRequest('GET', `/${normalizedAccountId}/connected_instagram_accounts`, {
            fields: 'id,username,name,profile_pic',
        });
    }
}
