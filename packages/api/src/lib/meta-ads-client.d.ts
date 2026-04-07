export interface MetaAdsApiConfig {
    accessToken: string;
    apiVersion?: string;
    baseUrl?: string;
}
export interface MetaAdsApiError {
    error: {
        message: string;
        type: string;
        code: number;
        error_subcode?: number;
        fbtrace_id?: string;
    };
}
export declare class MetaAdsApiError extends Error {
    code: number;
    message: string;
    type: string;
    errorSubcode?: number | undefined;
    fbtraceId?: string | undefined;
    constructor(code: number, message: string, type: string, errorSubcode?: number | undefined, fbtraceId?: string | undefined);
}
/**
 * Meta Ads API Client
 * Specialized client for Meta Marketing API (Ads API)
 * Uses Graph API endpoints for ad accounts, campaigns, ad sets, and ads
 */
export declare class MetaAdsClient {
    private config;
    constructor(config: MetaAdsApiConfig);
    /**
     * Normalize account ID to ensure it has the 'act_' prefix
     * Meta API requires account IDs in format: act_123456789
     */
    private normalizeAccountId;
    /**
     * Make HTTP request to Meta Marketing API
     */
    private makeRequest;
    /**
     * List accessible ad accounts
     * GET /me/adaccounts
     */
    getAdAccounts(fields?: string[]): Promise<{
        data: Array<{
            account_id: string;
            name?: string;
            currency?: string;
            timezone_name?: string;
            account_status?: number;
            spend_cap?: string;
            amount_spent?: string;
            balance?: string;
        }>;
        paging?: {
            cursors?: {
                before?: string;
                after?: string;
            };
            next?: string;
            previous?: string;
        };
    }>;
    /**
     * Get ad account details
     * GET /{ad-account-id}
     */
    getAdAccountDetails(accountId: string, fields?: string[]): Promise<{
        account_id: string;
        name?: string;
        currency?: string;
        timezone_name?: string;
        account_status?: number;
        spend_cap?: string;
        amount_spent?: string;
        balance?: string;
    }>;
    /**
     * List campaigns for an ad account
     * GET /{ad-account-id}/campaigns
     */
    getCampaigns(accountId: string, options?: {
        fields?: string[];
        limit?: number;
        after?: string;
        filtering?: Array<{
            field: string;
            operator: string;
            value: any;
        }>;
    }): Promise<{
        data: Array<any>;
        paging?: {
            cursors?: {
                before?: string;
                after?: string;
            };
            next?: string;
            previous?: string;
        };
    }>;
    /**
     * Get campaign details
     * GET /{campaign-id}
     */
    getCampaignDetails(campaignId: string, fields?: string[]): Promise<any>;
    /**
     * List ad sets (optionally filtered by campaign)
     * GET /{ad-account-id}/adsets or GET /{campaign-id}/adsets
     */
    getAdSets(parentId: string, options?: {
        fields?: string[];
        limit?: number;
        after?: string;
        filtering?: Array<{
            field: string;
            operator: string;
            value: any;
        }>;
    }): Promise<{
        data: Array<any>;
        paging?: {
            cursors?: {
                before?: string;
                after?: string;
            };
            next?: string;
            previous?: string;
        };
    }>;
    /**
     * Get ad set details
     * GET /{ad-set-id}
     */
    getAdSetDetails(adSetId: string, fields?: string[]): Promise<any>;
    /**
     * Get human-readable targeting description for an ad set
     * GET /{ad-set-id}/targetingsentencelines
     * Returns lines like "Location - Living In: Japan, United States", "Age: 20 - 24", etc.
     */
    getTargetingSentenceLines(adSetId: string): Promise<{
        targetingsentencelines?: Array<{
            content: string;
            children?: string[];
        }>;
    }>;
    /**
     * List ads (optionally filtered by ad set)
     * GET /{ad-account-id}/ads or GET /{ad-set-id}/ads
     */
    getAds(parentId: string, options?: {
        fields?: string[];
        limit?: number;
        after?: string;
        filtering?: Array<{
            field: string;
            operator: string;
            value: any;
        }>;
    }): Promise<{
        data: Array<any>;
        paging?: {
            cursors?: {
                before?: string;
                after?: string;
            };
            next?: string;
            previous?: string;
        };
    }>;
    /**
     * Get ad details
     * GET /{ad-id}
     */
    getAdDetails(adId: string, fields?: string[]): Promise<any>;
    /**
     * Get insights (performance metrics)
     * GET /{entity-id}/insights
     * Supports levels: account, campaign, adset, ad
     */
    getInsights(entityId: string, options?: {
        level?: 'account' | 'campaign' | 'adset' | 'ad';
        metrics?: string[];
        datePreset?: string;
        timeRange?: {
            since: string;
            until: string;
        };
        timeIncrement?: number | 'all_days';
        breakdowns?: string[];
        limit?: number;
        after?: string;
    }): Promise<{
        data: Array<any>;
        paging?: {
            cursors?: {
                before?: string;
                after?: string;
            };
            next?: string;
            previous?: string;
        };
    }>;
    /**
     * Create a campaign
     * POST /{ad-account-id}/campaigns
     */
    createCampaign(accountId: string, campaignData: {
        name: string;
        objective: string;
        status?: string;
        daily_budget?: string;
        lifetime_budget?: string;
        start_time?: string;
        stop_time?: string;
    }): Promise<{
        id: string;
    }>;
    /**
     * Update a campaign
     * POST /{campaign-id}
     */
    updateCampaign(campaignId: string, updates: {
        name?: string;
        status?: string;
        daily_budget?: string;
        lifetime_budget?: string;
        start_time?: string;
        stop_time?: string;
    }): Promise<{
        success: boolean;
    }>;
    /**
     * Delete a campaign
     * DELETE /{campaign-id}
     */
    deleteCampaign(campaignId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Create an ad set
     * POST /{ad-account-id}/adsets
     */
    createAdSet(accountId: string, adSetData: {
        name: string;
        campaign_id: string;
        status?: string;
        daily_budget?: string;
        lifetime_budget?: string;
        billing_event?: string;
        bid_amount?: string;
        targeting?: any;
        start_time?: string;
        stop_time?: string;
    }): Promise<{
        id: string;
    }>;
    /**
     * Update an ad set
     * POST /{ad-set-id}
     */
    updateAdSet(adSetId: string, updates: {
        name?: string;
        status?: string;
        daily_budget?: string;
        lifetime_budget?: string;
        bid_amount?: string;
        targeting?: any;
        start_time?: string;
        stop_time?: string;
    }): Promise<{
        success: boolean;
    }>;
    /**
     * Delete an ad set
     * DELETE /{ad-set-id}
     */
    deleteAdSet(adSetId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Create an ad
     * POST /{ad-account-id}/ads
     */
    createAd(accountId: string, adData: {
        name: string;
        adset_id: string;
        status?: string;
        creative?: any;
    }): Promise<{
        id: string;
    }>;
    /**
     * Update an ad
     * POST /{ad-id}
     */
    updateAd(adId: string, updates: {
        name?: string;
        status?: string;
        creative?: any;
    }): Promise<{
        success: boolean;
    }>;
    /**
     * Delete an ad
     * DELETE /{ad-id}
     */
    deleteAd(adId: string): Promise<{
        success: boolean;
    }>;
}
