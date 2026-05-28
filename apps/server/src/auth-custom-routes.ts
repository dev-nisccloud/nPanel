import { auth } from "@npanel/auth";
import { sendMfaEmailOtp } from "@npanel/auth/mfa-email";
import { validateAndRefreshIdleSessionById } from "@npanel/auth/session-enforcement";
import { getRootRedirectTargetFromHeaders } from "@npanel/auth/root-redirect-target";
import { and, db, desc, eq, gt, isNull } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import {
  userActivityLog,
  userMfaChallenge,
  userMfaSession,
  userMfaSettings,
} from "@npanel/db/schema/auth-extras";
import { notification, notificationActivityLog } from "@npanel/db/schema/notifications";
import { env } from "@npanel/env/server";
import { createHash, randomInt, randomUUID } from "node:crypto";
import type { Hono } from "hono";

const FALLBACK_REDIRECT = "/auth/login";
const MFA_VERIFY_REDIRECT = "/auth/mfa";
const MFA_OTP_TTL_MINUTES = 10;
const MFA_MAX_ATTEMPTS = 5;
const MFA_RESEND_COOLDOWN_SECONDS = 45;

function frontendBase(): string {
  return env.CORS_ORIGIN.replace(/\/+$/, "") || "http://localhost:3002";
}

function hashMfaCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function getActiveAuthSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  const sessionId = session?.session?.id;
  if (typeof sessionId === "string" && sessionId.length > 0) {
    const lifetime = await validateAndRefreshIdleSessionById(sessionId);
    if (lifetime.status === "expired") return null;
  }
  return session;
}

async function getSessionUser(headers: Headers) {
  const session = await getActiveAuthSession(headers);
  return session?.user ?? null;
}

async function getSessionRecord(headers: Headers) {
  const session = await getActiveAuthSession(headers);
  return session?.session ?? null;
}

async function getMfaStateForUser(userId: string): Promise<{
  enabled: boolean;
  setupRequired: boolean;
}> {
  const rows = await db
    .select({
      emailOtpEnabled: userMfaSettings.emailOtpEnabled,
      setupRequired: userMfaSettings.setupRequired,
    })
    .from(userMfaSettings)
    .where(eq(userMfaSettings.userId, userId))
    .limit(1);
  return {
    enabled: rows[0]?.emailOtpEnabled === true,
    setupRequired: rows[0]?.setupRequired === true,
  };
}

async function isSessionMfaVerified(sessionId: string): Promise<boolean> {
  const rows = await db
    .select({ id: userMfaSession.id })
    .from(userMfaSession)
    .where(
      and(
        eq(userMfaSession.sessionId, sessionId),
        isNull(userMfaSession.verifiedAt),
      ),
    )
    .limit(1);
  return !rows[0];
}

async function logMfaActivity(params: {
  userId: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  headers: Headers;
}) {
  await db.insert(userActivityLog).values({
    id: randomUUID(),
    userId: params.userId,
    action: params.action,
    description: params.description,
    metadata: params.metadata ?? null,
    ipAddress:
      params.headers.get("x-forwarded-for") ??
      params.headers.get("x-real-ip") ??
      "unknown",
    userAgent: params.headers.get("user-agent") ?? "unknown",
    createdAt: new Date(),
  });
}

