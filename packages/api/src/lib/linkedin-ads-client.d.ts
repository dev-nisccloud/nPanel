import { type LinkedInApiConfig } from "./linkedin-client";
/**
 * LinkedIn Ads API Client
 * Specialized client for LinkedIn Marketing API (Ads API)
 * Uses REST API endpoints for ad accounts, campaign groups, campaigns, and creatives
 */
export declare class LinkedInAdsClient {
    private config;
    private debugEnabled;
    private static unsupportedStrategyCache;
    constructor(config: LinkedInApiConfig);
    private extractAccountId;
    private normalizeElements;
    private isUnsupportedCreativePreviewError;
    private toLinkedInList;
    private toLinkedInListEncoded;
    private toQueryValue;
    private buildAdAnalyticsQuery;
    private formatAnalyticsDateRange;
    private flattenAnalyticsDateRange;
    private ensureUrn;
    private maskAccessToken;
    private safeSerialize;
    private debugLog;
    private makeStrategyCacheKey;
    private isStrategyUnsupported;
    private markStrategyUnsupported;
    /**
     * Make HTTP request to LinkedIn Marketing API
     */
    private makeRequest;
    /**
     * List accessible ad accounts
     * GET /rest/adAccountsV2
     */
    getAdAccounts(options?: {
        fields?: string[];
        start?: number;
        count?: number;
    }): Promise<{
        elements: Array<{
            id: string;
            name?: string;
            currency?: string;
            timezone?: string;
            status?: string;
            accountStatus?: string;
            servingStatuses?: string[];
            reference?: string;
            type?: string;
        }>;
        paging?: {
            count?: number;
            start?: number;
            links?: Array<{
                rel: string;
                href: string;
            }>;
        };
    }>;
    /**
     * Get ad account details
     * GET /rest/adAccountsV2/{id}
     */
    getAdAccountDetails(accountId: string, fields?: string[]): Promise<{
        id: string;
        name?: string;
        currency?: string;
        timezone?: string;
        status?: string;
        accountStatus?: string;
        servingStatuses?: string[];
        reference?: string;
        type?: string;
    }>;
    /**
     * List campaign groups for an ad account
     * GET /rest/adCampaignGroupsV2
     */
    getCampaignGroups(accountUrn: string, options?: {
        fields?: string[];
        pageSize?: number;
        pageToken?: string;
    }): Promise<{
        elements: Array<any>;
        paging?: {
            count?: number;
            start?: number;
            links?: Array<{
                rel: string;
                href: string;
            }>;
        };
    }>;
    /**
     * Get campaign group details
     * GET /rest/adCampaignGroupsV2/{id}
     */
    getCampaignGroupDetails(campaignGroupId: string, accountIdOrUrn: string): Promise<any>;
    /**
     * List campaigns (ad sets) for a campaign group
     * GET /rest/adCampaignsV2
     */
    getCampaigns(campaignGroupUrn: string, accountIdOrUrn: string, options?: {
        fields?: string[];
        pageSize?: number;
        pageToken?: string;
    }): Promise<{
        elements: Array<any>;
        paging?: {
            count?: number;
            start?: number;
            links?: Array<{
                rel: string;
                href: string;
            }>;
        };
    }>;
    /**
     * Get campaign details
     * GET /rest/adCampaignsV2/{id}
     */
    getCampaignDetails(campaignId: string, accountIdOrUrn: string): Promise<any>;
    /**
     * List creatives (ads) for a campaign
     * GET /rest/adCreativesV2
     */
    getCreatives(campaignUrn: string, accountIdOrUrn: string, options?: {
        fields?: string[];
        pageSize?: number;
        pageToken?: string;
    }): Promise<{
        elements: Array<any>;
        paging?: {
            count?: number;
            start?: number;
            links?: Array<{
                rel: string;
                href: string;
            }>;
        };
    }>;
    getAccountCreatives(accountIdOrUrn: string, options?: {
        pageSize?: number;
        pageToken?: string;
        sortOrder?: 'ASCENDING' | 'DESCENDING';
    }): Promise<{
        elements: Array<any>;
        paging?: any;
        metadata?: {
            nextPageToken?: string | null;
        };
    }>;
    getCreativePreviews(accountIdOrUrn: string, creativeUrnOrId: string): Promise<{
        elements: Array<{
            preview?: string;
            creative?: string;
            placement?: any;
        }>;
        paging?: any;
        unsupportedCreativeType?: boolean;
    }>;
    getLiveCreativePreviews(creative: {
        campaign: string;
        intendedStatus?: string;
        content?: {
            reference?: string;
            [key: string]: any;
        } | null;
        inlineContent?: Record<string, any> | null;
    }): Promise<{
        elements: Array<{
            preview?: string;
            placement?: any;
        }>;
        paging?: any;
        notImplemented?: boolean;
    }>;
    /**
     * Get creative details
     * GET /rest/adCreativesV2/{id}
     */
    getCreativeDetails(creativeId: string, accountIdOrUrn: string): Promise<any>;
    /**
     * Get analytics (performance metrics)
     * GET /rest/adAnalyticsV2
     * Supports analytics for accounts, campaign groups, campaigns, and creatives
     */
    getAnalytics(options: {
        dateRange: {
            start: {
                year: number;
                month: number;
                day: number;
            };
            end: {
                year: number;
                month: number;
                day: number;
            };
        };
        pivots?: Array<{
            pivot: string;
            pivotValues?: string[];
        }>;
        timeGranularity?: 'ALL' | 'DAILY' | 'MONTHLY';
        accounts?: string[];
        campaignGroups?: string[];
        campaigns?: string[];
        creatives?: string[];
        fields?: string[];
    }): Promise<{
        elements: Array<{
            dateRange: {
                start: {
                    year: number;
                    month: number;
                    day: number;
                };
                end: {
                    year: number;
                    month: number;
                    day: number;
                };
            };
            pivot?: string;
            pivotValue?: string;
            impressions?: number;
            clicks?: number;
            costInLocalCurrency?: number;
            externalWebsiteConversions?: number;
            oneClickLeads?: number;
            oneClickLeadFormOpens?: number;
            opens?: number;
            sends?: number;
            revenue?: number;
            videoViews?: number;
            videoCompletions?: number;
            sponsoredInMailOpens?: number;
            sponsoredInMailClicks?: number;
            sponsoredInMailSends?: number;
            sponsoredInMailCompletions?: number;
            [key: string]: any;
        }>;
    }>;
}
