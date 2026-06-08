import { getRedisClient } from "./redis";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

/**
 * Fixed-window rate limiter. Returns allowed=true when Redis is unavailable
 * so traffic is never blocked due to cache outage.
 */
export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowSec: number;
}): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return { allowed: true, remaining: params.limit };
  }

  const limit = Math.max(1, Math.floor(params.limit));
  const windowSec = Math.max(1, Math.floor(params.windowSec));
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const key = `npanel:rl:${params.key}:${bucket}`;

  try {
    const used = Number(await redis.incr(key));
    if (used === 1) {
      await redis.expire(key, windowSec + 1);
    }
    const remaining = Math.max(0, limit - used);
    return { allowed: used <= limit, remaining };
  } catch (error) {
    console.error("[rate-limit] check failed:", error);
    return { allowed: true, remaining: limit };
  }
}

/** Per-path limits: heavy billing/subscription routes get tighter caps. */
export function resolveProcedureRateLimit(path: string): {
  authenticated: number;
  apiKey: number;
  anonymous: number;
  windowSec: number;
} {
  const heavyPrefixes = [
    "clientSubscriptions.",
    "invoicing.",
    "orders.",
    "teams.",
    "hivelocity",
  ];
  const isHeavy = heavyPrefixes.some((p) => path.includes(p));

  if (isHeavy) {
    return { authenticated: 60, apiKey: 120, anonymous: 20, windowSec: 60 };
  }
  return { authenticated: 120, apiKey: 240, anonymous: 40, windowSec: 60 };
}
