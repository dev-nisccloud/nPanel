import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

/**
 * Get or create Upstash Redis client (lazy init).
 * Returns null if UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (cache disabled).
 */
export function getRedisClient(): Redis | null {
  try {
    if (!redisInstance) {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!url || !token) return null;
      redisInstance = new Redis({ url, token });
    }
    return redisInstance;
  } catch (error) {
    console.error("[Redis] Failed to initialize client:", error);
    return null;
  }
}
