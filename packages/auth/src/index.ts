import { db } from "@npanel/db";
import * as authSchema from "@npanel/db/schema/auth";
import { userActivityLog } from "@npanel/db/schema/auth-extras";
import {
  notification,
  notificationActivityLog,
} from "@npanel/db/schema/notifications";
import { session, user } from "@npanel/db/schema/auth";
import { env } from "@npanel/env/server";
import {
  renderAccountEmailChangeEmail,
  renderEmailVerificationEmail,
  renderPasswordResetSuccessEmail,
  renderResetPasswordEmail,
} from "react-email-starter/src/email-templates";
import { sendAuthEmail } from "./transactional-email";
import {
  completeSignupSideEffects,
  isGoogleOAuthCallbackPath,
  isNewGoogleRegistration,
  sendGoogleSignupWelcomeEmail,
} from "./signup-side-effects";
import {
  applyStandardSessionExpiryByToken,
  validateAndRefreshIdleSessionById,
} from "./session-enforcement";
import { invalidateSessionCache } from "./session-cache";
import {
  ensurePendingMfaSession,
  handleIpAnomaly,
  maybeNotifyNewSignIn,
} from "./session-security";
import {
  readCachedUserEnrichment,
  writeCachedUserEnrichment,
} from "./user-enrich-cache";
import {
  parseSignupTermsCookie,
  recordTermsAcceptance,
  rollbackSignupWithoutTerms,
  signupRequestAcceptsTerms,
} from "./signup-terms";
import { STANDARD_SESSION_MAX_AGE_SEC, SESSION_TOUCH_THROTTLE_MS, resolveClientIp } from "./session-policy";
import {
  getRequestBrowserOrigin,
  isAllowedStorefrontBrowserRequest,
  isLandingPageOrigin,
  resolveLandingPageOrigins,
} from "./landing-page-origins";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { eq } from "@npanel/db";
import {
  adminAccessRoles,
  adminAcController,
  agencyAdminRoles,
  IMPERSONATION_SESSION_DURATION_SEC,
} from "./admin-access";
import { isImpersonatedSession } from "./impersonation";

function resolveRequestIp(headers: Headers | null | undefined): string | null {
  return resolveClientIp(headers);
}

const resolvedTrustedOrigins = (() => {
  const addUrlToList = (list: string[], url: string | undefined) => {
    if (url) {
      const normalized = url.replace(/\/+$/, "");
      if (!list.includes(normalized)) {
        list.push(normalized);
      }
    }
  };

  const addLandingPageOrigins = (list: string[]) => {
    // Defaults (www, staging, Vercel) plus LANDING_PAGE_ORIGINS env extras.
    for (const origin of resolveLandingPageOrigins()) {
      addUrlToList(list, origin);
    }
  };

  if (process.env.BETTER_AUTH_ACCEPT_ANY_HTTPS === "true") {
    const list = process.env.BETTER_AUTH_URLS
      ? process.env.BETTER_AUTH_URLS.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    addUrlToList(list, process.env.BETTER_AUTH_URL);
    addUrlToList(list, process.env.APP_URL);
    addUrlToList(list, process.env.CORS_ORIGIN);
    addLandingPageOrigins(list);

    const normalized = list.map((url) => url.replace(/\/+$/, ""));
    console.log(
      "[Better Auth Config] BETTER_AUTH_ACCEPT_ANY_HTTPS=true, using trustedOrigins:",
      normalized,
    );
    return normalized;
  }

  const list = process.env.BETTER_AUTH_URLS
    ? process.env.BETTER_AUTH_URLS.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (list.length > 0) {
    addUrlToList(list, process.env.BETTER_AUTH_URL);
    addUrlToList(list, process.env.APP_URL);
    addUrlToList(list, process.env.CORS_ORIGIN);
    addLandingPageOrigins(list);

    const normalized = list.map((url) => url.replace(/\/+$/, ""));
    console.log(
      "[Better Auth Config] Using BETTER_AUTH_URLS with additional URLs, trustedOrigins:",
      normalized,
    );
    return normalized;
  }

  if (process.env.BETTER_AUTH_URL) {
    const urls: string[] = [];
    addUrlToList(urls, process.env.BETTER_AUTH_URL);
    addUrlToList(urls, process.env.APP_URL);
    addUrlToList(urls, process.env.CORS_ORIGIN);
    addLandingPageOrigins(urls);

    const normalized = urls.map((url) => url.replace(/\/+$/, ""));
    console.log(
      "[Better Auth Config] Using BETTER_AUTH_URL with additional URLs, trustedOrigins:",
      normalized,
    );
    return normalized;
  }

  if (process.env.APP_URL) {
    const urls = [process.env.APP_URL.replace(/\/+$/, "")];
    addLandingPageOrigins(urls);
    const normalized = urls.map((url) => url.replace(/\/+$/, ""));
    console.log("[Better Auth Config] Using APP_URL + landing origins as trustedOrigins:", normalized);
    return normalized;
  }

  console.log(
    "[Better Auth Config] No trusted origins configured, setting to undefined",
  );
  return undefined;
})();

