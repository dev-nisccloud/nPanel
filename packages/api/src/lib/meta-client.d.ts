export interface MetaApiConfig {
    accessToken: string;
    apiVersion?: string;
    baseUrl?: string;
}
export interface MetaApiError {
    error: {
        message: string;
        type: string;
        code: number;
        error_subcode?: number;
        fbtrace_id?: string;
    };
}
export declare class MetaApiError extends Error {
    code: number;
    message: string;
    type: string;
    errorSubcode?: number | undefined;
    fbtraceId?: string | undefined;
    constructor(code: number, message: string, type: string, errorSubcode?: number | undefined, fbtraceId?: string | undefined);
}
export declare class MetaClient {
    private config;
    constructor(config: MetaApiConfig);
    /**
     * Make HTTP request to Meta Graph API
     */
    private makeRequest;
    /**
     * Get list of Pages managed by the user
     * According to v24.0 documentation:
     * - Core fields: id, name, link, username, category, category_list
     * - Picture is an edge (/picture), but can be requested as nested field
     * - Access token is returned if user has role on the page
     */
    getPages(fields?: string[]): Promise<any>;
    /**
     * Get page content (posts, photos, videos, etc.)
     */
    getPageContent(pageId: string, contentType?: 'posts' | 'photos' | 'videos' | 'events', options?: {
        fields?: string[];
        limit?: number;
        since?: string;
        until?: string;
    }): Promise<any>;
    /**
     * Get a specific page by ID
     * According to v24.0 documentation:
     * - Core fields: id, name, link, username, category, category_list
     * - Picture is an edge (/picture), but can be requested as nested field
     * - Page access token may be required for certain fields
     */
    getPage(pageId: string, fields?: string[]): Promise<any>;
    /**
     * Get page insights/analytics
     * According to v24.0 documentation:
     * - Requires read_insights permission
     * - Valid metrics: page_views_total, page_post_engagements, page_impressions_unique (if available)
     * - Note: page_impressions and page_fans were deprecated in Nov 2025
     * - Note: Metrics with * suffix are refreshed several times during the day
     * - Returns time-series data for the specified period
     * - Page Insights data is only available on Pages with 100 or more likes
     */
    getPageInsights(pageId: string, metrics?: string[], period?: 'day' | 'week' | 'days_28', since?: string, until?: string): Promise<any>;
    /**
     * Get post engagement metrics (likes count)
     * Note: Engagement metrics must be fetched separately in v24.0
     */
    getPostLikes(postId: string): Promise<any>;
    /**
     * Get post engagement metrics (comments count)
     * Note: Engagement metrics must be fetched separately in v24.0
     */
    getPostComments(postId: string, limit?: number): Promise<any>;
    /**
     * Get post engagement metrics (shares count)
     * Note: Engagement metrics must be fetched separately in v24.0
     */
    getPostShares(postId: string): Promise<any>;
    /**
     * Get post engagement metrics (all: likes, comments, shares)
     * Convenience method to fetch all engagement metrics at once
     */
    getPostEngagement(postId: string): Promise<{
        likes: {
            count: number;
        };
        comments: {
            count: number;
        };
        shares: {
            count: number;
        };
    }>;
    /**
     * Publish a post to a Facebook Page
     * According to Meta Graph API v24.0:
     * - Text post: POST /{page-id}/feed with message
     * - Photo post: POST /{page-id}/photos with url, then POST /{page-id}/feed with attached_media
     * - Video post: POST /{page-id}/videos with file_url
     * - Multiple photos: Upload each photo, get photo IDs, then POST /{page-id}/feed with attached_media array
     *
     * Requires pages_manage_posts permission
     */
    publishPost(pageId: string, options: {
        message?: string;
        photos?: Array<{
            url: string;
            caption?: string;
        }>;
        video?: {
            file_url: string;
            description?: string;
        };
        scheduledPublishTime?: number;
        published?: boolean;
    }): Promise<any>;
}
/**
 * Create a Meta API client instance
 */
export declare function createMetaClient(accessToken: string, apiVersion?: string): MetaClient;
