export interface LinkedInApiConfig {
    accessToken: string;
    apiVersion?: string;
    baseUrl?: string;
}
export interface LinkedInApiError {
    serviceErrorCode?: number;
    message: string;
    status: number;
}
export declare class LinkedInApiError extends Error {
    status: number;
    message: string;
    serviceErrorCode?: number | undefined;
    constructor(status: number, message: string, serviceErrorCode?: number | undefined);
}
export declare class LinkedInClient {
    private config;
    constructor(config: LinkedInApiConfig);
    /**
     * Make HTTP request to LinkedIn API
     */
    private makeRequest;
    /**
     * Get list of organizations (pages) managed by the user
     * Uses organizationalEntityAcls endpoint to get organizations where user is ADMINISTRATOR
     */
    getOrganizations(): Promise<any>;
    /**
     * Get a specific organization by ID
     */
    getOrganization(orgId: string): Promise<any>;
    /**
     * Register media upload for LinkedIn
     * Returns upload URL and asset URN
     */
    registerUpload(options: {
        owner: string;
        recipes: string[];
        serviceRelationships: Array<{
            relationshipType: string;
            identifier: string;
        }>;
    }): Promise<{
        value: {
            uploadUrl: string;
            asset: string;
        };
    }>;
    /**
     * Upload media file to LinkedIn
     * Note: This uses the upload URL directly, not through makeRequest
     */
    uploadMedia(uploadUrl: string, fileBuffer: Buffer, contentType: string): Promise<void>;
    /**
     * Publish a post to a LinkedIn Organization
     * According to LinkedIn API:
     * - Text post: POST /rest/posts with commentary
     * - Photo post: Register upload, upload file, then POST /rest/posts with media
     * - Video post: Register upload, upload file, then POST /rest/posts with media
     * - Multiple photos: Upload each, get asset URNs, then POST /rest/posts with media array
     *
     * Requires w_organization_social permission
     *
     * Returns the post ID from the x-restli-id header
     */
    publishPost(orgId: string, options: {
        commentary?: string;
        media?: Array<{
            mediaUrn: string;
        }>;
        visibility?: 'PUBLIC' | 'CONNECTIONS';
        scheduledPublishTime?: number;
    }): Promise<{
        id: string;
        statusCode: number;
        headers: Record<string, string>;
    }>;
    /**
     * Get user info (for authentication)
     */
    getUserInfo(): Promise<{
        sub: string;
        name: string;
        picture?: string;
    }>;
    /**
     * Get user profile (for vanity name)
     */
    getUserProfile(): Promise<{
        vanityName: string;
    }>;
}
/**
 * Create a LinkedIn API client instance
 */
export declare function createLinkedInClient(accessToken: string, apiVersion?: string): LinkedInClient;
