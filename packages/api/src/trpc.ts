import { initTRPC, TRPCError } from "@trpc/server";
import { logBuffer } from "./lib/log-buffer";
import type { Context } from "./context";

export type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

/**
 * Global logging middleware that captures request details and pushes them to a background buffer.
 */
const loggingMiddleware = t.middleware(async ({ ctx, next, path, type, rawInput }) => {
  const start = performance.now();
  
  try {
    const result = await next();
    const durationMs = Math.ceil(performance.now() - start);

    logBuffer.push({
      path,
      type,
      userId: ctx.session?.user?.id,
      teamId: ctx.session?.user?.lastAccessedTeamId,
      apiKeyId: ctx.apiKey?.id,
      input: rawInput,
      status: result.ok ? "SUCCESS" : "ERROR",
      errorCode: result.ok ? null : result.error.code,
      durationMs,
      ipAddress: ctx.ipAddress,
    });

    return result;
  } catch (error: any) {
    const durationMs = Math.ceil(performance.now() - start);
    const errorCode = error instanceof TRPCError ? error.code : "INTERNAL_SERVER_ERROR";
    
    logBuffer.push({
      path,
      type,
      userId: ctx.session?.user?.id,
      apiKeyId: ctx.apiKey?.id,
      input: rawInput,
      status: "ERROR",
      errorCode,
      durationMs,
      ipAddress: ctx.ipAddress,
    });
    
    throw error;
  }
});

/**
 * Universal middleware that enforces API key scopes if an API key is used.
 * Applied to both public and protected procedures.
 */
const apiKeyGuard = t.middleware(async ({ ctx, next, path }) => {
  if (ctx.apiKeyError) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ctx.apiKeyError,
    });
  }

  if (ctx.apiKey) {
    const { permissions } = ctx.apiKey;
    const hasAccess = permissions.includes("*") || permissions.includes(path);
    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `API Key does not have permission to access endpoint: ${path}`,
      });
    }
  }
  return next();
});

export const publicProcedure = t.procedure.use(loggingMiddleware).use(apiKeyGuard);

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session user",
    });
  }

  const user = ctx.session.user;
  // Legacy stack only required `user`; for this codebase every protected route uses `user.id`.
  if (typeof user.id !== "string" || user.id.length === 0) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "Invalid session: missing user id",
    });
  }

  if (ctx.mfaSetupRequired) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "MFA_SETUP_REQUIRED",
      cause: "Session requires MFA setup before access",
    });
  }

  if (ctx.mfaRequired && !ctx.mfaVerified) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "MFA_REQUIRED",
      cause: "Session requires MFA verification",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user },
    },
  });
});