async function createMfaNotification(params: {
  userId: string;
  title: string;
  message: string;
  action: "MFA_ENABLED" | "MFA_DISABLED";
  headers: Headers;
}) {
  const now = new Date();
  const notificationId = randomUUID();
  const ipAddress =
    params.headers.get("x-forwarded-for") ??
    params.headers.get("x-real-ip") ??
    null;
  const userAgent = params.headers.get("user-agent") ?? null;

  await db.insert(notification).values({
    id: notificationId,
    userId: params.userId,
    teamId: null,
    type: "SYSTEM",
    priority: "NORMAL",
    title: params.title,
    message: params.message,
    link: null,
    metadata: {
      action: params.action,
      ipAddress,
    },
    seen: false,
    readAt: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(notificationActivityLog).values({
    id: randomUUID(),
    notificationId,
    userId: params.userId,
    action: "CREATE",
    description: `Notification created for ${params.action}`,
    metadata: {
      action: params.action,
      ipAddress,
    },
    ipAddress,
    userAgent,
    createdAt: now,
  });
}

async function issueAndSendMfaEmailOtp(params: {
  userId: string;
  sessionId: string;
  email: string;
  name: string | null | undefined;
}) {
  const now = new Date();

  const lastChallengeRows = await db
    .select({ createdAt: userMfaChallenge.createdAt })
    .from(userMfaChallenge)
    .where(
      and(
        eq(userMfaChallenge.userId, params.userId),
        eq(userMfaChallenge.sessionId, params.sessionId),
      ),
    )
    .orderBy(desc(userMfaChallenge.createdAt))
    .limit(1);

  const lastChallengeAt = lastChallengeRows[0]?.createdAt;
  if (lastChallengeAt) {
    const ageMs = now.getTime() - new Date(lastChallengeAt).getTime();
    if (ageMs < MFA_RESEND_COOLDOWN_SECONDS * 1000) {
      const waitSeconds = Math.ceil((MFA_RESEND_COOLDOWN_SECONDS * 1000 - ageMs) / 1000);
      return {
        ok: false as const,
        status: 429,
        message: `Please wait ${waitSeconds}s before requesting another code.`,
      };
    }
  }

  const code = generateOtpCode();
  const expiresAt = new Date(now.getTime() + MFA_OTP_TTL_MINUTES * 60 * 1000);
  await db.insert(userMfaChallenge).values({
    id: randomUUID(),
    userId: params.userId,
    sessionId: params.sessionId,
    codeHash: hashMfaCode(code),
    expiresAt,
    consumedAt: null,
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  });

  await sendMfaEmailOtp({
    userId: params.userId,
    to: params.email,
    userFirstname: params.name || "User",
    otpCode: code,
    expiresInMinutes: MFA_OTP_TTL_MINUTES,
  });

  return {
    ok: true as const,
    status: 200,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Custom auth-related routes that must run before `auth.handler` on `/api/auth/*`.
 * Parity with previous Next.js `app/api/auth/*` handlers (redirect-target, verify-email, password reset).
 */
export function registerAuthCustomRoutes(app: Hono) {
  app.get("/api/auth/redirect-target", async (c) => {
    try {
      if (process.env.NODE_ENV !== "production") {
        const cookie = c.req.raw.headers.get("cookie") ?? "";
        console.log("[server][redirect-target]", {
          host: c.req.raw.headers.get("host") ?? undefined,
          cookiePresent: cookie.length > 0,
          cookieLen: cookie.length,
        });
      }

      const requestedRedirect =
        c.req.query("redirect") ?? c.req.query("returnUrl") ?? null;
      const target = await getRootRedirectTargetFromHeaders(
        c.req.raw.headers,
        requestedRedirect,
      ).catch(err => {
        console.error("[server][redirect-target] getRootRedirectTargetFromHeaders CRASHED:", err);
        throw err;
      });
      let redirect = typeof target === "string" && target ? target : FALLBACK_REDIRECT;
      const sessionRecord = await getSessionRecord(c.req.raw.headers);
      if (sessionRecord?.id && sessionRecord.userId) {
        const mfaState = await getMfaStateForUser(sessionRecord.userId);
        if (mfaState.enabled) {
          const verified = await isSessionMfaVerified(sessionRecord.id);
          if (!verified) {
            const preferredPostMfaTarget =
              (typeof requestedRedirect === "string" && requestedRedirect.trim()
                ? requestedRedirect.trim()
                : target) || "/";
            const mfaQuery = new URLSearchParams({
              redirect: preferredPostMfaTarget,
            }).toString();
            redirect = `${MFA_VERIFY_REDIRECT}?${mfaQuery}`;
          }
        }
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("[server][redirect-target][result]", { redirect });
      }
      return c.json({ redirect });
    } catch (err) {
      console.error("[server][redirect-target] Uncaught error in route handler:", err);
      if (process.env.NODE_ENV === "production") {
        console.error("[redirect-target] Error (sending fallback redirect)");
      } else {
        console.error("[redirect-target] Error detail:", err);
      }
      return c.json({ redirect: FALLBACK_REDIRECT }, 200);
    }
  });

  app.get("/api/auth/verify-email", async (c) => {
    try {
      const token = c.req.query("token");
      if (!token) {
        return c.json({ error: "Missing verification token" }, 400);
      }

      const result = await auth.api.verifyEmail({
        query: { token },
      });

      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error
      ) {
        return c.json(
          {
            error:
              (result.error as Error).message || "Failed to verify email",
          },
          400,
        );
      }

      return c.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error: unknown) {
      console.error("Email verification API error:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to verify email",
        },
        500,
      );
    }
  });

  app.get("/api/auth/mfa/status", async (c) => {
    try {
      const sessionRecord = await getSessionRecord(c.req.raw.headers);
      const sessionUser = await getSessionUser(c.req.raw.headers);
      if (!sessionRecord || !sessionUser) {
        return c.json({ error: "Authentication required" }, 401);
      }

      const mfaState = await getMfaStateForUser(sessionUser.id);
      if (!mfaState.enabled) {
        return c.json({
          required: false,
          verified: true,
          enabled: false,
          setupRequired: false,
        });
      }

      const verified = await isSessionMfaVerified(sessionRecord.id);
      return c.json({
        required: true,
        verified,
        enabled: true,
        setupRequired: false,
      });
    } catch (error: unknown) {
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to fetch MFA status",
        },
        500,
      );
    }
  });

  app.post("/api/auth/mfa/settings/email-otp", async (c) => {
    try {
      const sessionUser = await getSessionUser(c.req.raw.headers);
      if (!sessionUser) {
        return c.json({ error: "Authentication required" }, 401);
      }

      const body = (await c.req.json().catch(() => ({}))) as { enabled?: boolean };
      const enabled = body.enabled !== false;
      const now = new Date();

      const rows = await db
        .select({ id: userMfaSettings.id })
        .from(userMfaSettings)
        .where(eq(userMfaSettings.userId, sessionUser.id))
        .limit(1);

      if (rows[0]) {
        await db
          .update(userMfaSettings)
          .set({
            emailOtpEnabled: enabled,
            setupRequired: false,
            preferredMethod: "EMAIL_OTP",
            updatedAt: now,
          })
          .where(eq(userMfaSettings.userId, sessionUser.id));
      } else {
        await db.insert(userMfaSettings).values({
          id: randomUUID(),
          userId: sessionUser.id,
          emailOtpEnabled: enabled,
          setupRequired: false,
          preferredMethod: "EMAIL_OTP",
          createdAt: now,
          updatedAt: now,
        });
      }

      await logMfaActivity({
        userId: sessionUser.id,
        action: enabled ? "MFA_EMAIL_OTP_ENABLED" : "MFA_EMAIL_OTP_DISABLED",
        description: enabled
          ? "User enabled MFA via email OTP"
          : "User disabled MFA via email OTP",
        headers: c.req.raw.headers,
      }).catch((error) => console.error("Failed to log MFA setting change:", error));

      await createMfaNotification({
        userId: sessionUser.id,
        title: enabled ? "Two-Factor Authentication Enabled" : "Two-Factor Authentication Disabled",
        message: enabled
          ? "Email OTP two-factor authentication has been enabled on your account."
          : "Email OTP two-factor authentication has been disabled on your account.",
        action: enabled ? "MFA_ENABLED" : "MFA_DISABLED",
        headers: c.req.raw.headers,
      }).catch((error) => console.error("Failed to create MFA setting notification:", error));

      return c.json({ success: true, enabled });
    } catch (error: unknown) {
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to update MFA settings",
        },
        500,
      );
    }
  });

  app.post("/api/auth/mfa/challenge", async (c) => {
    try {
      const sessionRecord = await getSessionRecord(c.req.raw.headers);
      const sessionUser = await getSessionUser(c.req.raw.headers);
      if (!sessionRecord || !sessionUser) {
        return c.json({ error: "Authentication required" }, 401);
      }

      const body = (await c.req.json().catch(() => ({}))) as {
        intent?: "LOGIN" | "SETUP" | "DISABLE";
      };
      const intent =
        body.intent === "SETUP" || body.intent === "DISABLE"
          ? body.intent
          : "LOGIN";

      const mfaState = await getMfaStateForUser(sessionUser.id);
      if (intent === "LOGIN" && !mfaState.enabled) {
        return c.json({ error: "MFA is not enabled for this account" }, 400);
      }
      if (intent === "DISABLE" && !mfaState.enabled) {
        return c.json({ error: "MFA is already disabled for this account" }, 400);
      }

      const existingRows = await db
        .select({ id: userMfaSession.id })
        .from(userMfaSession)
        .where(eq(userMfaSession.sessionId, sessionRecord.id))
        .limit(1);

      if (!existingRows[0]) {
        await db.insert(userMfaSession).values({
          id: randomUUID(),
          userId: sessionUser.id,
          sessionId: sessionRecord.id,
          requiredAt: new Date(),
          verifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const issued = await issueAndSendMfaEmailOtp({
        userId: sessionUser.id,
        sessionId: sessionRecord.id,
        email: sessionUser.email,
        name: sessionUser.name,
      });

      if (!issued.ok) {
        return c.json({ error: issued.message }, issued.status);
      }

      await logMfaActivity({
        userId: sessionUser.id,
        action: "MFA_EMAIL_OTP_CHALLENGE_SENT",
        description: "Sent email OTP for MFA verification",
        metadata: {
          sessionId: sessionRecord.id,
          expiresAt: issued.expiresAt,
          intent,
        },
        headers: c.req.raw.headers,
      }).catch((error) => console.error("Failed to log MFA challenge:", error));

      return c.json({ success: true, expiresAt: issued.expiresAt });
    } catch (error: unknown) {
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to send verification code",
        },
        500,
      );
    }
  });

  app.post("/api/auth/mfa/verify", async (c) => {
    try {
      const sessionRecord = await getSessionRecord(c.req.raw.headers);
      const sessionUser = await getSessionUser(c.req.raw.headers);
      if (!sessionRecord || !sessionUser) {
        return c.json({ error: "Authentication required" }, 401);
      }

      const body = (await c.req.json()) as {
        code?: string;
        intent?: "LOGIN" | "SETUP" | "DISABLE";
      };
      const code = body.code?.trim() ?? "";
      const intent =
        body.intent === "SETUP" || body.intent === "DISABLE"
          ? body.intent
          : "LOGIN";
      if (!/^\d{6}$/.test(code)) {
        return c.json({ error: "Please enter a valid 6-digit code." }, 400);
      }

      const challengeRows = await db
        .select({
          id: userMfaChallenge.id,
          codeHash: userMfaChallenge.codeHash,
          expiresAt: userMfaChallenge.expiresAt,
          attempts: userMfaChallenge.attempts,
        })
        .from(userMfaChallenge)
        .where(
          and(
            eq(userMfaChallenge.userId, sessionUser.id),
            eq(userMfaChallenge.sessionId, sessionRecord.id),
            isNull(userMfaChallenge.consumedAt),
            gt(userMfaChallenge.expiresAt, new Date()),
          ),
        )
        .orderBy(desc(userMfaChallenge.createdAt))
        .limit(1);

      const challenge = challengeRows[0];
      if (!challenge) {
        return c.json({ error: "Code expired or not found. Request a new code." }, 400);
      }

      if (challenge.attempts >= MFA_MAX_ATTEMPTS) {
        return c.json({ error: "Too many attempts. Request a new code." }, 429);
      }

      const submittedHash = hashMfaCode(code);
      if (submittedHash !== challenge.codeHash) {
        await db
          .update(userMfaChallenge)
          .set({ attempts: challenge.attempts + 1, updatedAt: new Date() })
          .where(eq(userMfaChallenge.id, challenge.id));
        return c.json({ error: "Invalid verification code." }, 400);
      }

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx
          .update(userMfaChallenge)
          .set({ consumedAt: now, updatedAt: now })
          .where(eq(userMfaChallenge.id, challenge.id));

        const sessionRows = await tx
          .select({ id: userMfaSession.id })
          .from(userMfaSession)
          .where(eq(userMfaSession.sessionId, sessionRecord.id))
          .limit(1);

        if (sessionRows[0]) {
          await tx
            .update(userMfaSession)
            .set({ verifiedAt: now, updatedAt: now })
            .where(eq(userMfaSession.sessionId, sessionRecord.id));
        } else {
          await tx.insert(userMfaSession).values({
            id: randomUUID(),
            userId: sessionUser.id,
            sessionId: sessionRecord.id,
            requiredAt: now,
            verifiedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        }

        if (intent === "SETUP") {
          const settingRows = await tx
            .select({ id: userMfaSettings.id })
            .from(userMfaSettings)
            .where(eq(userMfaSettings.userId, sessionUser.id))
            .limit(1);

          if (settingRows[0]) {
            await tx
              .update(userMfaSettings)
              .set({
                emailOtpEnabled: true,
                setupRequired: false,
                preferredMethod: "EMAIL_OTP",
                updatedAt: now,
              })
              .where(eq(userMfaSettings.userId, sessionUser.id));
          } else {
            await tx.insert(userMfaSettings).values({
              id: randomUUID(),
              userId: sessionUser.id,
              emailOtpEnabled: true,
              setupRequired: false,
              preferredMethod: "EMAIL_OTP",
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        if (intent === "DISABLE") {
          await tx
            .update(userMfaSettings)
            .set({
              emailOtpEnabled: false,
              setupRequired: false,
              preferredMethod: "EMAIL_OTP",
              updatedAt: now,
            })
            .where(eq(userMfaSettings.userId, sessionUser.id));
        }
      });

      await logMfaActivity({
        userId: sessionUser.id,
        action:
          intent === "SETUP"
            ? "MFA_EMAIL_OTP_SETUP_VERIFIED"
            : intent === "DISABLE"
              ? "MFA_EMAIL_OTP_DISABLE_VERIFIED"
              : "MFA_EMAIL_OTP_VERIFIED",
        description:
          intent === "SETUP"
            ? "MFA email OTP setup verified successfully"
            : intent === "DISABLE"
              ? "MFA email OTP disable verified successfully"
              : "MFA email OTP verified successfully",
        metadata: { sessionId: sessionRecord.id, intent },
        headers: c.req.raw.headers,
      }).catch((error) => console.error("Failed to log MFA verification:", error));

      if (intent === "SETUP" || intent === "DISABLE") {
        await createMfaNotification({
          userId: sessionUser.id,
          title:
            intent === "SETUP"
              ? "Two-Factor Authentication Enabled"
              : "Two-Factor Authentication Disabled",
          message:
            intent === "SETUP"
              ? "Email OTP two-factor authentication has been enabled on your account."
              : "Email OTP two-factor authentication has been disabled on your account.",
          action: intent === "SETUP" ? "MFA_ENABLED" : "MFA_DISABLED",
          headers: c.req.raw.headers,
        }).catch((error) => console.error("Failed to create MFA verify notification:", error));
      }

      return c.json({ success: true });
    } catch (error: unknown) {
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to verify code",
        },
        500,
      );
    }
  });

  app.post("/api/auth/request-password-reset", async (c) => {
    try {
      const body = (await c.req.json()) as {
        email?: string;
        redirectTo?: string;
      };
      const { email, redirectTo } = body;

      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }

      const rows = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (!rows[0]) {
        return c.json(
          {
            error:
              "No account found with this email address. The email may be invalid or not registered. Please check the address or sign up for an account.",
          },
          404,
        );
      }

      const result = await auth.api.requestPasswordReset({
        body: {
          email,
          ...(redirectTo && { redirectTo }),
        },
      });

      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error
      ) {
        return c.json(
          {
            error:
              (result.error as Error).message ||
              "Failed to send password reset email",
          },
          400,
        );
      }

      return c.json({
        success: true,
        message: "Password reset instructions sent to your email",
      });
    } catch (error: unknown) {
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to send password reset email",
        },
        500,
      );
    }
  });

  /** Query-style: /api/auth/reset-password?token=… or ?error=… */
  app.get("/api/auth/reset-password", async (c) => {
    const token = c.req.query("token");
    const error = c.req.query("error");
    const base = frontendBase();

    if (error) {
      return c.redirect(`${base}/reset-password?error=${encodeURIComponent(error)}`);
    }

    if (!token) {
      return c.redirect(`${base}/reset-password?error=INVALID_TOKEN`);
    }

    return c.redirect(
      `${base}/reset-password?token=${encodeURIComponent(token)}`,
    );
  });

  /** Path-style: /api/auth/reset-password/:token (Better Auth email links) */
  app.get("/api/auth/reset-password/:token", async (c) => {
    const token = c.req.param("token");
    const error = c.req.query("error");
    const base = frontendBase();

    if (error) {
      return c.redirect(`${base}/reset-password?error=${encodeURIComponent(error)}`);
    }

    if (!token) {
      return c.redirect(`${base}/reset-password?error=INVALID_TOKEN`);
    }

    return c.redirect(
      `${base}/reset-password?token=${encodeURIComponent(token)}`,
    );
  });

  app.post("/api/auth/reset-password", async (c) => {
    try {
      const body = (await c.req.json()) as {
        newPassword?: string;
        token?: string;
      };
      const { newPassword, token } = body;

      if (!newPassword || !token) {
        return c.json(
          { error: "Missing newPassword or token" },
          400,
        );
      }

      const result = await auth.api.resetPassword({
        body: { newPassword, token },
      });

      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error
      ) {
        return c.json(
          {
            error:
              (result.error as Error).message || "Failed to reset password",
          },
          400,
        );
      }

      return c.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: unknown) {
      console.error("Password reset API error:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to reset password",
        },
        500,
      );
    }
  });
}
