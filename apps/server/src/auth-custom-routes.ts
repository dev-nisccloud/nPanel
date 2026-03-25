import { auth } from "@npanel/auth";
import { getRootRedirectTargetFromHeaders } from "@npanel/auth/root-redirect-target";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { env } from "@npanel/env/server";
import { eq } from "drizzle-orm";
import type { Hono } from "hono";

const FALLBACK_REDIRECT = "/auth/login";

function frontendBase(): string {
  return env.CORS_ORIGIN.replace(/\/+$/, "") || "http://localhost:3002";
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

      const target = await getRootRedirectTargetFromHeaders(c.req.raw.headers).catch(err => {
        console.error("[server][redirect-target] getRootRedirectTargetFromHeaders CRASHED:", err);
        throw err;
      });
      const redirect =
        typeof target === "string" && target ? target : FALLBACK_REDIRECT;
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
