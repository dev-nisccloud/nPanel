export type RateLimitResult = {
    allowed: boolean;
    remaining: number;
};
/**
 * Fixed-window rate limiter. Returns allowed=true when Redis is unavailable
 * so traffic is never blocked due to cache outage.
 */
export declare function checkRateLimit(params: {
    key: string;
    limit: number;
    windowSec: number;
    /** When Redis is down, deny instead of allowing (use on paid LLM / abuse-sensitive routes). */
    failClosed?: boolean;
}): Promise<RateLimitResult>;
/** Per-path limits: heavy billing/subscription routes get tighter caps. */
export declare function resolveProcedureRateLimit(path: string): {
    authenticated: number;
    apiKey: number;
    anonymous: number;
    windowSec: number;
};
