import { randomBytes } from "node:crypto";
import { and, db, desc, eq, isNull, or } from "@npanel/db";
import { session } from "@npanel/db/schema/auth";

import { IMPERSONATION_SESSION_DURATION_SEC } from "./admin-access";
import { isImpersonatedSession } from "./impersonation";
import { invalidateSessionCache } from "./session-cache";
import {
  SESSION_TOUCH_THROTTLE_MS,
  STANDARD_SESSION_MAX_AGE_SEC,
} from "./session-policy";

/**
 * Parked agency sessions must outlive the customer impersonation window.
 * Better Auth stores the original session behind `admin_session`; idle TTL
 * would otherwise expire it (and the cookie) while the actor is still
 * viewing a customer dashboard.
 */
export const PARKED_AGENCY_SESSION_TTL_SEC =
  IMPERSONATION_SESSION_DURATION_SEC + STANDARD_SESSION_MAX_AGE_SEC;

export type ParkedAgencySession = {
  id: string;
  token: string;
  expiresAt: Date;
  updatedAt: Date;
};

export type AdminSessionCookieValue = {
  token: string;
  dontRememberMe: string;
};

export function parkedAgencySessionExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + PARKED_AGENCY_SESSION_TTL_SEC * 1000);
}

export function parseAdminSessionCookieValue(
  raw: string | null | undefined | false,
): AdminSessionCookieValue | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const sep = raw.indexOf(":");
  if (sep === -1) {
    return { token: raw, dontRememberMe: "" };
  }
  const token = raw.slice(0, sep);
  if (!token) return null;
  return { token, dontRememberMe: raw.slice(sep + 1) };
}

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

async function findParkedAgencySession(params: {
  actorUserId: string;
  sessionToken?: string | null;
}): Promise<ParkedAgencySession | null> {
  if (params.sessionToken) {
    const rows = await db
      .select({
        id: session.id,
        token: session.token,
        expiresAt: session.expiresAt,
        updatedAt: session.updatedAt,
        userId: session.userId,
        impersonatedBy: session.impersonatedBy,
      })
      .from(session)
      .where(eq(session.token, params.sessionToken))
      .limit(1);
    const row = rows[0];
    if (
      row &&
      row.userId === params.actorUserId &&
      !isImpersonatedSession(row)
    ) {
      return {
        id: row.id,
        token: row.token,
        expiresAt: row.expiresAt,
        updatedAt: row.updatedAt,
      };
    }
    // Do not fall back to another device session when a specific token was given.
    return null;
  }

  const rows = await db
    .select({
      id: session.id,
      token: session.token,
      expiresAt: session.expiresAt,
      updatedAt: session.updatedAt,
    })
    .from(session)
    .where(
      and(
        eq(session.userId, params.actorUserId),
        or(isNull(session.impersonatedBy), eq(session.impersonatedBy, "")),
      ),
    )
    .orderBy(desc(session.updatedAt))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Extend the parked agency session so idle timeout does not run while the
 * actor is logged in as a customer. Returns null when no parked session exists.
 */
export async function keepParkedAgencySessionAlive(params: {
  actorUserId: string;
  sessionToken?: string | null;
  force?: boolean;
}): Promise<(ParkedAgencySession & { extended: boolean }) | null> {
  const parked = await findParkedAgencySession(params);
  if (!parked) return null;

  const now = new Date();
  const sinceTouchMs = now.getTime() - parked.updatedAt.getTime();
  if (params.force !== true && sinceTouchMs < SESSION_TOUCH_THROTTLE_MS) {
    return { ...parked, extended: false };
  }

  const expiresAt = parkedAgencySessionExpiry(now);
  await db
    .update(session)
    .set({ expiresAt, updatedAt: now })
    .where(eq(session.id, parked.id));
  await invalidateSessionCache(parked.id);

  return {
    ...parked,
    expiresAt,
    updatedAt: now,
    extended: true,
  };
}

export async function createParkedAgencySession(params: {
  actorUserId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<ParkedAgencySession> {
  const now = new Date();
  const created: ParkedAgencySession = {
    id: crypto.randomUUID(),
    token: generateSessionToken(),
    expiresAt: parkedAgencySessionExpiry(now),
    updatedAt: now,
  };

  await db.insert(session).values({
    id: created.id,
    token: created.token,
    userId: params.actorUserId,
    expiresAt: created.expiresAt,
    createdAt: now,
    updatedAt: now,
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  });

  return created;
}

/** Revive or recreate the parked agency session used by Return to agency. */
export async function ensureParkedAgencySession(params: {
  actorUserId: string;
  sessionToken?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<ParkedAgencySession> {
  if (params.sessionToken) {
    const parked = await keepParkedAgencySessionAlive({
      actorUserId: params.actorUserId,
      sessionToken: params.sessionToken,
      force: true,
    });
    if (parked) return parked;
  }

  return createParkedAgencySession({
    actorUserId: params.actorUserId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}
