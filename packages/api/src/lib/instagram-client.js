import { request } from 'undici';
export class InstagramApiError extends Error {
    code;
    message;
    type;
    errorSubcode;
    fbtraceId;
    constructor(code, message, type = 'InstagramApiError', errorSubcode, fbtraceId) {
        super(`Instagram API Error ${code}: ${message}`);
        this.code = code;
        this.message = message;
        this.type = type;
        this.errorSubcode = errorSubcode;
        this.fbtraceId = fbtraceId;
        this.name = 'InstagramApiError';
    }
}
/**
 * Throw a typed Instagram error if the JSON response from the API contains
 * an error envelope. Handles both the OAuth shape and the Graph API shape.
 */
export function throwIfInstagramError(data, statusCode) {
    if (!data || typeof data !== 'object')
        return;
    const payload = data;
    if (payload.error && typeof payload.error === 'object') {
        throw new InstagramApiError(payload.error.code ?? statusCode ?? 400, payload.error.message ?? 'Instagram API request failed', payload.error.type ?? 'OAuthException', payload.error.error_subcode, payload.error.fbtrace_id);
    }
    if (payload.error_type || payload.error_message) {
        throw new InstagramApiError(payload.code ?? statusCode ?? 400, payload.error_message ?? 'Instagram API request failed', payload.error_type ?? 'OAuthException');
    }
}
/**
 * Minimal client for Instagram Graph API (graph.instagram.com).
 * Use this for profile lookups, media reads, insights, content publish, etc.
 */
export class InstagramClient {
    config;
    constructor(config) {
        this.config = {
            accessToken: config.accessToken,
            baseUrl: config.baseUrl ?? 'https://graph.instagram.com',
        };
    }
    async makeRequest(method, endpoint, params, body) {
        const url = new URL(`${this.config.baseUrl}${endpoint}`);
        url.searchParams.set('access_token', this.config.accessToken);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value === undefined || value === null)
                    continue;
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
        const init = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body && method === 'POST') {
            init.body = JSON.stringify(body);
        }
        const response = await request(url.toString(), init);
        const data = (await response.body.json());
        throwIfInstagramError(data, response.statusCode);
        return data;
    }
}
