import { Redis } from "@upstash/redis";
/**
 * Get or create Upstash Redis client (lazy init).
 * Returns null if UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (cache disabled).
 */
export declare function getRedisClient(): Redis | null;
