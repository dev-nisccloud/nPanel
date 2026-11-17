import { getAuthRedisClient } from "./redis";

type RateLimitEntry = { key: string; count: number; lastRequest: number };

/** Longest custom rule window (sign-up: 1 hour). Better Auth does not pass a TTL to custom storage. */
const ENTRY_TTL_SEC = 3600;
const KEY_PREFIX = "npanel:auth-rl:";

const memory = new Map<string, { data: RateLimitEntry; expiresAt: number }>();

/** Shared across Cloud Run instances via Upstash; falls back to process memory when Redis is not configured. */
export const authRateLimitStorage = {
  async get(key: string): Promise<RateLimitEntry | null> {
    const redis = getAuthRedisClient();
    if (redis) {
      try {
        return (await redis.get<RateLimitEntry>(KEY_PREFIX + key)) ?? null;
      } catch (error) {
        console.error("[auth][rate-limit] Redis get failed:", error);
      }
    }
    const entry = memory.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      memory.delete(key);
      return null;
    }
    return entry.data;
  },
  async set(key: string, value: RateLimitEntry): Promise<void> {
    const redis = getAuthRedisClient();
    if (redis) {
      try {
        await redis.set(KEY_PREFIX + key, value, { ex: ENTRY_TTL_SEC });
        return;
      } catch (error) {
        console.error("[auth][rate-limit] Redis set failed:", error);
      }
    }
    memory.set(key, { data: value, expiresAt: Date.now() + ENTRY_TTL_SEC * 1000 });
  },
};
