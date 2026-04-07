import { request } from 'undici';
import { LinkedInErrorHandler } from './linkedin-error-handler';
export class LinkedInApiError extends Error {
    status;
    message;
    serviceErrorCode;
    constructor(status, message, serviceErrorCode) {
        super(`LinkedIn API Error ${status}: ${message}`);
        this.status = status;
        this.message = message;
        this.serviceErrorCode = serviceErrorCode;
        this.name = 'LinkedInApiError';
    }
}
export class LinkedInClient {
    config;
    constructor(config) {
        this.config = {
            accessToken: config.accessToken,
            apiVersion: config.apiVersion || '202603',
            baseUrl: config.baseUrl || 'https://api.linkedin.com',
        };
    }
    /**
     * Make HTTP request to LinkedIn API
     */
    async makeRequest(method, endpoint, body, headers) {
        const url = new URL(`${this.config.baseUrl}${endpoint}`);
        const requestOptions = {
            method,
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': this.config.apiVersion,
                'X-Restli-Protocol-Version': '2.0.0',
                ...headers,
            },
        };
        if (body && (method === 'POST' || method === 'PUT')) {
            requestOptions.body = JSON.stringify(body);
        }
        try {
            const response = await request(url.toString(), requestOptions);
            // Check response status code first
            if (response.statusCode && response.statusCode >= 400) {
                // Try to parse error response
                let errorData = null;
                let responseText = '';
                try {
                    // Read response body as text first
                    responseText = await response.body.text();
                    if (responseText && responseText.trim()) {
                        try {
                            errorData = JSON.parse(responseText);
                        }
                        catch (jsonError) {
                            // If JSON parsing fails, check if it's an HTML error page or plain text error
                            // LinkedIn sometimes returns HTML error pages or plain text errors
                            if (responseText.includes('BadRequestResponseException') ||
                                responseText.includes('duplicate') ||
                                responseText.includes('Content is a duplicate')) {
                                // Extract error message from text
                                const match = responseText.match(/BadRequestResponseException:\s*(.+)/i) ||
                                    responseText.match(/Content is a duplicate of (.+)/i);
                                const errorMessage = match ? match[1] || match[0] : responseText;
                                errorData = {
                                    message: errorMessage,
                                    status: response.statusCode,
                                };
                            }
                            else {
                                // Use raw text as error message
                                errorData = {
                                    message: responseText,
                                    status: response.statusCode,
                                };
                            }
                        }
                    }
                }
                catch (readError) {
                    // If reading body fails, create error from status code
                    errorData = {
                        message: `LinkedIn API error: ${response.statusCode}`,
                        status: response.statusCode,
                    };
                }
                // If we have error data, process it
                if (errorData) {
                    const linkedInError = new LinkedInApiError(errorData.status || response.statusCode || 500, errorData.message || errorData.errorDetails || `LinkedIn API error: ${response.statusCode}`, errorData.serviceErrorCode);
                    // Use error handler to get user-friendly message
                    const errorInfo = LinkedInErrorHandler.handleError(linkedInError);
                    if (errorInfo) {
                        linkedInError.errorType = errorInfo.type;
                        linkedInError.userMessage = errorInfo.message;
                    }
                    throw linkedInError;
                }
                // If no error data but status code indicates error
                const linkedInError = new LinkedInApiError(response.statusCode, `LinkedIn API error: ${response.statusCode}`, undefined);
                const errorInfo = LinkedInErrorHandler.handleError(linkedInError);
                if (errorInfo) {
                    linkedInError.errorType = errorInfo.type;
                    linkedInError.userMessage = errorInfo.message;
                }
                throw linkedInError;
            }
            // Try to parse successful response
            let responseData;
            try {
                const responseText = await response.body.text();
                if (responseText && responseText.trim()) {
                    try {
                        responseData = JSON.parse(responseText);
                    }
                    catch (jsonError) {
                        // If JSON parsing fails, check if it's an error message
                        if (responseText.includes('BadRequestResponseException') ||
                            responseText.includes('duplicate') ||
                            responseText.includes('Content is a duplicate')) {
                            // This is actually an error, throw it
                            const match = responseText.match(/BadRequestResponseException:\s*(.+)/i) ||
                                responseText.match(/Content is a duplicate of (.+)/i);
                            const errorMessage = match ? match[1] || match[0] : responseText;
                            const linkedInError = new LinkedInApiError(response.statusCode || 400, errorMessage, undefined);
                            const errorInfo = LinkedInErrorHandler.handleError(linkedInError);
                            if (errorInfo) {
                                linkedInError.errorType = errorInfo.type;
                                linkedInError.userMessage = errorInfo.message;
                            }
                            throw linkedInError;
                        }
                        // For other non-JSON responses, return empty object
                        responseData = {};
                    }
                }
                else {
                    // Empty response - might be valid for some endpoints
                    responseData = {};
                }
            }
            catch (parseError) {
                // If it's already a LinkedInApiError, re-throw it
                if (parseError instanceof LinkedInApiError) {
                    throw parseError;
                }
                // If JSON parsing fails, it might be an error response
                if (response.statusCode && response.statusCode >= 400) {
                    throw new LinkedInApiError(response.statusCode, 'Failed to parse LinkedIn API response', undefined);
                }
                // For successful responses, return empty object if parsing fails
                responseData = {};
            }
            // Check for API errors in response data
            if (typeof responseData === 'object' &&
                responseData !== null &&
                ('serviceErrorCode' in responseData || 'status' in responseData)) {
                const error = responseData;
                const linkedInError = new LinkedInApiError(error.status || response.statusCode || 500, error.message || 'LinkedIn API error', error.serviceErrorCode);
                // Use error handler to get user-friendly message
                const errorInfo = LinkedInErrorHandler.handleError(linkedInError);
                if (errorInfo) {
                    linkedInError.errorType = errorInfo.type;
                    linkedInError.userMessage = errorInfo.message;
                    throw linkedInError;
                }
                throw linkedInError;
            }
            return responseData;
        }
        catch (error) {
            if (error instanceof LinkedInApiError) {
                if (!error.errorType) {
                    const errorInfo = LinkedInErrorHandler.handleError(error);
                    if (errorInfo) {
                        error.errorType = errorInfo.type;
                        error.userMessage = errorInfo.message;
                    }
                }
                throw error;
            }
            if (error instanceof Error) {
                // Check if it's a JSON parse error
                if (error.message.includes('JSON') || error.message.includes('Unexpected end')) {
                    throw new LinkedInApiError(500, 'LinkedIn API returned an invalid response. This may indicate a duplicate post or API issue.', undefined);
                }
                const errorInfo = LinkedInErrorHandler.handleError(error);
                if (errorInfo) {
                    const linkedInError = new LinkedInApiError(500, errorInfo.message, undefined);
                    linkedInError.errorType = errorInfo.type;
                    linkedInError.userMessage = errorInfo.message;
                    throw linkedInError;
                }
                throw new LinkedInApiError(500, `Request failed: ${error.message}`);
            }
            throw new LinkedInApiError(500, 'Unknown error occurred');
        }
    }
    /**
     * Get list of organizations (pages) managed by the user
     * Uses organizationalEntityAcls endpoint to get organizations where user is ADMINISTRATOR
     */
    async getOrganizations() {
        return this.makeRequest('GET', '/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(localizedName,vanityName,logoV2(original~:playableStreams))))');
    }
    /**
     * Get a specific organization by ID
     */
    async getOrganization(orgId) {
        return this.makeRequest('GET', `/v2/organizations/${orgId}?projection=(id,localizedName,vanityName,logoV2(original~:playableStreams))`);
    }
    /**
     * Register media upload for LinkedIn
     * Returns upload URL and asset URN
     */
    async registerUpload(options) {
        const response = await this.makeRequest('POST', '/v2/assets?action=registerUpload', {
            registerUploadRequest: {
                recipes: options.recipes,
                owner: options.owner,
                serviceRelationships: options.serviceRelationships,
            },
        });
        if (!response?.value) {
            throw new LinkedInApiError(500, 'Invalid response from LinkedIn upload registration');
        }
        return response;
    }
    /**
     * Upload media file to LinkedIn
     * Note: This uses the upload URL directly, not through makeRequest
     */
    async uploadMedia(uploadUrl, fileBuffer, contentType) {
        const response = await request(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
            },
            body: fileBuffer,
        });
        // Check for errors
        if (response.statusCode && response.statusCode >= 400) {
            const errorData = (await response.body.json());
            throw new LinkedInApiError(response.statusCode, typeof errorData === 'object' && errorData !== null && 'message' in errorData
                ? errorData.message
                : 'Failed to upload media', undefined);
        }
    }
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
    async publishPost(orgId, options) {
        const { commentary = '', media = [], visibility = 'PUBLIC', scheduledPublishTime, } = options;
        // Validate that we have at least commentary or media
        if (!commentary && media.length === 0) {
            throw new LinkedInApiError(400, 'At least one of commentary or media must be provided', undefined);
        }
        const postData = {
            author: `urn:li:organization:${orgId}`,
            commentary,
            visibility,
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: scheduledPublishTime ? 'SCHEDULED' : 'PUBLISHED',
            isReshareDisabledByAuthor: false,
        };
        // Add media if provided
        if (media.length > 0) {
            const firstMedia = media[0];
            if (!firstMedia) {
                throw new LinkedInApiError(400, 'Media array is empty', undefined);
            }
            // For single media (photo or video)
            if (media.length === 1) {
                postData.content = {
                    media: {
                        id: firstMedia.mediaUrn,
                    },
                };
            }
            else {
                // For multiple photos (carousel)
                postData.content = {
                    media: {
                        id: firstMedia.mediaUrn, // Primary media
                    },
                };
                // Note: LinkedIn carousel support may vary by API version
                // For now, we'll use the first media as primary
            }
        }
        // Add scheduled time if provided
        if (scheduledPublishTime) {
            postData.scheduledPublishTime = scheduledPublishTime;
        }
        // Make the request and get the response with headers
        const url = new URL(`${this.config.baseUrl}/rest/posts`);
        const requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': this.config.apiVersion,
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify(postData),
        };
        const { request } = await import('undici');
        const response = await request(url.toString(), requestOptions);
        // Check status code - LinkedIn returns 200 or 201 for successful posts
        if (response.statusCode && response.statusCode !== 200 && response.statusCode !== 201) {
            // Try to parse error response
            let errorData = null;
            let responseText = '';
            try {
                responseText = await response.body.text();
                if (responseText && responseText.trim()) {
                    try {
                        errorData = JSON.parse(responseText);
                    }
                    catch (jsonError) {
                        // If JSON parsing fails, use raw text
                        errorData = {
                            message: responseText,
                            status: response.statusCode,
                        };
                    }
                }
            }
            catch (readError) {
                // If reading body fails, create error from status code
                errorData = {
                    message: `LinkedIn API error: ${response.statusCode}`,
                    status: response.statusCode,
                };
            }
            const linkedInError = new LinkedInApiError(errorData?.status || response.statusCode || 500, errorData?.message || `LinkedIn API error: ${response.statusCode}`, errorData?.serviceErrorCode);
            // Use error handler to get user-friendly message
            const errorInfo = LinkedInErrorHandler.handleError(linkedInError);
            if (errorInfo) {
                linkedInError.errorType = errorInfo.type;
                linkedInError.userMessage = errorInfo.message;
            }
            throw linkedInError;
        }
        // LinkedIn returns the post ID in the x-restli-id header
        const postId = response.headers['x-restli-id'];
        if (!postId) {
            // Try to read response body for ID as fallback
            try {
                const responseText = await response.body.text();
                if (responseText) {
                    const responseData = JSON.parse(responseText);
                    if (responseData.id) {
                        return {
                            id: responseData.id,
                            statusCode: response.statusCode || 200,
                            headers: response.headers,
                        };
                    }
                }
            }
            catch (parseError) {
                // Ignore parse errors
            }
            throw new LinkedInApiError(500, 'LinkedIn API did not return a post ID in the response', undefined);
        }
        return {
            id: postId,
            statusCode: response.statusCode || 200,
            headers: response.headers,
        };
    }
    /**
     * Get user info (for authentication)
     */
    async getUserInfo() {
        return this.makeRequest('GET', '/v2/userinfo');
    }
    /**
     * Get user profile (for vanity name)
     */
    async getUserProfile() {
        return this.makeRequest('GET', '/v2/me');
    }
}
/**
 * Create a LinkedIn API client instance
 */
export function createLinkedInClient(accessToken, apiVersion) {
    return new LinkedInClient({
        accessToken,
        apiVersion,
    });
}
