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
export declare class InstagramApiError extends Error {
    code: number;
    message: string;
    type: string;
    errorSubcode?: number | undefined;
    fbtraceId?: string | undefined;
    constructor(code: number, message: string, type?: string, errorSubcode?: number | undefined, fbtraceId?: string | undefined);
}
/**
 * Throw a typed Instagram error if the JSON response from the API contains
 * an error envelope. Handles both the OAuth shape and the Graph API shape.
 */
export declare function throwIfInstagramError(data: unknown, statusCode: number): void;
export interface InstagramApiConfig {
    accessToken: string;
    baseUrl?: string;
}
/**
 * Minimal client for Instagram Graph API (graph.instagram.com).
 * Use this for profile lookups, media reads, insights, content publish, etc.
 */
export declare class InstagramClient {
    private config;
    constructor(config: InstagramApiConfig);
    makeRequest<T>(method: 'GET' | 'POST' | 'DELETE', endpoint: string, params?: Record<string, unknown>, body?: unknown): Promise<T>;
}
