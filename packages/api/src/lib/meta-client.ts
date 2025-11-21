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
			apiVersion: config.apiVersion || 'v21.0',
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
	 */
	async getPages(fields?: string[]): Promise<any> {
		const defaultFields = [
			'id',
			'name',
			'category',
			'category_list',
			'access_token',
			'picture',
			'cover',
			'about',
			'description',
			'website',
			'phone',
			'emails',
			'location',
			'fan_count',
			'followers_count',
			'link',
			'verification_status',
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
		const defaultFieldsMap: Record<'posts' | 'photos' | 'videos' | 'events', string[]> = {
			posts: [
				'id',
				'message',
				'story',
				'created_time',
				'updated_time',
				'permalink_url',
				'type',
				'status_type',
				'likes',
				'comments',
				'shares',
				'attachments',
				'from',
			],
			photos: [
				'id',
				'name',
				'picture',
				'created_time',
				'updated_time',
				'link',
				'images',
				'likes',
				'comments',
			],
			videos: [
				'id',
				'description',
				'created_time',
				'updated_time',
				'length',
				'source',
				'picture',
				'likes',
				'comments',
				'shares',
			],
			events: [
				'id',
				'name',
				'description',
				'start_time',
				'end_time',
				'place',
				'cover',
				'attending_count',
				'declined_count',
				'interested_count',
			],
		};

		const defaultFields = defaultFieldsMap[contentType] ?? defaultFieldsMap.posts;
		const fieldsToFetch: string[] = options?.fields ?? defaultFields;

		const params: Record<string, any> = {
			fields: fieldsToFetch.join(','),
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

		return this.makeRequest<any>('GET', `/${pageId}/${contentType}`, params);
	}

	/**
	 * Get a specific page by ID
	 */
	async getPage(pageId: string, fields?: string[]): Promise<any> {
		const defaultFields = [
			'id',
			'name',
			'category',
			'category_list',
			'picture',
			'cover',
			'about',
			'description',
			'website',
			'phone',
			'emails',
			'location',
			'fan_count',
			'followers_count',
			'link',
			'verification_status',
		];

		const fieldsToFetch = fields || defaultFields;

		return this.makeRequest<any>('GET', `/${pageId}`, {
			fields: fieldsToFetch.join(','),
		});
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

