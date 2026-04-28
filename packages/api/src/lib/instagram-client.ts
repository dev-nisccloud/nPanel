import { request } from 'undici';

/**
 * Instagram (standalone Instagram API with Instagram Login) error envelope.
 *
 * Examples returned by Instagram OAuth / Graph endpoints:
 *  - { "error_type": "OAuthException", "code": 400, "error_message": "..." }
 *  - { "error": { "message": "...", "type": "OAuthException", "code": 190 } }
 */
export interface InstagramApiErrorPayload {
	error?: {
		message?: string;
		type?: string;
		code?: number;
		error_subcode?: number;
		fbtrace_id?: string;
	};
	error_type?: string;
	error_message?: string;
	code?: number;
}

export class InstagramApiError extends Error {
	constructor(
		public code: number,
		public message: string,
		public type: string = 'InstagramApiError',
		public errorSubcode?: number,
		public fbtraceId?: string,
	) {
		super(`Instagram API Error ${code}: ${message}`);
		this.name = 'InstagramApiError';
	}
}

/**
 * Throw a typed Instagram error if the JSON response from the API contains
 * an error envelope. Handles both the OAuth shape and the Graph API shape.
 */
export function throwIfInstagramError(
	data: unknown,
	statusCode: number,
): void {
	if (!data || typeof data !== 'object') return;

	const payload = data as InstagramApiErrorPayload;

	if (payload.error && typeof payload.error === 'object') {
		throw new InstagramApiError(
			payload.error.code ?? statusCode ?? 400,
			payload.error.message ?? 'Instagram API request failed',
			payload.error.type ?? 'OAuthException',
			payload.error.error_subcode,
			payload.error.fbtrace_id,
		);
	}

	if (payload.error_type || payload.error_message) {
		throw new InstagramApiError(
			payload.code ?? statusCode ?? 400,
			payload.error_message ?? 'Instagram API request failed',
			payload.error_type ?? 'OAuthException',
		);
	}
}

export interface InstagramApiConfig {
	accessToken: string;
	baseUrl?: string;
}

/**
 * Minimal client for Instagram Graph API (graph.instagram.com).
 * Use this for profile lookups, media reads, insights, content publish, etc.
 */
export class InstagramClient {
	private config: Required<InstagramApiConfig>;

	constructor(config: InstagramApiConfig) {
		this.config = {
			accessToken: config.accessToken,
			baseUrl: config.baseUrl ?? 'https://graph.instagram.com',
		};
	}

	async makeRequest<T>(
		method: 'GET' | 'POST' | 'DELETE',
		endpoint: string,
		params?: Record<string, unknown>,
		body?: unknown,
	): Promise<T> {
		const url = new URL(`${this.config.baseUrl}${endpoint}`);
		url.searchParams.set('access_token', this.config.accessToken);

		if (params) {
			for (const [key, value] of Object.entries(params)) {
				if (value === undefined || value === null) continue;
				if (Array.isArray(value)) {
					url.searchParams.set(key, value.join(','));
				} else if (typeof value === 'object') {
					url.searchParams.set(key, JSON.stringify(value));
				} else {
					url.searchParams.set(key, String(value));
				}
			}
		}

		const init: Parameters<typeof request>[1] = {
			method,
			headers: { 'Content-Type': 'application/json' },
		};
		if (body && method === 'POST') {
			init.body = JSON.stringify(body);
		}

		const response = await request(url.toString(), init);
		const data = (await response.body.json()) as unknown;

		throwIfInstagramError(data, response.statusCode);

		return data as T;
	}
}
