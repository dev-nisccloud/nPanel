import { db } from "@npanel/db";
import * as authSchema from "@npanel/db/schema/auth";
import { userActivityLog, userMfaSession, userMfaSettings } from "@npanel/db/schema/auth-extras";
import { notification, notificationActivityLog, } from "@npanel/db/schema/notifications";
import { session, user } from "@npanel/db/schema/auth";
import { env } from "@npanel/env/server";
import { renderEmailVerificationEmail, renderPasswordResetSuccessEmail, renderResetPasswordEmail, } from "react-email-starter/src/email-templates";
import { sendTransactionalEmail } from "./transactional-email";
import { completeSignupSideEffects, isGoogleOAuthCallbackPath, isNewGoogleRegistration, sendGoogleSignupWelcomeEmail, } from "./signup-side-effects";
import { applyStandardSessionExpiryByToken, validateAndRefreshIdleSessionById, } from "./session-enforcement";
import { invalidateSessionCache } from "./session-cache";
import { parseSignupTermsCookie, recordTermsAcceptance, rollbackSignupWithoutTerms, signupRequestAcceptsTerms, } from "./signup-terms";
import { STANDARD_SESSION_MAX_AGE_SEC, SESSION_TOUCH_THROTTLE_MS } from "./session-policy";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { and, eq } from "@npanel/db";
const resolvedTrustedOrigins = (() => {
    const addUrlToList = (list, url) => {
        if (url) {
            const normalized = url.replace(/\/+$/, "");
            if (!list.includes(normalized)) {
                list.push(normalized);
            }
        }
    };
    if (process.env.BETTER_AUTH_ACCEPT_ANY_HTTPS === "true") {
        const list = process.env.BETTER_AUTH_URLS
            ? process.env.BETTER_AUTH_URLS.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        addUrlToList(list, process.env.BETTER_AUTH_URL);
        addUrlToList(list, process.env.APP_URL);
        addUrlToList(list, process.env.CORS_ORIGIN);
        const normalized = list.map((url) => url.replace(/\/+$/, ""));
        console.log("[Better Auth Config] BETTER_AUTH_ACCEPT_ANY_HTTPS=true, using trustedOrigins:", normalized);
        return normalized;
    }
    const list = process.env.BETTER_AUTH_URLS
        ? process.env.BETTER_AUTH_URLS.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    if (list.length > 0) {
        addUrlToList(list, process.env.BETTER_AUTH_URL);
        addUrlToList(list, process.env.APP_URL);
        addUrlToList(list, process.env.CORS_ORIGIN);
        const normalized = list.map((url) => url.replace(/\/+$/, ""));
        console.log("[Better Auth Config] Using BETTER_AUTH_URLS with additional URLs, trustedOrigins:", normalized);
        return normalized;
    }
    if (process.env.BETTER_AUTH_URL) {
        const urls = [];
        addUrlToList(urls, process.env.BETTER_AUTH_URL);
        addUrlToList(urls, process.env.APP_URL);
        addUrlToList(urls, process.env.CORS_ORIGIN);
        const normalized = urls.map((url) => url.replace(/\/+$/, ""));
        console.log("[Better Auth Config] Using BETTER_AUTH_URL with additional URLs, trustedOrigins:", normalized);
        return normalized;
    }
    if (process.env.APP_URL) {
        const normalized = process.env.APP_URL.replace(/\/+$/, "");
        console.log("[Better Auth Config] Using APP_URL as trustedOrigin:", normalized);
        return [normalized];
    }
    console.log("[Better Auth Config] No trusted origins configured, setting to undefined");
    return undefined;
})();
const frontendBaseUrl = () => {
    const raw = process.env.APP_URL || process.env.CORS_ORIGIN || env.CORS_ORIGIN || "http://localhost:3002";
    // Avoid `//auth/...` when env has a trailing slash (e.g. http://host:5173/)
    return raw.replace(/\/+$/, "");
};
/** User-facing origin for OAuth callbacks and redirects (must match the SPA / proxy origin). */
const authBaseUrl = () => {
    const raw = process.env.CORS_ORIGIN ||
        process.env.APP_URL ||
        process.env.VITE_PUBLIC_APP_URL ||
        env.CORS_ORIGIN ||
        env.BETTER_AUTH_URL;
    return raw.replace(/\/+$/, "");
};
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: authSchema,
    }),
    trustedOrigins: resolvedTrustedOrigins,
    baseURL: authBaseUrl(),
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },
    session: {
        // 30-minute idle timeout; extended silently while the user is active.
        expiresIn: STANDARD_SESSION_MAX_AGE_SEC,
        updateAge: SESSION_TOUCH_THROTTLE_MS / 1000,
        disableSessionRefresh: false,
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            const isForgetPassword = ctx.path === "/request-password-reset" ||
                ctx.path === "/forget-password" ||
                ctx.path === "/forgot-password";
            if (isForgetPassword) {
                const email = ctx.body?.email;
                if (email && typeof email === "string") {
                    const rows = await db
                        .select({ id: user.id })
                        .from(user)
                        .where(eq(user.email, email))
                        .limit(1);
                    if (!rows[0]) {
                        throw new APIError("NOT_FOUND", {
                            message: "No account found with this email address. The email may be invalid or not registered. Please check the address or sign up for an account.",
                        });
                    }
                }
            }
            if (ctx.path.startsWith("/sign-up")) {
                if (!signupRequestAcceptsTerms(ctx.body)) {
                    throw new APIError("BAD_REQUEST", {
                        message: "You must accept the Terms and Conditions before creating an account.",
                    });
                }
            }
            if (ctx.path === "/sign-in/email" || ctx.path.endsWith("/sign-in/email")) {
                const email = ctx.body?.email;
                if (email) {
                    const rows = await db
                        .select({ id: user.id, status: user.status })
                        .from(user)
                        .where(eq(user.email, email))
                        .limit(1);
                    const u = rows[0];
                    if (u && u.status !== "ACTIVE") {
                        await db.transaction(async (tx) => {
                            await tx.insert(userActivityLog).values({
                                id: crypto.randomUUID(),
                                userId: u.id,
                                action: "LOGIN_BLOCKED",
                                description: `Login blocked due to account status: ${u.status}`,
                                metadata: { status: u.status, reason: "Account not active" },
                                ipAddress: ctx.headers?.get("x-forwarded-for") ||
                                    ctx.headers?.get("x-real-ip") ||
                                    "unknown",
                                userAgent: ctx.headers?.get("user-agent") || "unknown",
                                createdAt: new Date(),
                            });
                        });
                        throw new APIError("FORBIDDEN", {
                            message: `Account is ${u.status.toLowerCase()}. Please contact support.`,
                        });
                    }
                }
            }
        }),
        after: createAuthMiddleware(async (ctx) => {
            const isSignOut = ctx.path === "/sign-out" ||
                ctx.path.endsWith("/sign-out") ||
                ctx.path.includes("sign-out");
            if (isSignOut) {
                const signOutSessionId = ctx.context.session?.session?.id;
                if (typeof signOutSessionId === "string" && signOutSessionId.length > 0) {
                    await invalidateSessionCache(signOutSessionId);
                }
            }
            const newSessionToken = ctx.context.newSession?.session?.token;
            if (typeof newSessionToken === "string" && newSessionToken.length > 0) {
                try {
                    await applyStandardSessionExpiryByToken(newSessionToken);
                }
                catch (error) {
                    console.error("Failed to apply standard session expiry:", error);
                }
            }
            const isGetSession = 
            // Better Auth may call with different mount-relative paths depending on setup.
            // We just need to reliably detect the "get-session" endpoint.
            ctx.path === "/get-session" ||
                ctx.path.endsWith("/get-session") ||
                ctx.path.includes("get-session");
            if (isGetSession) {
                const sessionUser = ctx.context.session?.user;
                const cookie = ctx.headers?.get("cookie");
                if (process.env.NODE_ENV !== "production") {
                    console.log("[auth][get-session]", {
                        path: ctx.path,
                        cookiePresent: Boolean(cookie && cookie.length > 0),
                        cookieLen: cookie?.length ?? 0,
                        sessionUserPresent: Boolean(sessionUser),
                        sessionUserKeys: sessionUser
                            ? Object.keys(sessionUser)
                            : null,
                        sessionUserId: sessionUser ? sessionUser.id : null,
                        sessionUserStatus: sessionUser ? sessionUser.status : null,
                        sessionUserRole: sessionUser ? sessionUser.role : null,
                        sessionUserAgencyRoleId: sessionUser ? sessionUser.agencyRoleId : null,
                    });
                }
                const sessionId = ctx.context.session?.session?.id;
                if (typeof sessionId === "string" && sessionId.length > 0) {
                    const lifetime = await validateAndRefreshIdleSessionById(sessionId);
                    if (lifetime.status === "expired") {
                        ctx.context.session = null;
                        const returned = ctx.context.returned;
                        if (returned && typeof returned === "object") {
                            returned.session = null;
                            returned.user = null;
                        }
                        return;
                    }
                    if (lifetime.extended) {
                        const returned = ctx.context.returned;
                        if (returned?.session && typeof returned.session === "object") {
                            returned.session.expiresAt = lifetime.expiresAt;
                        }
                        if (ctx.context.session?.session) {
                            ctx.context.session.session.expiresAt = lifetime.expiresAt;
                        }
                    }
                }
            }
            if (ctx.context.session?.user) {
                const sessionUser = ctx.context.session.user;
                // Always enrich DB-backed status+role when we have a session.
                // This makes session payload consistent even if Better Auth calls the
                // session endpoint under different internal mount paths.
                const rows = await db
                    .select({
                    status: user.status,
                    role: user.role,
                    lastAccessedTeamId: user.lastAccessedTeamId,
                    createdAt: user.createdAt,
                    image: user.image,
                })
                    .from(user)
                    .where(eq(user.id, sessionUser.id))
                    .limit(1);
                const userWithStatusRole = rows[0];
                if (userWithStatusRole) {
                    const normalizedRole = typeof userWithStatusRole.role === "string"
                        ? userWithStatusRole.role.trim().toUpperCase()
                        : userWithStatusRole.role;
                    if (process.env.NODE_ENV !== "production" && isGetSession) {
                        console.log("[auth][get-session][enrich]", {
                            userId: sessionUser.id,
                            before: {
                                status: sessionUser.status,
                                role: sessionUser.role,
                            },
                            after: {
                                status: userWithStatusRole.status,
                                role: normalizedRole,
                            },
                        });
                    }
                    const enrichedUser = {
                        ...sessionUser,
                        status: userWithStatusRole.status,
                        role: normalizedRole,
                        lastAccessedTeamId: userWithStatusRole.lastAccessedTeamId ?? sessionUser.lastAccessedTeamId,
                        createdAt: userWithStatusRole.createdAt,
                        image: userWithStatusRole.image ?? sessionUser.image ?? null,
                    };
                    ctx.context.session.user = enrichedUser;
                    // If this is a get-session call, we MUST return the enriched data in the response.
                    // Better Auth's default handler doesn't know about our manual ctx.context.session.user modification
                    // unless we explicitly return the JSON here in the 'after' hook.
                    const returned = ctx.context.returned;
                    if (isGetSession && returned && typeof returned === "object") {
                        returned.user = enrichedUser;
                    }
                }
            }
            if (ctx.path === "/sign-in/email" || ctx.path.endsWith("/sign-in/email")) {
                const newSession = ctx.context.newSession;
                if (newSession) {
                    try {
                        await db.transaction(async (tx) => {
                            await tx
                                .update(user)
                                .set({ lastLoginAt: new Date() })
                                .where(eq(user.id, newSession.user.id));
                            const mfaRows = await tx
                                .select({ id: userMfaSettings.id })
                                .from(userMfaSettings)
                                .where(and(eq(userMfaSettings.userId, newSession.user.id), eq(userMfaSettings.emailOtpEnabled, true)))
                                .limit(1);
                            if (mfaRows[0] && newSession.session?.id) {
                                const existingMfaSession = await tx
                                    .select({ id: userMfaSession.id })
                                    .from(userMfaSession)
                                    .where(eq(userMfaSession.sessionId, newSession.session.id))
                                    .limit(1);
                                if (!existingMfaSession[0]) {
                                    await tx.insert(userMfaSession).values({
                                        id: crypto.randomUUID(),
                                        userId: newSession.user.id,
                                        sessionId: newSession.session.id,
                                        requiredAt: new Date(),
                                        verifiedAt: null,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                    });
                                }
                                else {
                                    await tx
                                        .update(userMfaSession)
                                        .set({
                                        userId: newSession.user.id,
                                        requiredAt: new Date(),
                                        verifiedAt: null,
                                        updatedAt: new Date(),
                                    })
                                        .where(eq(userMfaSession.sessionId, newSession.session.id));
                                }
                            }
                            await tx.insert(userActivityLog).values({
                                id: crypto.randomUUID(),
                                userId: newSession.user.id,
                                action: "LOGIN_SUCCESS",
                                description: "User successfully logged in",
                                metadata: {
                                    loginMethod: "email_password",
                                    sessionDuration: "30 minutes idle",
                                },
                                ipAddress: ctx.headers?.get("x-forwarded-for") ||
                                    ctx.headers?.get("x-real-ip") ||
                                    "unknown",
                                userAgent: ctx.headers?.get("user-agent") || "unknown",
                                createdAt: new Date(),
                            });
                        });
                        const loginUserId = newSession.user.id;
                        const loginHeaders = ctx.headers;
                        void db
                            .transaction(async (tx) => {
                            const ipAddress = loginHeaders?.get("x-forwarded-for") ||
                                loginHeaders?.get("x-real-ip") ||
                                null;
                            const accessTime = new Date().toLocaleString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZoneName: "short",
                            });
                            const ipDisplay = ipAddress ? ` from ${ipAddress}` : "";
                            const message = `Your account was recently accessed at ${accessTime}${ipDisplay}. If this was not you, kindly reach out to support to secure your account.`;
                            const nid = crypto.randomUUID();
                            await tx.insert(notification).values({
                                id: nid,
                                userId: loginUserId,
                                teamId: null,
                                type: "SYSTEM",
                                priority: "NORMAL",
                                title: "Account Access Notification",
                                message,
                                link: null,
                                metadata: {
                                    ipAddress,
                                    accessTime,
                                    loginMethod: "email_password",
                                },
                                seen: false,
                                readAt: null,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                            await tx.insert(notificationActivityLog).values({
                                id: crypto.randomUUID(),
                                notificationId: nid,
                                userId: loginUserId,
                                action: "CREATE",
                                description: "Login notification created",
                                metadata: { ipAddress, accessTime },
                                ipAddress,
                                userAgent: loginHeaders?.get("user-agent") || null,
                                createdAt: new Date(),
                            });
                        })
                            .catch((error) => console.error("Failed to create login notification:", error));
                    }
                    catch (error) {
                        console.error("Failed to update login-related data:", error);
                    }
                }
            }
            if (ctx.path.startsWith("/sign-up")) {
                const newSession = ctx.context.newSession;
                if (newSession?.user?.id) {
                    try {
                        await recordTermsAcceptance(newSession.user.id);
                    }
                    catch (error) {
                        console.error("Failed to record terms acceptance on sign-up:", error);
                    }
                    void completeSignupSideEffects({
                        userId: newSession.user.id,
                        sessionId: newSession.session?.id,
                        emailVerified: Boolean(newSession.user.emailVerified),
                        signupMethod: "email_password",
                        headers: ctx.headers,
                    }).catch((error) => console.error("Failed to log signup / create signup notification:", error));
                }
            }
            if (isGoogleOAuthCallbackPath(ctx.path)) {
                const newSession = ctx.context.newSession;
                if (newSession?.user) {
                    const signupUserId = newSession.user.id;
                    void (async () => {
                        const rows = await db
                            .select({ createdAt: user.createdAt })
                            .from(user)
                            .where(eq(user.id, signupUserId))
                            .limit(1);
                        if (!isNewGoogleRegistration(ctx.context.returned, rows[0]?.createdAt)) {
                            return;
                        }
                        if (!parseSignupTermsCookie(ctx.headers?.get("cookie"))) {
                            try {
                                await rollbackSignupWithoutTerms(signupUserId, newSession.session?.id);
                            }
                            catch (error) {
                                console.error("Failed to rollback Google sign-up without terms:", error);
                            }
                            throw new APIError("BAD_REQUEST", {
                                message: "You must accept the Terms and Conditions before signing up with Google.",
                            });
                        }
                        try {
                            await recordTermsAcceptance(signupUserId);
                        }
                        catch (error) {
                            console.error("Failed to record terms acceptance for Google sign-up:", error);
                        }
                        await completeSignupSideEffects({
                            userId: signupUserId,
                            sessionId: newSession.session?.id,
                            emailVerified: Boolean(newSession.user.emailVerified),
                            signupMethod: "google",
                            headers: ctx.headers,
                        });
                        await sendGoogleSignupWelcomeEmail({
                            userId: signupUserId,
                            email: newSession.user.email,
                            name: newSession.user.name,
                        });
                    })().catch((error) => console.error("Failed Google signup side effects / welcome email:", error));
                }
            }
            if (ctx.path === "/sign-out") {
                const sess = ctx.context.session;
                if (sess) {
                    try {
                        await db.transaction(async (tx) => {
                            await tx.insert(userActivityLog).values({
                                id: crypto.randomUUID(),
                                userId: sess.user.id,
                                action: "LOGOUT",
                                description: "User logged out",
                                ipAddress: ctx.headers?.get("x-forwarded-for") ||
                                    ctx.headers?.get("x-real-ip") ||
                                    "unknown",
                                userAgent: ctx.headers?.get("user-agent") || "unknown",
                                createdAt: new Date(),
                            });
                        });
                    }
                    catch (error) {
                        console.error("Failed to log logout activity:", error);
                    }
                }
            }
            if (ctx.path === "/verify-email") {
                const newSession = ctx.context.newSession;
                if (newSession) {
                    try {
                        await db.transaction(async (tx) => {
                            await tx.insert(userActivityLog).values({
                                id: crypto.randomUUID(),
                                userId: newSession.user.id,
                                action: "EMAIL_VERIFIED",
                                description: "User email address verified",
                                metadata: { email: newSession.user.email },
                                ipAddress: ctx.headers?.get("x-forwarded-for") ||
                                    ctx.headers?.get("x-real-ip") ||
                                    "unknown",
                                userAgent: ctx.headers?.get("user-agent") || "unknown",
                                createdAt: new Date(),
                            });
                        });
                        try {
                            const ipAddress = ctx.headers?.get("x-forwarded-for") ||
                                ctx.headers?.get("x-real-ip") ||
                                null;
                            const verificationTime = new Date().toLocaleString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZoneName: "short",
                            });
                            const ipDisplay = ipAddress ? ` from ${ipAddress}` : "";
                            const message = `Your email address has been successfully verified at ${verificationTime}${ipDisplay}. Your account is now fully activated.`;
                            await db.transaction(async (tx) => {
                                const nid = crypto.randomUUID();
                                await tx.insert(notification).values({
                                    id: nid,
                                    userId: newSession.user.id,
                                    teamId: null,
                                    type: "SYSTEM",
                                    priority: "NORMAL",
                                    title: "Email Verified",
                                    message,
                                    link: null,
                                    metadata: {
                                        ipAddress,
                                        verificationTime,
                                        email: newSession.user.email,
                                    },
                                    seen: false,
                                    readAt: null,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                });
                                await tx.insert(notificationActivityLog).values({
                                    id: crypto.randomUUID(),
                                    notificationId: nid,
                                    userId: newSession.user.id,
                                    action: "CREATE",
                                    description: "Email verification success notification created",
                                    metadata: { ipAddress, verificationTime },
                                    ipAddress,
                                    userAgent: ctx.headers?.get("user-agent") || null,
                                    createdAt: new Date(),
                                });
                            });
                        }
                        catch (error) {
                            console.error("Failed to create email verification notification:", error);
                        }
                    }
                    catch (error) {
                        console.error("Failed to log email verification activity:", error);
                    }
                }
            }
        }),
    },
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user: u, url, token }) => {
            console.log(`📧 SENDING PASSWORD RESET EMAIL: User ${u.email} requested password reset`);
            console.log(`Token: ${token}`);
            console.log(`Original URL: ${url}`);
            try {
                await db.insert(userActivityLog).values({
                    id: crypto.randomUUID(),
                    userId: u.id,
                    action: "PASSWORD_RESET_REQUESTED",
                    description: "User requested password reset via email",
                    metadata: {
                        email: u.email,
                        token: token.substring(0, 8) + "...",
                        requestMethod: "email_link",
                    },
                    ipAddress: "unknown",
                    userAgent: "unknown",
                    createdAt: new Date(),
                });
                console.log(`📝 Password reset request activity logged for user ${u.email}`);
            }
            catch (error) {
                console.error("Failed to log password reset request activity:", error);
            }
            const base = frontendBaseUrl();
            const resetUrl = `${base}/auth/reset-password?token=${token}`;
            console.log(`Reset URL: ${resetUrl}`);
            const html = await renderResetPasswordEmail({
                userFirstname: u.name || "User",
                resetPasswordLink: resetUrl,
            });
            await sendTransactionalEmail({
                userId: u.id,
                to: u.email,
                subject: "Reset your password - npanel",
                html,
            });
        },
        onPasswordReset: async ({ user: u }) => {
            console.log(`✅ PASSWORD RESET SUCCESS: Password for user ${u.email} has been reset successfully.`);
            console.log(`User ID: ${u.id}`);
            console.log(`Reset timestamp: ${new Date().toISOString()}`);
            try {
                await db.insert(userActivityLog).values({
                    id: crypto.randomUUID(),
                    userId: u.id,
                    action: "PASSWORD_RESET",
                    description: "User password was reset successfully",
                    metadata: {
                        email: u.email,
                        resetMethod: "email_link",
                    },
                    ipAddress: "unknown",
                    userAgent: "unknown",
                    createdAt: new Date(),
                });
                console.log(`📝 Password reset activity logged for user ${u.email}`);
            }
            catch (error) {
                console.error("Failed to log password reset activity:", error);
            }
            try {
                const resetTime = new Date().toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZoneName: "short",
                });
                const message = `Your password was successfully reset at ${resetTime}. If this was not you, please contact support immediately to secure your account.`;
                const nid = crypto.randomUUID();
                await db.insert(notification).values({
                    id: nid,
                    userId: u.id,
                    teamId: null,
                    type: "SYSTEM",
                    priority: "HIGH",
                    title: "Password Reset Successful",
                    message,
                    link: null,
                    metadata: {
                        resetTime,
                        resetMethod: "email_link",
                    },
                    seen: false,
                    readAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                await db.insert(notificationActivityLog).values({
                    id: crypto.randomUUID(),
                    notificationId: nid,
                    userId: u.id,
                    action: "CREATE",
                    description: "Password reset success notification created",
                    metadata: {
                        resetTime,
                        resetMethod: "email_link",
                    },
                    ipAddress: null,
                    userAgent: null,
                    createdAt: new Date(),
                });
            }
            catch (error) {
                console.error("Failed to create password reset success notification:", error);
            }
            try {
                const base = frontendBaseUrl();
                const loginLink = `${base}/auth/login`;
                const html = await renderPasswordResetSuccessEmail({
                    userFirstname: u.name || "User",
                    loginLink,
                });
                await sendTransactionalEmail({
                    userId: u.id,
                    to: u.email,
                    subject: "Password reset successful - npanel",
                    html,
                });
                console.log(`📧 Password reset success email sent to ${u.email}`);
            }
            catch (error) {
                console.error("Failed to send password reset success email:", error);
            }
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ user: u, url, token }) => {
            console.log(`📧 SENDING EMAIL VERIFICATION: User ${u.email} needs to verify their email`);
            console.log(`Token: ${token}`);
            console.log(`Original URL: ${url}`);
            try {
                await db.insert(userActivityLog).values({
                    id: crypto.randomUUID(),
                    userId: u.id,
                    action: "EMAIL_VERIFICATION_SENT",
                    description: "Email verification link sent to user",
                    metadata: {
                        email: u.email,
                        token: token.substring(0, 8) + "...",
                        verificationMethod: "email_link",
                    },
                    ipAddress: "unknown",
                    userAgent: "unknown",
                    createdAt: new Date(),
                });
                console.log(`📝 Email verification request activity logged for user ${u.email}`);
            }
            catch (error) {
                console.error("Failed to log email verification request activity:", error);
            }
            try {
                const message = "Please check your email to verify your account. Click the verification link in the email to activate your account.";
                const nid = crypto.randomUUID();
                await db.insert(notification).values({
                    id: nid,
                    userId: u.id,
                    teamId: null,
                    type: "SYSTEM",
                    priority: "NORMAL",
                    title: "Verify Your Email",
                    message,
                    link: null,
                    metadata: {
                        verificationMethod: "email_link",
                        email: u.email,
                    },
                    seen: false,
                    readAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                await db.insert(notificationActivityLog).values({
                    id: crypto.randomUUID(),
                    notificationId: nid,
                    userId: u.id,
                    action: "CREATE",
                    description: "Email verification sent notification created",
                    metadata: {
                        verificationMethod: "email_link",
                    },
                    ipAddress: null,
                    userAgent: null,
                    createdAt: new Date(),
                });
            }
            catch (error) {
                console.error("Failed to create email verification sent notification:", error);
            }
            const base = frontendBaseUrl();
            const verificationUrl = `${base}/auth/verify-email?token=${token}`;
            console.log(`Verification URL: ${verificationUrl}`);
            const html = await renderEmailVerificationEmail({
                userFirstname: u.name || "User",
                verificationLink: verificationUrl,
            });
            await sendTransactionalEmail({
                userId: u.id,
                to: u.email,
                subject: "Welcome to npanel - Verify your email",
                html,
            });
        },
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        expiresIn: 3600,
    },
    advanced: {
        defaultCookieAttributes: {
            // In production, the web SPA (npanel-web) and the API server (npanel-server) are on
            // separate Cloud Run subdomains under "run.app", which is in the Public Suffix List.
            // That means the browser treats them as cross-site, and sameSite:"lax" blocks cookies
            // in cross-origin fetch() calls   breaking getSession() entirely from the SPA.
            // sameSite:"none" allows cross-site fetch with credentials (requires secure:true,
            // which is already enforced in production below).
            // Cookies must be Secure when sameSite is "none". When running on plain HTTP
            // (common on LAN dev), Secure cookies will never be set/sent → getSession() stays null.
            // We auto-downgrade to lax + non-secure on HTTP to keep local/LAN dev working.
            sameSite: (() => {
                const explicit = process.env.BETTER_AUTH_COOKIE_SAMESITE;
                if (explicit)
                    return explicit;
                const url = process.env.APP_URL ||
                    process.env.CORS_ORIGIN ||
                    process.env.BETTER_AUTH_URL ||
                    env.CORS_ORIGIN ||
                    "";
                const isHttps = url.startsWith("https://");
                return env.NODE_ENV === "production" && isHttps ? "none" : "lax";
            })(),
            secure: (() => {
                if (process.env.BETTER_AUTH_SECURE_COOKIES === "true")
                    return true;
                const url = process.env.APP_URL ||
                    process.env.CORS_ORIGIN ||
                    process.env.BETTER_AUTH_URL ||
                    env.CORS_ORIGIN ||
                    "";
                const isHttps = url.startsWith("https://");
                return env.NODE_ENV === "production" && isHttps;
            })(),
            httpOnly: true,
        },
    },
});
