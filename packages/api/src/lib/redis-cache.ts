import { getRedisClient } from "./redis";

/**
 * Generic Redis cache helpers. When Redis is unavailable, callers fall back to
 * fetching fresh data (no behaviour change vs pre-cache).
 */
export async function readCacheJson<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get<T>(key);
    if (raw == null) return null;
    return raw;
  } catch (error) {
    console.error("[redis-cache] read failed:", key, error);
    return null;
  }
}

export async function writeCacheJson<T>(
  key: string,
  value: T,
  ttlSec: number,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSec });
  } catch (error) {
    console.error("[redis-cache] write failed:", key, error);
  }
}

export async function invalidateCacheKey(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error("[redis-cache] invalidate failed:", key, error);
  }
}
