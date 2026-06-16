import { auth } from "@npanel/auth";
import { validateAndRefreshIdleSessionById } from "@npanel/auth/session-enforcement";
import { createHash } from "node:crypto";
import { db, eq } from "@npanel/db";
import { apiKey } from "@npanel/db/schema/auth-extras";
import { user } from "@npanel/db/schema/auth";
import { resolveMfaContextState } from "./lib/mfa-context";
function resolveIpAddress(headers) {
    return (headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip")?.trim() ||
        headers.get("cf-connecting-ip")?.trim() ||
        null);
}
export async function createContext({ context, createCaller, }) {
    const req = context.req;
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
                };
            }
            if (!keyRecord.isActive) {
                return {
                    session: null,
                    apiKeyError: "API Key is revoked",
                    ipAddress: resolveIpAddress(context.req.raw.headers),
                    req,
                };
            }
            if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
                return {
                    session: null,
                    apiKeyError: "API Key has expired",
                    ipAddress: resolveIpAddress(context.req.raw.headers),
                    req,
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
            };
        }
    }
    let session = await auth.api.getSession({
        headers: context.req.raw.headers,
    });
    const sessionId = session?.session?.id;
    if (typeof sessionId === "string" && sessionId.length > 0) {
        const lifetime = await validateAndRefreshIdleSessionById(sessionId);
        if (lifetime.status === "expired") {
            session = null;
        }
    }
    const ipAddress = resolveIpAddress(context.req.raw.headers);
    let mfaRequired = false;
    let mfaVerified = true;
    let mfaSetupRequired = false;
    const sessionUserId = session?.user?.id;
    if (typeof sessionUserId === "string" && sessionUserId.length > 0 && sessionId) {
        const mfaState = await resolveMfaContextState(sessionUserId, sessionId);
        mfaRequired = mfaState.mfaRequired;
        mfaVerified = mfaState.mfaVerified;
        mfaSetupRequired = false;
    }
    return {
        session: session,
        mfaRequired,
        mfaVerified,
        mfaSetupRequired,
        createCaller,
        ipAddress,
        req,
    };
}
