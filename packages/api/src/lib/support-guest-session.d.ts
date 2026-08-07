/**
 * Shared guest support session helpers (cookie + sliding TTL + optional token rotation).
 */
import { supportGuestSession } from "@npanel/db/schema/support-guest-sessions";
import { type Context } from "../context";
export declare const GUEST_SESSION_TTL_SEC: number;
/** Rotate opaque token at most this often (limits cookie churn, still limits stolen-token lifetime). */
export declare const GUEST_TOKEN_ROTATE_AFTER_MS: number;
/** Client may also send the opaque token when httpOnly cookie is blocked (e.g. local HTTP). */
export declare const SUPPORT_GUEST_TOKEN_HEADER = "x-nisc-support-guest";
export type GuestSessionRow = typeof supportGuestSession.$inferSelect;
export declare function hashGuestToken(token: string): string;
export declare function hashOptionalValue(value: string | null | undefined): string | null;
export declare function resolveSupportCookieDomain(headers: Headers): string | undefined;
/** Cookie first, then explicit guest token header (set after startSession). */
export declare function readGuestTokenFromRequest(ctx: Context): string | null;
export declare function setSupportGuestCookie(ctx: Context, rawToken: string): void;
export declare function clearSupportGuestCookie(ctx: Context): void;
/**
 * Load active (unclaimed, unexpired) guest session from cookie.
 * When `refresh` is true: slides expiresAt, re-sets cookie, and rotates token if stale.
 */
export declare function loadActiveGuestSession(ctx: Context, opts?: {
    refresh?: boolean;
}): Promise<(GuestSessionRow & {
    rawToken?: string;
}) | null>;
