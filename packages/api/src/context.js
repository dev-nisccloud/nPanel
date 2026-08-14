import { auth } from "@npanel/auth";
import { validateAndRefreshIdleSessionById } from "@npanel/auth/session-enforcement";
import { handleIpAnomaly, resolveReauthRequired, } from "@npanel/auth/session-security";
import { isImpersonatedSession } from "@npanel/auth/impersonation";
import { getRequestBrowserOrigin, isAllowedStorefrontBrowserRequest, isLandingPageOrigin, } from "@npanel/auth/landing-page-origins";
import { getCookie, setCookie } from "hono/cookie";
import { createHash } from "node:crypto";
import { db, eq } from "@npanel/db";
import { apiKey } from "@npanel/db/schema/auth-extras";
import { user } from "@npanel/db/schema/auth";
import { resolveMfaContextState } from "./lib/mfa-context";
export const SUPPORT_GUEST_COOKIE = "nisc_support_guest";
function resolveIpAddress(headers) {
    return (headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
        headers.get("x-real-ip")?.trim() ||
        headers.get("cf-connecting-ip")?.trim() ||
        null);
}
function buildCookieHelpers(context) {
    return {
        getCookie: (name) => getCookie(context, name),
        setCookie: (name, value, options) => {
            setCookie(context, name, value, {
                path: options?.path ?? "/",
                domain: options?.domain,
                maxAge: options?.maxAge,
                expires: options?.expires,
                httpOnly: options?.httpOnly ?? true,
                secure: options?.secure ?? true,
                sameSite: options?.sameSite ?? "Lax",
            });
        },
    };
}
export async function createContext({ context, createCaller, }) {
    const req = context.req;
    const cookies = buildCookieHelpers(context);
    const authHeader = req.raw.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        if (token.startsWith("npanel_sk_")) {
            const keyHash = createHash("sha256").update(token).digest("hex");
            const [keyRecord] = await db
                .select()
                .from(apiKey)
                .where(eq(apiKey.keyHash, keyHash))
                .limit(1);
            if (!keyRecord) {
                return {
                    session: null,
                    apiKeyError: "Invalid API Key",
                    ipAddress: resolveIpAddress(context.req.raw.headers),
                    req,
                    ...cookies,
                };
            }
            if (!keyRecord.isActive) {
                return {
                    session: null,
                    apiKeyError: "API Key is revoked",
                    ipAddress: resolveIpAddress(context.req.raw.headers),
                    req,
                    ...cookies,
                };
            }
            if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
                return {
                    session: null,
                    apiKeyError: "API Key has expired",
                    ipAddress: resolveIpAddress(context.req.raw.headers),
                    req,
                    ...cookies,
                };
            }
            const [userRecord] = await db
                .select()
                .from(user)
                .where(eq(user.id, keyRecord.userId))
                .limit(1);
            if (!userRecord || userRecord.status !== "ACTIVE") {
                return {
                    session: null,
                    apiKeyError: "Account associated with this API key is inactive",
                    ipAddress: resolveIpAddress(context.req.raw.headers),
                    req,
                    ...cookies,
                };
            }
            // Found a valid API key and active user.
            // Optional: asynchronously update lastUsedAt
            void db.update(apiKey)
                .set({ lastUsedAt: new Date() })
                .where(eq(apiKey.id, keyRecord.id))
                .catch(err => console.error("Failed to update api key lastUsedAt:", err));
            const sessionUser = {
                id: userRecord.id,
                name: userRecord.name,
                email: userRecord.email,
                role: userRecord.role,
            };
            const mockSessionObj = {
                id: `apikey_${keyRecord.id}`,
                expiresAt: keyRecord.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                userId: userRecord.id,
                createdAt: keyRecord.createdAt,
                updatedAt: keyRecord.lastUsedAt ?? keyRecord.createdAt,
                ipAddress: resolveIpAddress(context.req.raw.headers),
                userAgent: context.req.raw.headers.get("user-agent") ?? null,
                token: token,
            };
            const ipAddress = resolveIpAddress(context.req.raw.headers);
            return {
                session: { session: mockSessionObj, user: sessionUser },
                createCaller,
                apiKey: { id: keyRecord.id, permissions: keyRecord.permissions },
                ipAddress,
                req,
                ...cookies,
            };
        }
    }
    let session = await auth.api.getSession({
        headers: context.req.raw.headers,
    });
    const ipAddress = resolveIpAddress(context.req.raw.headers);
    const userAgent = context.req.raw.headers.get("user-agent");
    const softFail = isLandingPageOrigin(getRequestBrowserOrigin(context.req.raw.headers)) ||
        isAllowedStorefrontBrowserRequest(context.req.raw.headers);
    const sessionId = session?.session?.id;
    if (typeof sessionId === "string" && sessionId.length > 0) {
        const lifetime = await validateAndRefreshIdleSessionById(sessionId, {
            userAgent,
            ipAddress,
            rotateToken: false,
            softFail,
        });
        if (lifetime.status === "expired") {
            session = null;
        }
        else if (lifetime.ipAnomaly && lifetime.userId && !softFail) {
            try {
                const anomaly = await handleIpAnomaly({
                    userId: lifetime.userId,
                    sessionId,
                    ipAddress,
                    userAgent,
                    expiresAt: lifetime.expiresAt,
                });
                if (anomaly.invalidated) {
                    session = null;
                }
            }
            catch (error) {
                console.error("[api][context] IP anomaly handling failed:", error);
            }
        }
    }
    let mfaRequired = false;
    let mfaVerified = true;
    let mfaSetupRequired = false;
    let reauthRequired = false;
    const sessionUserId = session?.user?.id;
    const activeSessionId = session?.session?.id;
    const impersonating = isImpersonatedSession(session?.session);
    if (typeof sessionUserId === "string" &&
        sessionUserId.length > 0 &&
        typeof activeSessionId === "string" &&
        activeSessionId.length > 0 &&
        // Impersonation must not require the customer's MFA / password re-auth.
        !impersonating) {
        const mfaState = await resolveMfaContextState(sessionUserId, activeSessionId);
        mfaRequired = mfaState.mfaRequired;
        mfaVerified = mfaState.mfaVerified;
        mfaSetupRequired = false;
        reauthRequired = await resolveReauthRequired(activeSessionId);
    }
    return {
        session: session,
        mfaRequired,
        mfaVerified,
        mfaSetupRequired,
        reauthRequired,
        createCaller,
        ipAddress,
        req,
        ...cookies,
    };
}
