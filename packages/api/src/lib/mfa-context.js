import { and, db, eq, isNull } from "@npanel/db";
import { userMfaSession, userMfaSettings } from "@npanel/db/schema/auth-extras";
/**
 * Single round-trip MFA lookup for tRPC context creation.
 * Replaces two sequential queries (settings, then pending session).
 */
export async function resolveMfaContextState(sessionUserId, sessionId) {
    const rows = await db
        .select({
        emailOtpEnabled: userMfaSettings.emailOtpEnabled,
        pendingMfaSessionId: userMfaSession.id,
    })
        .from(userMfaSettings)
        .leftJoin(userMfaSession, and(eq(userMfaSession.sessionId, sessionId), isNull(userMfaSession.verifiedAt)))
        .where(eq(userMfaSettings.userId, sessionUserId))
        .limit(1);
    const row = rows[0];
    if (!row?.emailOtpEnabled) {
        return { mfaRequired: false, mfaVerified: true };
    }
    return {
        mfaRequired: true,
        mfaVerified: !row.pendingMfaSessionId,
    };
}
