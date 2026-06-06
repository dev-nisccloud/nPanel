import { db, eq } from "@npanel/db";
import { session } from "@npanel/db/schema/auth";
import { isSessionLifetimeExpired, nextIdleSessionExpiry, SESSION_TOUCH_THROTTLE_MS, STANDARD_SESSION_MAX_AGE_SEC, } from "./session-policy";
import { invalidateSessionCache, readCachedSessionValidation, writeCachedSessionValidation, } from "./session-cache";
export async function invalidateSessionById(sessionId) {
    await db.delete(session).where(eq(session.id, sessionId));
    await invalidateSessionCache(sessionId);
}
/** Set initial idle window when a session is first created. */
export async function applyStandardSessionExpiryByToken(sessionToken) {
    const expiresAt = nextIdleSessionExpiry();
    await db
        .update(session)
        .set({ expiresAt, updatedAt: new Date() })
        .where(eq(session.token, sessionToken));
}
/**
 * Expire idle sessions and silently extend active ones (throttled).
 * Each extension resets the 30-minute idle clock.
 */
export async function validateAndRefreshIdleSessionById(sessionId) {
    const cached = await readCachedSessionValidation(sessionId);
    if (cached) {
        return cached;
    }
    const rows = await db
        .select({
        expiresAt: session.expiresAt,
        updatedAt: session.updatedAt,
    })
        .from(session)
        .where(eq(session.id, sessionId))
        .limit(1);
    const row = rows[0];
    if (!row) {
        const expired = { status: "expired" };
        await writeCachedSessionValidation(sessionId, expired);
        return expired;
    }
    const now = new Date();
    if (isSessionLifetimeExpired(row.expiresAt, now)) {
        await invalidateSessionById(sessionId);
        const expired = { status: "expired" };
        await writeCachedSessionValidation(sessionId, expired);
        return expired;
    }
    const sinceLastTouchMs = now.getTime() - row.updatedAt.getTime();
    if (sinceLastTouchMs < SESSION_TOUCH_THROTTLE_MS) {
        const valid = {
            status: "valid",
            expiresAt: row.expiresAt,
            extended: false,
        };
        await writeCachedSessionValidation(sessionId, valid);
        return valid;
    }
    const expiresAt = nextIdleSessionExpiry(now);
    await db
        .update(session)
        .set({ expiresAt, updatedAt: now })
        .where(eq(session.id, sessionId));
    const extended = { status: "valid", expiresAt, extended: true };
    await writeCachedSessionValidation(sessionId, extended);
    return extended;
}
/** @deprecated Use validateAndRefreshIdleSessionById */
export async function enforceSessionLifetimeById(sessionId) {
    const result = await validateAndRefreshIdleSessionById(sessionId);
    return result.status;
}
