import { Redis } from "@upstash/redis";
/**
 * Lazy Upstash Redis client for auth/session caching.
 * Returns null when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset
 * so the app falls back to direct DB reads (no behaviour change).
 */
export declare function getAuthRedisClient(): Redis | null;
