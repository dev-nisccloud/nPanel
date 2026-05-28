import { db, eq } from "@npanel/db";
import { session } from "@npanel/db/schema/auth";

import {
  isSessionLifetimeExpired,
  STANDARD_SESSION_MAX_AGE_SEC,
} from "./session-policy";

export async function invalidateSessionById(sessionId: string): Promise<void> {
  await db.delete(session).where(eq(session.id, sessionId));
}

/** Force DB expiry to the standard 30-minute window (email, Google, etc.). */
export async function applyStandardSessionExpiryByToken(
  sessionToken: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + STANDARD_SESSION_MAX_AGE_SEC * 1000);
  await db
    .update(session)
    .set({ expiresAt })
    .where(eq(session.token, sessionToken));
}

/**
 * Loads session timestamps from DB and deletes the row if past policy limits.
 * Returns whether the session may still be used.
 */
export async function enforceSessionLifetimeById(
  sessionId: string,
): Promise<"valid" | "expired"> {
  const rows = await db
    .select({
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    })
    .from(session)
    .where(eq(session.id, sessionId))
    .limit(1);

  const row = rows[0];
  if (!row) return "expired";

  if (isSessionLifetimeExpired(row.createdAt, row.expiresAt)) {
    await invalidateSessionById(sessionId);
    return "expired";
  }

  return "valid";
}
