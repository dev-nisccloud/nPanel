import type { IdleSessionValidation } from "./session-policy";
import { SESSION_TOUCH_THROTTLE_MS, normalizeUserAgent } from "./session-policy";
import { getAuthRedisClient } from "./redis";

const CACHE_PREFIX = "npanel:session:idle:";
const REAUTH_PREFIX = "npanel:session:reauth:";
const IP_ALERT_PREFIX = "npanel:session:ip-alert:";

/** Shorter than touch throttle so cache stays fresh; avoids stale "valid" after expiry. */
const CACHE_TTL_SEC = Math.max(15, Math.floor(SESSION_TOUCH_THROTTLE_MS / 1000) - 15);

type CachedSessionPayload = {
  status: "valid" | "expired";
  expiresAt?: string;
  extended?: boolean;
  boundUserAgent?: string | null;
  boundIpAddress?: string | null;
  userId?: string;
  reason?: string;
};

function cacheKey(sessionId: string): string {
  return `${CACHE_PREFIX}${sessionId}`;
}

function reauthKey(sessionId: string): string {
  return `${REAUTH_PREFIX}${sessionId}`;
}

function ipAlertKey(sessionId: string): string {
  return `${IP_ALERT_PREFIX}${sessionId}`;
}

/** In-process fallback when Upstash Redis is not configured (local/dev). */
const memoryReauth = new Map<string, number>();
const memoryIpAlert = new Map<string, number>();

function memoryPurgeExpired(map: Map<string, number>): void {
  const now = Date.now();
  for (const [key, expiresAt] of map) {
    if (expiresAt <= now) map.delete(key);
  }
}

export async function readCachedSessionValidation(
  sessionId: string,
  opts?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<IdleSessionValidation | null> {
  const redis = getAuthRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get<CachedSessionPayload>(cacheKey(sessionId));
    if (!raw || typeof raw !== "object") return null;

    if (raw.status === "expired") {
      return {
        status: "expired",
        reason: raw.reason === "ua_mismatch" || raw.reason === "missing" ? raw.reason : "idle",
      };
    }

    if (raw.status === "valid" && typeof raw.expiresAt === "string") {
      const expiresAt = new Date(raw.expiresAt);
      if (Number.isNaN(expiresAt.getTime())) return null;
      if (Date.now() >= expiresAt.getTime()) {
        void redis.del(cacheKey(sessionId)).catch(() => undefined);
        return null;
      }

      const requestUa = normalizeUserAgent(opts?.userAgent);
      const boundUa = normalizeUserAgent(raw.boundUserAgent);
      if (boundUa && requestUa && boundUa !== requestUa) {
        // Force DB path so UA mismatch can invalidate the session.
        return null;
      }
      if (boundUa && !requestUa) {
        return null;
      }

      const requestIp = opts?.ipAddress?.trim() || null;
      const boundIp = raw.boundIpAddress?.trim() || null;
      const ipAnomaly = Boolean(boundIp && requestIp && boundIp !== requestIp);

      return {
        status: "valid",
        expiresAt,
        extended: false,
        ipAnomaly,
        userId: typeof raw.userId === "string" ? raw.userId : undefined,
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
  opts?: { boundUserAgent?: string | null; boundIpAddress?: string | null; userId?: string },
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
      boundUserAgent: opts?.boundUserAgent ?? null,
      boundIpAddress: opts?.boundIpAddress ?? null,
      userId: opts?.userId ?? result.userId,
    };
    await redis.set(cacheKey(sessionId), payload, { ex: CACHE_TTL_SEC });
  } catch (error) {
    console.error("[auth][session-cache] write failed:", error);
  }
}

export async function invalidateSessionCache(sessionId: string): Promise<void> {
  memoryReauth.delete(sessionId);
  memoryIpAlert.delete(sessionId);
  const redis = getAuthRedisClient();
  if (!redis) return;

  try {
    await redis.del(cacheKey(sessionId));
    await redis.del(reauthKey(sessionId));
    await redis.del(ipAlertKey(sessionId));
  } catch (error) {
    console.error("[auth][session-cache] invalidate failed:", error);
  }
}

export async function markSessionReauthRequired(
  sessionId: string,
  ttlSec: number,
): Promise<void> {
  const ttl = Math.max(60, Math.floor(ttlSec));
  const redis = getAuthRedisClient();
  if (!redis) {
    memoryReauth.set(sessionId, Date.now() + ttl * 1000);
    return;
  }
  try {
    await redis.set(reauthKey(sessionId), "1", { ex: ttl });
  } catch (error) {
    console.error("[auth][session-cache] mark reauth failed:", error);
    memoryReauth.set(sessionId, Date.now() + ttl * 1000);
  }
}

export async function isSessionReauthRequired(sessionId: string): Promise<boolean> {
  const redis = getAuthRedisClient();
  if (!redis) {
    memoryPurgeExpired(memoryReauth);
    const expiresAt = memoryReauth.get(sessionId);
    return typeof expiresAt === "number" && expiresAt > Date.now();
  }
  try {
    const value = await redis.get(reauthKey(sessionId));
    return value === "1" || value === 1;
  } catch (error) {
    console.error("[auth][session-cache] read reauth failed:", error);
    memoryPurgeExpired(memoryReauth);
    const expiresAt = memoryReauth.get(sessionId);
    return typeof expiresAt === "number" && expiresAt > Date.now();
  }
}

export async function clearSessionReauthRequired(sessionId: string): Promise<void> {
  memoryReauth.delete(sessionId);
  const redis = getAuthRedisClient();
  if (!redis) return;
  try {
    await redis.del(reauthKey(sessionId));
  } catch (error) {
    console.error("[auth][session-cache] clear reauth failed:", error);
  }
}

/** Returns true if this alert should be sent (first in the dedupe window). */
export async function claimIpAnomalyAlert(
  sessionId: string,
  dedupeSec: number,
): Promise<boolean> {
  const ttl = Math.max(60, Math.floor(dedupeSec));
  const redis = getAuthRedisClient();
  if (!redis) {
    memoryPurgeExpired(memoryIpAlert);
    const existing = memoryIpAlert.get(sessionId);
    if (typeof existing === "number" && existing > Date.now()) return false;
    memoryIpAlert.set(sessionId, Date.now() + ttl * 1000);
    return true;
  }
  try {
    const key = ipAlertKey(sessionId);
    const existing = await redis.get(key);
    if (existing) return false;
    await redis.set(key, "1", { ex: ttl });
    return true;
  } catch (error) {
    console.error("[auth][session-cache] claim ip alert failed:", error);
    return true;
  }
}
