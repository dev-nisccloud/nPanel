import { db, eq } from "@npanel/db";
import { session, user } from "@npanel/db/schema/auth";
import { SIGNUP_TERMS_COOKIE } from "./signup-terms-constants";
export { SIGNUP_TERMS_COOKIE } from "./signup-terms-constants";
export function parseSignupTermsCookie(cookieHeader) {
    if (!cookieHeader)
        return false;
    return cookieHeader.split(";").some((part) => part.trim() === `${SIGNUP_TERMS_COOKIE}=1`);
}
export function signupRequestAcceptsTerms(body) {
    if (!body || typeof body !== "object")
        return false;
    const value = body.acceptedTermsAndConditions;
    return value === true || value === "true";
}
export async function recordTermsAcceptance(userId) {
    await db
        .update(user)
        .set({
        acceptedTermsAndConditions: true,
        updatedAt: new Date(),
    })
        .where(eq(user.id, userId));
}
/** Revert a Google sign-up that proceeded without terms acceptance. */
export async function rollbackSignupWithoutTerms(userId, sessionId) {
    if (sessionId) {
        await db.delete(session).where(eq(session.id, sessionId));
    }
    await db.delete(user).where(eq(user.id, userId));
}
