/**
 * Shared guest support session helpers (cookie + sliding TTL + optional token rotation).
 */
import { createHash, randomBytes } from "node:crypto";
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { supportGuestSession } from "@npanel/db/schema/support-guest-sessions";
import { SUPPORT_GUEST_COOKIE } from "../context";
export const GUEST_SESSION_TTL_SEC = 90 * 24 * 60 * 60; // 90 days
/** Rotate opaque token at most this often (limits cookie churn, still limits stolen-token lifetime). */
export const GUEST_TOKEN_ROTATE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours
/** Client may also send the opaque token when httpOnly cookie is blocked (e.g. local HTTP). */
export const SUPPORT_GUEST_TOKEN_HEADER = "x-nisc-support-guest";
export function hashGuestToken(token) {
    return createHash("sha256").update(token).digest("hex");
}
export function hashOptionalValue(value) {
    if (!value)
        return null;
    return createHash("sha256").update(value).digest("hex");
}
function browserFacingHost(headers) {
    return (headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
        headers.get("host")?.split(",")[0]?.trim() ||
        "").toLowerCase();
}
function isLocalBrowserHost(host) {
    const hostname = host.split(":")[0] ?? "";
    return (hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "[::1]" ||
        hostname === "::1");
}
export function resolveSupportCookieDomain(headers) {
    const host = browserFacingHost(headers);
    // Never set Domain=.nisccloud.com for local landing (cookie would be rejected).
    if (isLocalBrowserHost(host))
        return undefined;
    const hostname = host.split(":")[0] ?? "";
    if (hostname === "nisccloud.com" || hostname.endsWith(".nisccloud.com")) {
        return ".nisccloud.com";
    }
    return undefined;
}
/**
 * Secure cookies only when the *browser* is on HTTPS.
 * Local Vite → HTTPS API often sets x-forwarded-proto=https for the upstream hop;
 * that must not force Secure cookies onto http://localhost (browser will drop them).
 */
function cookieSecure(ctx) {
    const host = browserFacingHost(ctx.req.raw.headers);
    if (isLocalBrowserHost(host))
        return false;
    const proto = (ctx.req.raw.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "").toLowerCase();
    if (proto === "http")
        return false;
    if (proto === "https")
        return true;
    return process.env.NODE_ENV === "production";
}
/** Cookie first, then explicit guest token header (set after startSession). */
export function readGuestTokenFromRequest(ctx) {
    const fromCookie = ctx.getCookie(SUPPORT_GUEST_COOKIE)?.trim();
    if (fromCookie)
        return fromCookie;
    const fromHeader = ctx.req.raw.headers.get(SUPPORT_GUEST_TOKEN_HEADER)?.trim();
    return fromHeader || null;
}
export function setSupportGuestCookie(ctx, rawToken) {
    ctx.setCookie(SUPPORT_GUEST_COOKIE, rawToken, {
        httpOnly: true,
        secure: cookieSecure(ctx),
        sameSite: "Lax",
        path: "/",
        maxAge: GUEST_SESSION_TTL_SEC,
        domain: resolveSupportCookieDomain(ctx.req.raw.headers),
    });
}
export function clearSupportGuestCookie(ctx) {
    ctx.setCookie(SUPPORT_GUEST_COOKIE, "", {
        httpOnly: true,
        secure: cookieSecure(ctx),
        sameSite: "Lax",
        path: "/",
        maxAge: 0,
        domain: resolveSupportCookieDomain(ctx.req.raw.headers),
    });
}
/**
 * Load active (unclaimed, unexpired) guest session from cookie.
 * When `refresh` is true: slides expiresAt, re-sets cookie, and rotates token if stale.
 */
export async function loadActiveGuestSession(ctx, opts) {
    const raw = readGuestTokenFromRequest(ctx);
    if (!raw)
        return null;
    const tokenHash = hashGuestToken(raw);
    const [sessionRow] = await db
        .select()
        .from(supportGuestSession)
        .where(eq(supportGuestSession.tokenHash, tokenHash))
        .limit(1);
    if (!sessionRow || sessionRow.expiresAt < new Date() || sessionRow.claimedAt) {
        clearSupportGuestCookie(ctx);
        return null;
    }
    if (!opts?.refresh) {
        return { ...sessionRow, rawToken: raw };
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + GUEST_SESSION_TTL_SEC * 1000);
    const shouldRotate = now.getTime() - sessionRow.lastSeenAt.getTime() >= GUEST_TOKEN_ROTATE_AFTER_MS;
    if (shouldRotate) {
        const newRaw = randomBytes(32).toString("base64url");
        const [updated] = await db
            .update(supportGuestSession)
            .set({
            tokenHash: hashGuestToken(newRaw),
            expiresAt,
            lastSeenAt: now,
            updatedAt: now,
        })
            .where(eq(supportGuestSession.id, sessionRow.id))
            .returning();
        setSupportGuestCookie(ctx, newRaw);
        return {
            ...(updated ?? { ...sessionRow, tokenHash: hashGuestToken(newRaw), expiresAt, lastSeenAt: now }),
            rawToken: newRaw,
        };
    }
    await db
        .update(supportGuestSession)
        .set({ expiresAt, lastSeenAt: now, updatedAt: now })
        .where(eq(supportGuestSession.id, sessionRow.id));
    // Re-issue cookie so browser maxAge stays aligned with DB TTL.
    setSupportGuestCookie(ctx, raw);
    return { ...sessionRow, expiresAt, lastSeenAt: now, rawToken: raw };
}
