import { randomBytes } from "node:crypto";
import { db, eq } from "@npanel/db";
import { session } from "@npanel/db/schema/auth";
import { userActivityLog } from "@npanel/db/schema/auth-extras";

import {
  isSessionLifetimeExpired,
  nextIdleSessionExpiry,
  normalizeIpAddress,
  normalizeUserAgent,
  SESSION_TOUCH_THROTTLE_MS,
  type IdleSessionValidation,
} from "./session-policy";
import {
  invalidateSessionCache,
  readCachedSessionValidation,
  writeCachedSessionValidation,
} from "./session-cache";

export type SessionEnforcementOpts = {
  userAgent?: string | null;
  ipAddress?: string | null;
  /** Only enable when the caller can rewrite the Better Auth signed session cookie. */
  rotateToken?: boolean;
};

export async function invalidateSessionById(sessionId: string): Promise<void> {
  await db.delete(session).where(eq(session.id, sessionId));
  await invalidateSessionCache(sessionId);
}

/** Set initial idle window when a session is first created. */
export async function applyStandardSessionExpiryByToken(
  sessionToken: string,
): Promise<void> {
  const expiresAt = nextIdleSessionExpiry();
  await db
    .update(session)
    .set({ expiresAt, updatedAt: new Date() })
    .where(eq(session.token, sessionToken));
}

export type { IdleSessionValidation } from "./session-policy";

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

async function logUaMismatch(params: {
  userId: string;
  sessionId: string;
  boundUserAgent: string;
  requestUserAgent: string | null;
  ipAddress: string | null;
}): Promise<void> {
  try {
    await db.insert(userActivityLog).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      action: "SESSION_UA_MISMATCH",
      description: "Session invalidated due to User-Agent mismatch",
      metadata: {
        sessionId: params.sessionId,
        boundUserAgent: params.boundUserAgent,
        requestUserAgent: params.requestUserAgent,
      },
      ipAddress: params.ipAddress,
      userAgent: params.requestUserAgent,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[auth][session] Failed to log UA mismatch:", error);
  }
}

/**
 * Expire idle sessions, enforce UA binding, detect IP anomalies,
 * and silently extend active sessions (throttled). Token rotation is opt-in.
 */
export async function validateAndRefreshIdleSessionById(
  sessionId: string,
  opts?: SessionEnforcementOpts,
): Promise<IdleSessionValidation> {
  const requestUa = normalizeUserAgent(opts?.userAgent);
  const requestIp = normalizeIpAddress(opts?.ipAddress);
  const rotateToken = opts?.rotateToken === true;

  const cached = await readCachedSessionValidation(sessionId, {
    userAgent: requestUa,
    ipAddress: requestIp,
  });
  if (cached) {
    return cached;
  }

  const rows = await db
    .select({
      expiresAt: session.expiresAt,
      updatedAt: session.updatedAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      userId: session.userId,
    })
    .from(session)
    .where(eq(session.id, sessionId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    const expired: IdleSessionValidation = { status: "expired", reason: "missing" };
    await writeCachedSessionValidation(sessionId, expired);
    return expired;
  }

  const now = new Date();
  if (isSessionLifetimeExpired(row.expiresAt, now)) {
    await invalidateSessionById(sessionId);
    const expired: IdleSessionValidation = { status: "expired", reason: "idle" };
    await writeCachedSessionValidation(sessionId, expired);
    return expired;
  }

  const boundUa = normalizeUserAgent(row.userAgent);

  if (boundUa && requestUa && boundUa !== requestUa) {
    await logUaMismatch({
      userId: row.userId,
      sessionId,
      boundUserAgent: boundUa,
      requestUserAgent: requestUa,
      ipAddress: requestIp,
    });
    await invalidateSessionById(sessionId);
    const expired: IdleSessionValidation = {
      status: "expired",
      reason: "ua_mismatch",
    };
    await writeCachedSessionValidation(sessionId, expired);
    return expired;
  }

  if (boundUa && !requestUa) {
    await logUaMismatch({
      userId: row.userId,
      sessionId,
      boundUserAgent: boundUa,
      requestUserAgent: null,
      ipAddress: requestIp,
    });
    await invalidateSessionById(sessionId);
    const expired: IdleSessionValidation = {
      status: "expired",
      reason: "ua_mismatch",
    };
    await writeCachedSessionValidation(sessionId, expired);
    return expired;
  }

  let effectiveBoundUa = boundUa;
  if (!boundUa && requestUa) {
    await db
      .update(session)
      .set({ userAgent: requestUa, updatedAt: now })
      .where(eq(session.id, sessionId));
    effectiveBoundUa = requestUa;
  }

  const boundIp = normalizeIpAddress(row.ipAddress);
  const ipAnomaly = Boolean(boundIp && requestIp && boundIp !== requestIp);

  let effectiveBoundIp = boundIp;
  if (!boundIp && requestIp) {
    await db
      .update(session)
      .set({ ipAddress: requestIp, updatedAt: now })
      .where(eq(session.id, sessionId));
    effectiveBoundIp = requestIp;
  }

  const sinceLastTouchMs = now.getTime() - row.updatedAt.getTime();
  if (sinceLastTouchMs < SESSION_TOUCH_THROTTLE_MS) {
    const valid: IdleSessionValidation = {
      status: "valid",
      expiresAt: row.expiresAt,
      extended: false,
      ipAnomaly,
      userId: row.userId,
    };
    await writeCachedSessionValidation(sessionId, valid, {
      boundUserAgent: effectiveBoundUa,
      boundIpAddress: effectiveBoundIp,
      userId: row.userId,
    });
    return valid;
  }

  const expiresAt = nextIdleSessionExpiry(now);
  const rotatedToken = rotateToken ? generateSessionToken() : undefined;

  await db
    .update(session)
    .set({
      expiresAt,
      updatedAt: now,
      ...(rotatedToken ? { token: rotatedToken } : {}),
    })
    .where(eq(session.id, sessionId));

  if (rotatedToken) {
    await invalidateSessionCache(sessionId);
  }

  const extended: IdleSessionValidation = {
    status: "valid",
    expiresAt,
    extended: true,
    ipAnomaly,
    rotatedToken,
    userId: row.userId,
  };
  await writeCachedSessionValidation(sessionId, extended, {
    boundUserAgent: effectiveBoundUa,
    boundIpAddress: effectiveBoundIp,
    userId: row.userId,
  });
  return extended;
}

/** Update bound IP after successful step-up (MFA or password re-auth). */
export async function updateSessionBoundIp(
  sessionId: string,
  ipAddress: string | null,
): Promise<void> {
  const normalized = normalizeIpAddress(ipAddress);
  if (!normalized) return;
  await db
    .update(session)
    .set({ ipAddress: normalized, updatedAt: new Date() })
    .where(eq(session.id, sessionId));
  await invalidateSessionCache(sessionId);
}

/** @deprecated Use validateAndRefreshIdleSessionById */
export async function enforceSessionLifetimeById(
  sessionId: string,
  opts?: SessionEnforcementOpts,
): Promise<"valid" | "expired"> {
  const result = await validateAndRefreshIdleSessionById(sessionId, opts);
  return result.status;
}