const frontendBaseUrl = () => {
  const raw =
    process.env.APP_URL || process.env.CORS_ORIGIN || env.CORS_ORIGIN || "http://localhost:3002";
  // Avoid `//auth/...` when env has a trailing slash (e.g. http://host:5173/)
  return raw.replace(/\/+$/, "");
};

/** Peek JWT payload without verifying (used only to pick the right email template). */
function peekEmailVerificationToken(token: string): {
  requestType?: string;
  updateTo?: string;
  email?: string;
} | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    return JSON.parse(json) as {
      requestType?: string;
      updateTo?: string;
      email?: string;
    };
  } catch {
    return null;
  }
}

/** User-facing origin for OAuth callbacks and redirects (must match the SPA / proxy origin). */
const authBaseUrl = () => {
  const raw =
    process.env.CORS_ORIGIN ||
    process.env.APP_URL ||
    process.env.VITE_PUBLIC_APP_URL ||
    env.CORS_ORIGIN ||
    env.BETTER_AUTH_URL;
  return raw.replace(/\/+$/, "");
};

export const auth = betterAuth<BetterAuthOptions>({
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
  databaseHooks: {
    session: {
      create: {
        async before(session, ctx) {
          // Harden Better Auth impersonation: only AGENCY_SUPER_ADMIN → ACTIVE CUSTOMER.
          if (!isImpersonatedSession(session)) return;

          const current = ctx?.context?.session?.session as
            | { impersonatedBy?: string | null }
            | undefined;
          if (isImpersonatedSession(current)) {
            throw new APIError("FORBIDDEN", {
              message: "Stop the current login-as-customer session before starting another",
            });
          }

          const actorId = session.impersonatedBy!;
          const targetId = session.userId;

          const [actor] = await db
            .select({ id: user.id, role: user.role, status: user.status })
            .from(user)
            .where(eq(user.id, actorId))
            .limit(1);

          if (!actor || actor.role !== "AGENCY_SUPER_ADMIN" || actor.status !== "ACTIVE") {
            throw new APIError("FORBIDDEN", {
              message: "Only an active agency super admin can impersonate customers",
            });
          }

          const [target] = await db
            .select({ id: user.id, role: user.role, status: user.status })
            .from(user)
            .where(eq(user.id, targetId))
            .limit(1);

          if (!target || target.role !== "CUSTOMER") {
            throw new APIError("FORBIDDEN", {
              message: "You can only login as customer accounts",
            });
          }

          if (target.status !== "ACTIVE") {
            throw new APIError("FORBIDDEN", {
              message: `Cannot login as a ${target.status.toLowerCase()} customer account`,
            });
          }
        },
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "CUSTOMER",
      adminRoles: [...agencyAdminRoles],
      ac: adminAcController,
      roles: adminAccessRoles,
      impersonationSessionDuration: IMPERSONATION_SESSION_DURATION_SEC,
    }),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const isForgetPassword =
        ctx.path === "/request-password-reset" ||
        ctx.path === "/forget-password" ||
        ctx.path === "/forgot-password";
      if (isForgetPassword) {
        const email = (ctx.body as { email?: string } | undefined)?.email;
        if (email && typeof email === "string") {
          const rows = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, email))
            .limit(1);
          if (!rows[0]) {
            throw new APIError("NOT_FOUND", {
              message:
                "No account found with this email address. The email may be invalid or not registered. Please check the address or sign up for an account.",
            });
          }
        }
      }

      if (ctx.path.startsWith("/sign-up")) {
        if (!signupRequestAcceptsTerms(ctx.body)) {
          throw new APIError("BAD_REQUEST", {
            message:
              "You must accept the Terms and Conditions before creating an account.",
          });
        }
      }

      if (ctx.path === "/sign-in/email" || ctx.path.endsWith("/sign-in/email")) {
        const email = (ctx.body as { email?: string } | undefined)?.email;
        if (email) {
          const rows = await db
            .select({ id: user.id, status: user.status })
            .from(user)
            .where(eq(user.email, email))
            .limit(1);
          const u = rows[0];
          if (u && u.status !== "ACTIVE") {
            void db
              .insert(userActivityLog)
              .values({
                id: crypto.randomUUID(),
                userId: u.id,
                action: "LOGIN_BLOCKED",
                description: `Login blocked due to account status: ${u.status}`,
                metadata: { status: u.status, reason: "Account not active" },
                ipAddress: resolveRequestIp(ctx.headers) || "unknown",
                userAgent: ctx.headers?.get("user-agent") || "unknown",
                createdAt: new Date(),
              })
              .catch((error) =>
                console.error("Failed to log blocked login activity:", error),
              );

            throw new APIError("FORBIDDEN", {
              message: `Account is ${u.status.toLowerCase()}. Please contact support.`,
            });
          }
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const isSignOut =
        ctx.path === "/sign-out" ||
        ctx.path.endsWith("/sign-out") ||
        ctx.path.includes("sign-out");
      if (isSignOut) {
        const signOutSessionId = ctx.context.session?.session?.id;
        if (typeof signOutSessionId === "string" && signOutSessionId.length > 0) {
          await invalidateSessionCache(signOutSessionId);
        }
      }

      const newSessionToken = ctx.context.newSession?.session?.token;
      const newSessionIsImpersonation = isImpersonatedSession(
        ctx.context.newSession?.session as { impersonatedBy?: string | null } | undefined,
      );
      // Impersonation keeps Better Auth's absolute duration; do not overwrite with idle TTL.
      if (
        typeof newSessionToken === "string" &&
        newSessionToken.length > 0 &&
        !newSessionIsImpersonation
      ) {
        try {
          await applyStandardSessionExpiryByToken(newSessionToken);
        } catch (error) {
          console.error("Failed to apply standard session expiry:", error);
        }
      }

      const isImpersonatePath =
        ctx.path === "/admin/impersonate-user" ||
        ctx.path.endsWith("/admin/impersonate-user");
      if (isImpersonatePath && newSessionIsImpersonation && ctx.context.newSession) {
        const impersonatedSession = ctx.context.newSession.session as {
          id?: string;
          userId?: string;
          impersonatedBy?: string;
        };
        const actorId = impersonatedSession.impersonatedBy;
        const targetUserId = impersonatedSession.userId;
        if (actorId && targetUserId) {
          void db
            .insert(userActivityLog)
            .values({
              id: crypto.randomUUID(),
              userId: actorId,
              action: "IMPERSONATION_STARTED",
              description: "Agency super admin started login-as-customer session",
              metadata: {
                targetUserId,
                impersonationSessionId: impersonatedSession.id ?? null,
              },
              ipAddress: resolveRequestIp(ctx.headers) || "unknown",
              userAgent: ctx.headers?.get("user-agent") || "unknown",
              createdAt: new Date(),
            })
            .catch((error) =>
              console.error("Failed to log impersonation start:", error),
            );
        }
      }

      const isStopImpersonatePath =
        ctx.path === "/admin/stop-impersonating" ||
        ctx.path.endsWith("/admin/stop-impersonating");
      if (isStopImpersonatePath) {
        const prior = ctx.context.session?.session as
          | { impersonatedBy?: string; userId?: string; id?: string }
          | undefined;
        if (isImpersonatedSession(prior) && prior?.impersonatedBy) {
          void db
            .insert(userActivityLog)
            .values({
              id: crypto.randomUUID(),
              userId: prior.impersonatedBy,
              action: "IMPERSONATION_STOPPED",
              description: "Agency super admin stopped login-as-customer session",
              metadata: {
                targetUserId: prior.userId ?? null,
                impersonationSessionId: prior.id ?? null,
              },
              ipAddress: resolveRequestIp(ctx.headers) || "unknown",
              userAgent: ctx.headers?.get("user-agent") || "unknown",
              createdAt: new Date(),
            })
            .catch((error) =>
              console.error("Failed to log impersonation stop:", error),
            );
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
              ? Object.keys(sessionUser as Record<string, unknown>)
              : null,
            sessionUserId: sessionUser ? (sessionUser as any).id : null,
            sessionUserStatus: sessionUser ? (sessionUser as any).status : null,
            sessionUserRole: sessionUser ? (sessionUser as any).role : null,
            sessionUserAgencyRoleId: sessionUser ? (sessionUser as any).agencyRoleId : null,
          });
        }

        const sessionId = ctx.context.session?.session?.id;
        if (typeof sessionId === "string" && sessionId.length > 0) {
          const requestUa = ctx.headers?.get("user-agent") ?? null;
          const requestIp = resolveRequestIp(ctx.headers);
          const softFail =
            isLandingPageOrigin(
              getRequestBrowserOrigin(ctx.headers ?? new Headers()),
            ) ||
            isAllowedStorefrontBrowserRequest(ctx.headers ?? undefined);
          // Do not rotate the session token on idle refresh. Rotating the DB token while
          // parallel tRPC/API requests still carry the previous cookie logs the active user out.
          // Idle extension only bumps expiresAt; UA bind + IP step-up + revoke-all cover theft.
          // softFail: storefront/landing probes must not delete the session or clear cookies.
          const lifetime = await validateAndRefreshIdleSessionById(sessionId, {
            userAgent: requestUa,
            ipAddress: requestIp,
            rotateToken: false,
            softFail,
          });
          if (lifetime.status === "expired") {
            ctx.context.session = null;
            const returned = ctx.context.returned as
              | { session?: { expiresAt?: Date | string } | null; user?: unknown }
              | undefined;
            if (returned && typeof returned === "object") {
              returned.session = null;
              returned.user = null;
            }
            if (!softFail) {
              try {
                const setCookie = (ctx as { setCookie?: Function }).setCookie;
                const authCookies = (ctx.context as { authCookies?: { sessionToken?: { name: string; attributes: Record<string, unknown> } } }).authCookies;
                if (typeof setCookie === "function" && authCookies?.sessionToken) {
                  setCookie(authCookies.sessionToken.name, "", {
                    ...authCookies.sessionToken.attributes,
                    maxAge: 0,
                  });
                }
              } catch {
                // Best-effort cookie clear on expiry / UA mismatch.
              }
            }
            return;
          }

          if (lifetime.ipAnomaly && lifetime.userId && !softFail) {
            try {
              const anomaly = await handleIpAnomaly({
                userId: lifetime.userId,
                sessionId,
                ipAddress: requestIp,
                userAgent: requestUa,
                expiresAt: lifetime.expiresAt,
              });
              if (anomaly.invalidated) {
                ctx.context.session = null;
                const returned = ctx.context.returned as
                  | { session?: unknown; user?: unknown }
                  | undefined;
                if (returned && typeof returned === "object") {
                  returned.session = null;
                  returned.user = null;
                }
                return;
              }
            } catch (error) {
              console.error("[auth][get-session] IP anomaly handling failed:", error);
            }
          }

          if (lifetime.extended) {
            const returned = ctx.context.returned as
              | { session?: { expiresAt?: Date | string } | null; user?: unknown }
              | undefined;
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
        const sessionUser = ctx.context.session.user as any;

        // Always enrich DB-backed status+role when we have a session.
        // This makes session payload consistent even if Better Auth calls the
        // session endpoint under different internal mount paths.
        let userWithStatusRole = await readCachedUserEnrichment(sessionUser.id);

        if (!userWithStatusRole) {
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

          const row = rows[0];
          if (row) {
            await writeCachedUserEnrichment(sessionUser.id, row);
            userWithStatusRole = {
              status: row.status,
              role: row.role,
              lastAccessedTeamId: row.lastAccessedTeamId,
              createdAt: row.createdAt.toISOString(),
              image: row.image,
            };
          }
        }
        if (userWithStatusRole) {
          const normalizedRole =
            typeof userWithStatusRole.role === "string"
              ? userWithStatusRole.role.trim().toUpperCase()
              : userWithStatusRole.role;
          const createdAt =
            typeof userWithStatusRole.createdAt === "string"
              ? new Date(userWithStatusRole.createdAt)
              : userWithStatusRole.createdAt;

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
            lastAccessedTeamId:
              userWithStatusRole.lastAccessedTeamId ?? sessionUser.lastAccessedTeamId,
            createdAt,
            image: userWithStatusRole.image ?? sessionUser.image ?? null,
          };

          ctx.context.session.user = enrichedUser;

          // If this is a get-session call, we MUST return the enriched data in the response.
          // Better Auth's default handler doesn't know about our manual ctx.context.session.user modification
          // unless we explicitly return the JSON here in the 'after' hook.
          const returned = ctx.context.returned as any;
          if (isGetSession && returned && typeof returned === "object") {
            returned.user = enrichedUser;
          }
        }
      }

      if (ctx.path === "/sign-in/email" || ctx.path.endsWith("/sign-in/email")) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          const loginUserId = newSession.user.id;
          const loginSessionId = newSession.session?.id;
          const loginHeaders = ctx.headers;
          const loginIp = resolveRequestIp(loginHeaders);
          const loginUa = loginHeaders?.get("user-agent") || null;

          void db
            .transaction(async (tx) => {
              await tx
                .update(user)
                .set({ lastLoginAt: new Date() })
                .where(eq(user.id, loginUserId));

              await tx.insert(userActivityLog).values({
                id: crypto.randomUUID(),
                userId: loginUserId,
                action: "LOGIN_SUCCESS",
                description: "User successfully logged in",
                metadata: {
                  loginMethod: "email_password",
                  sessionDuration: "30 minutes idle",
                },
                ipAddress: loginIp || "unknown",
                userAgent: loginUa || "unknown",
                createdAt: new Date(),
              });
            })
            .catch((error) => console.error("Failed to update login-related data:", error));

          if (loginSessionId) {
            void ensurePendingMfaSession(loginUserId, loginSessionId).catch((error) =>
              console.error("Failed to ensure MFA session on login:", error),
            );
            void maybeNotifyNewSignIn({
              userId: loginUserId,
              sessionId: loginSessionId,
              ipAddress: loginIp,
              userAgent: loginUa,
            });
          }

          // Keep a lightweight in-app notice for every email login (existing UX).
          void db
            .transaction(async (tx) => {
                const accessTime = new Date().toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                });
                const ipDisplay = loginIp ? ` from ${loginIp}` : "";
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
                    ipAddress: loginIp,
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
                  metadata: { ipAddress: loginIp, accessTime },
                  ipAddress: loginIp,
                  userAgent: loginUa,
                  createdAt: new Date(),
                });
              })
              .catch((error) => console.error("Failed to create login notification:", error));
        }
      }

      if (ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        if (newSession?.user?.id) {
          void recordTermsAcceptance(newSession.user.id).catch((error) =>
            console.error("Failed to record terms acceptance on sign-up:", error),
          );
          void completeSignupSideEffects({
            userId: newSession.user.id,
            sessionId: newSession.session?.id,
            emailVerified: Boolean(newSession.user.emailVerified),
            signupMethod: "email_password",
            headers: ctx.headers,
          }).catch((error) =>
            console.error("Failed to log signup / create signup notification:", error),
          );
        }
      }

      if (isGoogleOAuthCallbackPath(ctx.path)) {
        const newSession = ctx.context.newSession;
        if (newSession?.user) {
          const signupUserId = newSession.user.id;
          const googleSessionId = newSession.session?.id;
          const googleIp = resolveRequestIp(ctx.headers);
          const googleUa = ctx.headers?.get("user-agent") || null;

          void (async () => {
            const rows = await db
              .select({ createdAt: user.createdAt })
              .from(user)
              .where(eq(user.id, signupUserId))
              .limit(1);

            const isNewRegistration = isNewGoogleRegistration(
              ctx.context.returned,
              rows[0]?.createdAt,
            );

            if (!isNewRegistration) {
              // Returning Google sign-in: MFA gate + security notify + lastLoginAt.
              await db
                .update(user)
                .set({ lastLoginAt: new Date() })
                .where(eq(user.id, signupUserId));

              await db.insert(userActivityLog).values({
                id: crypto.randomUUID(),
                userId: signupUserId,
                action: "LOGIN_SUCCESS",
                description: "User successfully logged in",
                metadata: {
                  loginMethod: "google",
                  sessionDuration: "30 minutes idle",
                },
                ipAddress: googleIp || "unknown",
                userAgent: googleUa || "unknown",
                createdAt: new Date(),
              });

              if (googleSessionId) {
                await ensurePendingMfaSession(signupUserId, googleSessionId);
                await maybeNotifyNewSignIn({
                  userId: signupUserId,
                  sessionId: googleSessionId,
                  ipAddress: googleIp,
                  userAgent: googleUa,
                });
              }
              return;
            }

            if (!parseSignupTermsCookie(ctx.headers?.get("cookie"))) {
              try {
                await rollbackSignupWithoutTerms(
                  signupUserId,
                  newSession.session?.id,
                );
              } catch (error) {
                console.error("Failed to rollback Google sign-up without terms:", error);
              }
              throw new APIError("BAD_REQUEST", {
                message:
                  "You must accept the Terms and Conditions before signing up with Google.",
              });
            }

            try {
              await recordTermsAcceptance(signupUserId);
            } catch (error) {
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
          })().catch((error) =>
            console.error("Failed Google signup side effects / welcome email:", error),
          );
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
                ipAddress: resolveRequestIp(ctx.headers) || "unknown",
                userAgent: ctx.headers?.get("user-agent") || "unknown",
                createdAt: new Date(),
              });
            });
          } catch (error) {
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
                ipAddress: resolveRequestIp(ctx.headers) || "unknown",
                userAgent: ctx.headers?.get("user-agent") || "unknown",
                createdAt: new Date(),
              });
            });

            try {
              const ipAddress = resolveRequestIp(ctx.headers);
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
            } catch (error) {
              console.error("Failed to create email verification notification:", error);
            }
          } catch (error) {
            console.error("Failed to log email verification activity:", error);
          }
        }
      }
    }),
  },
  user: {
    changeEmail: {
      enabled: true,
      // Always require verification before the email is updated (never updateEmailWithoutVerification).
      sendChangeEmailConfirmation: async ({ user: u, newEmail, token }) => {
        void (async () => {
          try {
            await db.insert(userActivityLog).values({
              id: crypto.randomUUID(),
              userId: u.id,
              action: "EMAIL_CHANGE_CONFIRMATION_SENT",
              description: "Email change confirmation link sent to current email",
              metadata: {
                currentEmail: u.email,
                newEmail,
                token: token.substring(0, 8) + "...",
              },
              ipAddress: "unknown",
              userAgent: "unknown",
              createdAt: new Date(),
            });
          } catch (error) {
            console.error("Failed to log email change confirmation activity:", error);
          }

          try {
            const nid = crypto.randomUUID();
            await db.insert(notification).values({
              id: nid,
              userId: u.id,
              teamId: null,
              type: "SYSTEM",
              priority: "HIGH",
              title: "Approve Email Change",
              message: `A request was made to change your account email to ${newEmail}. Check your current inbox to approve it.`,
              link: null,
              metadata: {
                currentEmail: u.email,
                newEmail,
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
              description: "Email change confirmation notification created",
              metadata: { newEmail },
              ipAddress: null,
              userAgent: null,
              createdAt: new Date(),
            });
          } catch (error) {
            console.error("Failed to create email change confirmation notification:", error);
          }

          try {
            const base = frontendBaseUrl();
            const confirmUrl = `${base}/auth/verify-email?token=${token}`;
            const html = await renderAccountEmailChangeEmail({
              userFirstname: u.name || "User",
              newEmail,
              actionLink: confirmUrl,
              purpose: "confirm",
            });

            await sendAuthEmail({
              to: u.email,
              subject: "Approve your email change - Nisc Cloud®",
              html,
            });
          } catch (error) {
            console.error("Failed to send email change confirmation:", error);
          }
        })();
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user: u, url, token }) => {
      void (async () => {
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
        } catch (error) {
          console.error("Failed to log password reset request activity:", error);
        }

        try {
          const base = frontendBaseUrl();
          const resetUrl = `${base}/auth/reset-password?token=${token}`;
          const html = await renderResetPasswordEmail({
            userFirstname: u.name || "User",
            resetPasswordLink: resetUrl,
          });

          await sendAuthEmail({
            to: u.email,
            subject: "Reset your password - Nisc Cloud®",
            html,
          });
        } catch (error) {
          console.error("Failed to send password reset email:", error);
        }
      })();
    },
    onPasswordReset: async ({ user: u }) => {
      void (async () => {
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
        } catch (error) {
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
        } catch (error) {
          console.error("Failed to create password reset success notification:", error);
        }

        try {
          const base = frontendBaseUrl();
          const loginLink = `${base}/auth/login`;

          const html = await renderPasswordResetSuccessEmail({
            userFirstname: u.name || "User",
            loginLink,
          });

          await sendAuthEmail({
            to: u.email,
            subject: "Password reset successful - Nisc Cloud®",
            html,
          });
        } catch (error) {
          console.error("Failed to send password reset success email:", error);
        }
      })();
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user: u, url, token }) => {
      void (async () => {
        const tokenPayload = peekEmailVerificationToken(token);
        const isEmailChangeVerification =
          tokenPayload?.requestType === "change-email-verification";

        try {
          await db.insert(userActivityLog).values({
            id: crypto.randomUUID(),
            userId: u.id,
            action: isEmailChangeVerification
              ? "EMAIL_CHANGE_VERIFICATION_SENT"
              : "EMAIL_VERIFICATION_SENT",
            description: isEmailChangeVerification
              ? "Email change verification link sent to new email"
              : "Email verification link sent to user",
            metadata: {
              email: u.email,
              token: token.substring(0, 8) + "...",
              verificationMethod: "email_link",
              ...(isEmailChangeVerification
                ? { requestType: "change-email-verification" }
                : {}),
            },
            ipAddress: "unknown",
            userAgent: "unknown",
            createdAt: new Date(),
          });
        } catch (error) {
          console.error("Failed to log email verification request activity:", error);
        }

        try {
          const message = isEmailChangeVerification
            ? `Please check ${u.email} and click the verification link to finish changing your account email.`
            : "Please check your email to verify your account. Click the verification link in the email to activate your account.";

          const nid = crypto.randomUUID();
          await db.insert(notification).values({
            id: nid,
            userId: u.id,
            teamId: null,
            type: "SYSTEM",
            priority: "NORMAL",
            title: isEmailChangeVerification ? "Verify Your New Email" : "Verify Your Email",
            message,
            link: null,
            metadata: {
              verificationMethod: "email_link",
              email: u.email,
              ...(isEmailChangeVerification
                ? { requestType: "change-email-verification" }
                : {}),
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
            description: isEmailChangeVerification
              ? "Email change verification sent notification created"
              : "Email verification sent notification created",
            metadata: {
              verificationMethod: "email_link",
            },
            ipAddress: null,
            userAgent: null,
            createdAt: new Date(),
          });
        } catch (error) {
          console.error("Failed to create email verification sent notification:", error);
        }

        try {
          const base = frontendBaseUrl();
          const verificationUrl = `${base}/auth/verify-email?token=${token}`;

          if (isEmailChangeVerification) {
            const html = await renderAccountEmailChangeEmail({
              userFirstname: u.name || "User",
              newEmail: u.email,
              actionLink: verificationUrl,
              purpose: "verify",
            });

            await sendAuthEmail({
              to: u.email,
              subject: "Verify your new email - Nisc Cloud®",
              html,
            });
          } else {
            const html = await renderEmailVerificationEmail({
              userFirstname: u.name || "User",
              verificationLink: verificationUrl,
            });

            await sendAuthEmail({
              to: u.email,
              subject: "Welcome to Nisc Cloud® - Verify your email",
              html,
            });
          }
        } catch (error) {
          console.error("Failed to send verification email:", error);
        }
      })();
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600,
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "true-client-ip", "x-real-ip", "x-forwarded-for"],
    },
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
        const explicit = process.env.BETTER_AUTH_COOKIE_SAMESITE as
          | "lax"
          | "strict"
          | "none"
          | undefined;
        if (explicit) return explicit;

        const url =
          process.env.APP_URL ||
          process.env.CORS_ORIGIN ||
          process.env.BETTER_AUTH_URL ||
          env.CORS_ORIGIN ||
          "";
        const isHttps = url.startsWith("https://");
        return env.NODE_ENV === "production" && isHttps ? "none" : "lax";
      })(),
      secure: (() => {
        if (process.env.BETTER_AUTH_SECURE_COOKIES === "true") return true;
        const url =
          process.env.APP_URL ||
          process.env.CORS_ORIGIN ||
          process.env.BETTER_AUTH_URL ||
          env.CORS_ORIGIN ||
          "";
        const isHttps = url.startsWith("https://");
        return env.NODE_ENV === "production" && isHttps;
      })(),
      httpOnly: true,
      // Share session across npanel.* and www.* on the real domain so the
      // storefront cart can see an existing nPanel login. Skip on *.run.app /
      // localhost / raw IPs ( Domains are invalid or wrong there ).
      domain: (() => {
        const explicit = process.env.BETTER_AUTH_COOKIE_DOMAIN?.trim();
        if (explicit) return explicit;
        const url =
          process.env.APP_URL ||
          process.env.CORS_ORIGIN ||
          process.env.BETTER_AUTH_URL ||
          env.CORS_ORIGIN ||
          "";
        try {
          const host = new URL(url).hostname.toLowerCase();
          if (host === "nisccloud.com" || host.endsWith(".nisccloud.com")) {
            return ".nisccloud.com";
          }
        } catch {
          /* ignore */
        }
        return undefined;
      })(),
    },
  },
});
