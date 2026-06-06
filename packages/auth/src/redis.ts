import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

/**
 * Lazy Upstash Redis client for auth/session caching.
 * Returns null when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset
 * so the app falls back to direct DB reads (no behaviour change).
 */
export function getAuthRedisClient(): Redis | null {
  try {
    if (!redisInstance) {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!url || !token) return null;
      redisInstance = new Redis({ url, token });
    }
    return redisInstance;
  } catch (error) {
    console.error("[auth][redis] Failed to initialize client:", error);
    return null;
  }
}
