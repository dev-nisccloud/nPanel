import type { IdleSessionValidation } from "./session-policy";
import { SESSION_TOUCH_THROTTLE_MS } from "./session-policy";
import { getAuthRedisClient } from "./redis";

const CACHE_PREFIX = "npanel:session:idle:";
/** Shorter than touch throttle so cache stays fresh; avoids stale "valid" after expiry. */
const CACHE_TTL_SEC = Math.max(15, Math.floor(SESSION_TOUCH_THROTTLE_MS / 1000) - 15);

type CachedSessionPayload = {
  status: "valid" | "expired";
  expiresAt?: string;
  extended?: boolean;
};

function cacheKey(sessionId: string): string {
  return `${CACHE_PREFIX}${sessionId}`;
}

export async function readCachedSessionValidation(
  sessionId: string,
): Promise<IdleSessionValidation | null> {
  const redis = getAuthRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get<CachedSessionPayload>(cacheKey(sessionId));
    if (!raw || typeof raw !== "object") return null;

    if (raw.status === "expired") {
      return { status: "expired" };
    }

    if (raw.status === "valid" && typeof raw.expiresAt === "string") {
      const expiresAt = new Date(raw.expiresAt);
      if (Number.isNaN(expiresAt.getTime())) return null;
      if (Date.now() >= expiresAt.getTime()) {
        void redis.del(cacheKey(sessionId)).catch(() => undefined);
        return null;
      }
      return {
        status: "valid",
        expiresAt,
        extended: Boolean(raw.extended),
      };
    }
  } catch (error) {
    console.error("[auth][session-cache] read failed:", error);
  }

  return null;
}

export async function writeCachedSessionValidation(
  sessionId: string,
  result: IdleSessionValidation,
): Promise<void> {
  const redis = getAuthRedisClient();
  if (!redis) return;

  try {
    if (result.status === "expired") {
      await redis.del(cacheKey(sessionId));
      return;
    }

    const payload: CachedSessionPayload = {
      status: "valid",
      expiresAt: result.expiresAt.toISOString(),
      extended: result.extended,
    };
    await redis.set(cacheKey(sessionId), payload, { ex: CACHE_TTL_SEC });
  } catch (error) {
    console.error("[auth][session-cache] write failed:", error);
  }
}

export async function invalidateSessionCache(sessionId: string): Promise<void> {
  const redis = getAuthRedisClient();
  if (!redis) return;

  try {
    await redis.del(cacheKey(sessionId));
  } catch (error) {
    console.error("[auth][session-cache] invalidate failed:", error);
  }
}
