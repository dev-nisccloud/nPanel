import { db, eq } from "@npanel/db";
import { session } from "@npanel/db/schema/auth";

import {
  isSessionLifetimeExpired,
  nextIdleSessionExpiry,
  SESSION_TOUCH_THROTTLE_MS,
  STANDARD_SESSION_MAX_AGE_SEC,
} from "./session-policy";

export async function invalidateSessionById(sessionId: string): Promise<void> {
  await db.delete(session).where(eq(session.id, sessionId));
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

export type IdleSessionValidation =
  | { status: "expired" }
  | { status: "valid"; expiresAt: Date; extended: boolean };

/**
 * Expire idle sessions and silently extend active ones (throttled).
 * Each extension resets the 30-minute idle clock.
 */
export async function validateAndRefreshIdleSessionById(
  sessionId: string,
): Promise<IdleSessionValidation> {
  const rows = await db
    .select({
      expiresAt: session.expiresAt,
      updatedAt: session.updatedAt,
    })
    .from(session)
    .where(eq(session.id, sessionId))
    .limit(1);

  const row = rows[0];
  if (!row) return { status: "expired" };

  const now = new Date();
  if (isSessionLifetimeExpired(row.expiresAt, now)) {
    await invalidateSessionById(sessionId);
    return { status: "expired" };
  }

  const sinceLastTouchMs = now.getTime() - row.updatedAt.getTime();
  if (sinceLastTouchMs < SESSION_TOUCH_THROTTLE_MS) {
    return { status: "valid", expiresAt: row.expiresAt, extended: false };
  }

  const expiresAt = nextIdleSessionExpiry(now);
  await db
    .update(session)
    .set({ expiresAt, updatedAt: now })
    .where(eq(session.id, sessionId));

  return { status: "valid", expiresAt, extended: true };
}

/** @deprecated Use validateAndRefreshIdleSessionById */
export async function enforceSessionLifetimeById(
  sessionId: string,
): Promise<"valid" | "expired"> {
  const result = await validateAndRefreshIdleSessionById(sessionId);
  return result.status;
}
