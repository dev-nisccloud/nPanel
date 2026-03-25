import { request } from 'undici';
import { MetaErrorHandler } from './meta-error-handler';

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

export class MetaApiError extends Error {
	constructor(
		public code: number,
		public message: string,
		public type: string,
		public errorSubcode?: number,
		public fbtraceId?: string
	) {
		super(`Meta API Error ${code}: ${message}`);
		this.name = 'MetaApiError';
	}
}

export class MetaClient {
	private config: Required<MetaApiConfig>;

		constructor(config: MetaApiConfig) {
		this.config = {
			accessToken: config.accessToken,
			apiVersion: config.apiVersion || 'v24.0',
			baseUrl: config.baseUrl || 'https://graph.facebook.com',
		};
	}

	/**
	 * Make HTTP request to Meta Graph API
	 */
	private async makeRequest<T>(
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		endpoint: string,
		params?: Record<string, any>,
		body?: any
	): Promise<T> {
		const url = new URL(`${this.config.baseUrl}/${this.config.apiVersion}${endpoint}`);

		// Add access token to params
		url.searchParams.set('access_token', this.config.accessToken);

		// Add additional params
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				if (value !== undefined && value !== null) {
					if (Array.isArray(value)) {
						url.searchParams.set(key, value.join(','));
					} else if (typeof value === 'object') {
						url.searchParams.set(key, JSON.stringify(value));
					} else {
						url.searchParams.set(key, String(value));
					}
				}
			}
		}

		const requestOptions: any = {
			method,
			headers: {
				'Content-Type': 'application/json',
			},
		};

		if (body && (method === 'POST' || method === 'PUT')) {
			requestOptions.body = JSON.stringify(body);
		}

		try {
			// Debug logging for posts/feed endpoints to identify deprecation issues
			if (endpoint.includes('/posts') || endpoint.includes('/feed')) {
				console.log('[Meta API Debug] Endpoint:', endpoint);
				console.log('[Meta API Debug] Full Request URL:', url.toString());
				console.log('[Meta API Debug] Fields param:', params?.fields);
				console.log('[Meta API Debug] API Version:', this.config.apiVersion);
			}
			
			const response = await request(url.toString(), requestOptions);
			const responseData = (await response.body.json()) as unknown;

			// Check for API errors
			if (
				typeof responseData === 'object' &&
				responseData !== null &&
				'error' in responseData
			) {
				const error = (responseData as { error: MetaApiError['error'] }).error;
				const metaError = new MetaApiError(
					error.code,
					error.message,
					error.type,
					error.error_subcode,
					error.fbtrace_id
				);

				// Use error handler to get user-friendly message
				const errorInfo = MetaErrorHandler.handleError(metaError);
				if (errorInfo) {
					// Enhance error with handler information
					(metaError as any).errorType = errorInfo.type;
					(metaError as any).userMessage = errorInfo.message;
					throw metaError;
				}

				throw metaError;
			}

			return responseData as T;
		} catch (error) {
			if (error instanceof MetaApiError) {
				// Ensure error has handler information
				if (!(error as any).errorType) {
					const errorInfo = MetaErrorHandler.handleError(error);
					if (errorInfo) {
						(error as any).errorType = errorInfo.type;
						(error as any).userMessage = errorInfo.message;
					}
				}
				throw error;
			}

			if (error instanceof Error) {
				// Try to handle as Meta API error
				const errorInfo = MetaErrorHandler.handleError(error);
				if (errorInfo) {
					const metaError = new MetaApiError(
						500,
						errorInfo.message,
						'UnknownError'
					);
					(metaError as any).errorType = errorInfo.type;
					(metaError as any).userMessage = errorInfo.message;
					throw metaError;
				}

				throw new MetaApiError(
					500,
					`Request failed: ${error.message}`,
					'UnknownError'
				);
			}

			throw new MetaApiError(500, 'Unknown error occurred', 'UnknownError');
		}
	}

	/**
	 * Get list of Pages managed by the user
	 * According to v24.0 documentation:
	 * - Core fields: id, name, link, username, category, category_list
	 * - Picture is an edge (/picture), but can be requested as nested field
	 * - Access token is returned if user has role on the page
	 */
	async getPages(fields?: string[]): Promise<any> {
		// v24.0 compatible fields - Core and commonly used fields
		// All available with pages_show_list, pages_read_engagement, pages_read_user_content permissions
		const defaultFields = [
			'id',                    // Core - The ID representing a Facebook Page
			'name',                  // Core - The name of the Page
			'link',                  // Core - The Page's Facebook URL
			'username',              // Core - The alias of the Page
			'category',              // Core - The Page's category
			'category_list',         // Core - The Page's sub-categories
			'access_token',          // The Page's access token (if user has role)
			'picture{url,width,height}', // Profile picture (edge as nested field)
			'cover{source,offset_y}',     // Cover photo information
			'about',                 // Information about the Page
			'description',           // The description of the Page
			'website',               // The URL of the Page's website
			'phone',                 // Phone number provided by a Page
			'emails',                // The emails listed in the About section
			'location',              // The location of this place
			'fan_count',             // The number of users who like the Page
			'followers_count',       // Number of page followers
			'talking_about_count',  // The number of people talking about this Page
			'verification_status',  // Showing whether this Page is verified
			'is_verified',          // Deprecated - use verification_status instead
		];

		const fieldsToFetch = fields || defaultFields;

		return this.makeRequest<any>('GET', '/me/accounts', {
			fields: fieldsToFetch.join(','),
		});
	}

	/**
	 * Get page content (posts, photos, videos, etc.)
	 */
	async getPageContent(
		pageId: string,
		contentType: 'posts' | 'photos' | 'videos' | 'events' = 'posts',
		options?: {
			fields?: string[];
			limit?: number;
			since?: string;
			until?: string;
		}
	): Promise<any> {
		// v24.0 compatible fields - Based on Page Post and Page Feed documentation
		// Using only fields explicitly documented in v24.0 Page Post/Feed reference
		// Note: /feed edge returns Edge<PagePost> - "This Page's feed. Can be read with Page Public Content Access."
		// According to Page Feed docs, attachments field is available and contains media
		// Story Attachment docs show: media, media_type, type, subattachments for multiple items
		const defaultFieldsMap: Record<'posts' | 'photos' | 'videos' | 'events', string[]> = {
			posts: [
				'id',                    // The post ID (token with structure: Post ID)
				'message',               // The message written in the post (Default)
				'story',                 // Text of stories (Default)
				'created_time',          // The time the post was published (Default)
				'permalink_url',         // The permanent static URL to the post
				'full_picture',          // Full size picture from attachment (documented in Page Post)
				// Engagement metrics - v24.0 format
				'likes.summary(true).limit(0)',   // Total likes count (returns {summary: {total_count: number}})
				'comments.summary(true).limit(0)', // Total comments count (returns {summary: {total_count: number}})
				'shares',                // Shares count (returns {count: number})
				// Attachments with nested fields for media content (photos/videos)
				// Using nested syntax to get media details without triggering deprecation
				'attachments{media,media_type,type,subattachments{media,media_type,type}}',
				// Note: We're using the nested field syntax which should be safe
				// Removed fields that trigger attachment processing:
				// 'type' - may trigger attachment processing (but we get it from attachments.type)
				// 'status_type' - may trigger attachment processing
				// 'picture' - PagePost uses 'full_picture' not 'picture'
				// 'from' - may trigger attachment processing
			],
			photos: [
				'id',                    // Photo ID (numeric string)
				'name',                  // Photo caption (Default) - user-provided caption
				'images',                // Array of different stored representations (PlatformImageSource)
				'created_time',          // When photo was published (Default)
				'updated_time',          // When photo was last updated
				'link',                  // Link to the photo on Facebook
				'webp_images',           // WebP format representations (optional, for better performance)
				'height',                // Height of photo in pixels
				'width',                 // Width of photo in pixels
				// Note: According to Photo docs:
				// - 'images' is the key field for actual photo sizes (list<PlatformImageSource>)
				// - 'picture' edge returns 100px wide representation (we can use images instead)
				// - 'source' is deprecated, use 'images' instead
			],
			videos: [
				'id',
				'description',
				'created_time',
				'updated_time',
				'length',
				'picture',
				'source',
				'from',
			],
			events: [
				'id',
				'name',
				'description',
				'start_time',
				'end_time',
				'place',
				'attending_count',
				'declined_count',
				'interested_count',
				'maybe_count',
				'noreply_count',
				'ticket_uri',
			],
		};

		const defaultFields = defaultFieldsMap[contentType] ?? defaultFieldsMap.posts;
		const fieldsToFetch: string[] = options?.fields ?? defaultFields;

		// Build fields parameter - handle nested fields properly
		// For posts/feed, use only documented safe fields to avoid deprecation errors
		let fieldsParam = fieldsToFetch.join(',');
		
		// Remove fields that trigger attachment processing (deprecated in v3.3+)
		// According to v24.0 Page Post docs, these fields trigger internal attachment processing:
		if (contentType === 'posts') {
			const problematicFields = [
				'picture',               // Not in PagePost docs, use full_picture instead
			];
			// Note: 
			// - full_picture is documented in Page Post and should be safe
			// - attachments{...} with nested syntax is documented in Page Feed and should be safe
			// - likes.summary(true).limit(0) and comments.summary(true).limit(0) are the correct v24.0 format for engagement
			// - shares is a simple field that returns {count: number}
			// - We only filter out plain 'attachments' without nested syntax, not 'attachments{...}'
			fieldsParam = fieldsToFetch
				.filter(field => {
					// Allow attachments with nested syntax (attachments{...})
					if (field.includes('attachments{')) {
						return true;
					}
					// Allow engagement fields with proper v24.0 format
					if (field.includes('likes.summary(true)') || field.includes('comments.summary(true)') || field === 'shares') {
						return true;
					}
					// Filter out problematic fields
					return !problematicFields.some(pf => field.includes(pf));
				})
				.join(',');
		}

		const params: Record<string, any> = {
			fields: fieldsParam,
		};

		if (options?.limit) {
			params.limit = options.limit;
		}

		if (options?.since) {
			params.since = options.since;
		}

		if (options?.until) {
			params.until = options.until;
		}

		// Use /feed endpoint for posts instead of /posts to avoid v24.0 deprecation issues
		// The /feed endpoint is the recommended way to get page posts
		let endpoint = `/${pageId}/${contentType}`;
		if (contentType === 'posts') {
			endpoint = `/${pageId}/feed`;
		}
		
		return this.makeRequest<any>('GET', endpoint, params);
	}

	/**
	 * Get a specific page by ID
	 * According to v24.0 documentation:
	 * - Core fields: id, name, link, username, category, category_list
	 * - Picture is an edge (/picture), but can be requested as nested field
	 * - Page access token may be required for certain fields
	 */
	async getPage(pageId: string, fields?: string[]): Promise<any> {
		// v24.0 compatible fields - Core and extended fields
		// All available with appropriate permissions (pages_read_engagement, pages_read_user_content, etc.)
		const defaultFields = [
			// Core fields
			'id',                    // Core - The ID representing a Facebook Page
			'name',                  // Core - The name of the Page
			'link',                  // Core - The Page's Facebook URL
			'username',              // Core - The alias of the Page
			'category',              // Core - The Page's category
			'category_list',         // Core - The Page's sub-categories
			
			// Media fields (edges as nested fields)
			'picture{url,width,height}', // Profile picture (edge as nested field)
			'cover{source,offset_y}',     // Cover photo information
			
			// Basic information (About section)
			'about',                 // Information about the Page
			'description',           // The description of the Page
			'website',               // The URL of the Page's website
			'phone',                 // Phone number provided by a Page
			'emails',                // The emails listed in the About section
			'location',              // The location of this place
			
			// Engagement metrics (for analytics section)
			'fan_count',             // The number of users who like the Page
			'followers_count',       // Number of page followers
			'talking_about_count',  // The number of people talking about this Page
		];

		const fieldsToFetch = fields || defaultFields;

		return this.makeRequest<any>('GET', `/${pageId}`, {
			fields: fieldsToFetch.join(','),
		});
	}

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
	async getPageInsights(
		pageId: string,
		metrics: string[] = [
			'page_views_total',
			'page_post_engagements',
			'page_impressions_unique',
			'page_posts_impressions',
			'page_posts_impressions_unique',
			'page_video_views',
			'page_daily_follows',
		],
		period: 'day' | 'week' | 'days_28' = 'day',
		since?: string,
		until?: string
	): Promise<any> {
		const params: Record<string, any> = {
			metric: metrics.join(','),
			period,
		};

		if (since) {
			params.since = since;
		}

		if (until) {
			params.until = until;
		}

		return this.makeRequest<any>('GET', `/${pageId}/insights`, params);
	}

	/**
	 * Get post engagement metrics (likes count)
	 * Note: Engagement metrics must be fetched separately in v24.0
	 */
	async getPostLikes(postId: string): Promise<any> {
		return this.makeRequest<any>('GET', `/${postId}/likes`, {
			summary: 'true',
			limit: 0, // We only want the summary, not individual likes
		});
	}

	/**
	 * Get post engagement metrics (comments count)
	 * Note: Engagement metrics must be fetched separately in v24.0
	 */
	async getPostComments(postId: string, limit: number = 0): Promise<any> {
		return this.makeRequest<any>('GET', `/${postId}/comments`, {
			summary: 'true',
			limit,
		});
	}

	/**
	 * Get post engagement metrics (shares count)
	 * Note: Engagement metrics must be fetched separately in v24.0
	 */
	async getPostShares(postId: string): Promise<any> {
		return this.makeRequest<any>('GET', `/${postId}`, {
			fields: 'shares',
		});
	}

	/**
	 * Get post engagement metrics (all: likes, comments, shares)
	 * Convenience method to fetch all engagement metrics at once
	 */
	async getPostEngagement(postId: string): Promise<{
		likes: { count: number };
		comments: { count: number };
		shares: { count: number };
	}> {
		const [likesResponse, commentsResponse, sharesResponse] = await Promise.all([
			this.getPostLikes(postId).catch(() => ({ summary: { total_count: 0 } })),
			this.getPostComments(postId).catch(() => ({ summary: { total_count: 0 } })),
			this.getPostShares(postId).catch(() => ({ shares: { count: 0 } })),
		]);

		return {
			likes: {
				count: likesResponse.summary?.total_count || 0,
			},
			comments: {
				count: commentsResponse.summary?.total_count || 0,
			},
			shares: {
				count: sharesResponse.shares?.count || 0,
			},
		};
	}

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
	async publishPost(
		pageId: string,
		options: {
			message?: string;
			photos?: Array<{ url: string; caption?: string }>;
			video?: { file_url: string; description?: string };
			scheduledPublishTime?: number; // Unix timestamp
			published?: boolean; // Default: true
		}
	): Promise<any> {
		const { message, photos, video, scheduledPublishTime, published = true } = options;

		// Validate that we have at least message, photos, or video
		if (!message && (!photos || photos.length === 0) && !video) {
			throw new MetaApiError(
				400,
				'At least one of message, photos, or video must be provided',
				'InvalidRequest'
			);
		}

		// If we have photos, upload them first and get photo IDs
		let photoIds: string[] = [];
		if (photos && photos.length > 0) {
			// Upload each photo
			for (const photo of photos) {
				try {
					const photoResponse = await this.makeRequest<any>(
						'POST',
						`/${pageId}/photos`,
						undefined,
						{
							url: photo.url,
							caption: photo.caption || message || '',
							published: false, // Don't publish yet, we'll attach to feed post
						}
					);
					if (photoResponse.id) {
						photoIds.push(photoResponse.id);
					}
				} catch (error) {
					console.error('Error uploading photo:', error);
					throw error;
				}
			}
		}

		// Prepare feed post data
		const feedData: Record<string, any> = {};

		if (message) {
			feedData.message = message;
		}

		// Attach photos if we have any
		if (photoIds.length > 0) {
			feedData.attached_media = photoIds.map(id => ({ media_fbid: id }));
		}

		// Handle video (videos are published directly, not attached to feed)
		if (video) {
			const videoResponse = await this.makeRequest<any>(
				'POST',
				`/${pageId}/videos`,
				undefined,
				{
					file_url: video.file_url,
					description: video.description || message || '',
					published,
					scheduled_publish_time: scheduledPublishTime,
				}
			);
			return videoResponse;
		}

		// Schedule post if scheduledPublishTime is provided
		if (scheduledPublishTime) {
			feedData.scheduled_publish_time = scheduledPublishTime;
			feedData.published = false;
		} else {
			feedData.published = published;
		}

		// Publish the feed post
		const response = await this.makeRequest<any>(
			'POST',
			`/${pageId}/feed`,
			undefined,
			feedData
		);

		return response;
	}
}

/**
 * Create a Meta API client instance
 */
export function createMetaClient(accessToken: string, apiVersion?: string): MetaClient {
	return new MetaClient({
		accessToken,
		apiVersion,
	});
}

