/**
 * Storefront checkout token helpers.
 *
 * Issues and verifies short-lived HMAC-signed tokens scoped to a single
 * checkout session on the public landing page. These tokens carry just enough
 * identity (userId + teamId + teamSlug) to allow the storefront router to act
 * on behalf of the newly-registered customer without creating a full browser
 * session. They are NOT session tokens and grant no dashboard access.
 *
 * Signing uses HMAC-SHA256 with STOREFRONT_JWT_SECRET (must be set in env).
 * Token format (URL-safe base64):  <header>.<payload>.<signature>
 * TTL is 20 minutes from issuance.
 */
export interface StorefrontTokenPayload {
    /** better-auth user id */
    userId: string;
    /** team id created for this user */
    teamId: string;
    /** team slug for post-checkout redirect in nPanel */
    teamSlug: string;
    /** issued-at unix ms */
    iat: number;
    /** expiry unix ms */
    exp: number;
}
/**
 * Issue a short-lived storefront checkout token.
 */
export declare function signStorefrontToken(userId: string, teamId: string, teamSlug: string): string;
export type VerifyStorefrontTokenResult = {
    ok: true;
    payload: StorefrontTokenPayload;
} | {
    ok: false;
    reason: "invalid" | "expired" | "malformed";
};
/**
 * Verify a storefront checkout token.
 * Returns the payload if valid, or a typed error if not.
 */
export declare function verifyStorefrontToken(token: string): VerifyStorefrontTokenResult;
/**
 * Verify a storefront token and throw a typed TRPCError on failure.
 * Use inside storefront procedures.
 */
export declare function verifyStorefrontTokenOrThrow(token: string): StorefrontTokenPayload;
