import { initTRPC, TRPCError } from "@trpc/server";
import { logBuffer } from "./lib/log-buffer";
import { checkRateLimit, resolveProcedureRateLimit } from "./lib/rate-limit";
import {
  domainProviderAudienceFromContext,
  sanitizeDomainProviderMessage,
} from "./lib/domain-provider-copy";
import type { Context } from "./context";
import { assertAgencyProcedureAccess } from "./lib/agency-permissions/assert";

export type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, ctx }) {
    const audience = domainProviderAudienceFromContext(ctx);
    return {
      ...shape,
      message: sanitizeDomainProviderMessage(shape.message, audience) ?? shape.message,
    };
  },
});

export const router = t.router;

/**
 * Redis-backed rate limiting. Skipped when Redis is unavailable.
 */
const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const limits = resolveProcedureRateLimit(path);
  const ip = (ctx.ipAddress ?? "unknown").split(",")[0]?.trim() || "unknown";

  let bucketKey: string;
  let limit: number;

  if (ctx.session?.user?.id) {
    bucketKey = `user:${ctx.session.user.id}:${path}`;
    limit = limits.authenticated;
  } else if (ctx.apiKey?.id) {
    bucketKey = `apikey:${ctx.apiKey.id}:${path}`;
    limit = limits.apiKey;
  } else {
    bucketKey = `ip:${ip}:${path}`;
    limit = limits.anonymous;
  }

  const result = await checkRateLimit({
    key: bucketKey,
    limit,
    windowSec: limits.windowSec,
  });

  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded. Please try again shortly.",
    });
  }

  return next();
});

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

export const publicProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(loggingMiddleware)
  .use(apiKeyGuard);

const authenticatedProcedure = publicProcedure.use(async ({ ctx, next }) => {
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

  if (ctx.reauthRequired) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "REAUTH_REQUIRED",
      cause: "Session requires password re-authentication after IP change",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user },
    },
  });
});

/**
 * Agency staff with a custom role are checked here, before the handler runs.
 * AGENCY_SUPER_ADMIN is root access and is not checked.
 * Customer users are unchanged.
 */
const agencyPermissionGuard = t.middleware(async ({ ctx, next, path, type, rawInput }) => {
  const user = ctx.session?.user;
  if (user?.id && user.role !== "AGENCY_SUPER_ADMIN") {
    await assertAgencyProcedureAccess({
      userId: user.id,
      userRole: user.role,
      path,
      type,
      ipAddress: ctx.ipAddress,
      input: rawInput,
    });
  }
  return next();
});

export const protectedProcedure = authenticatedProcedure.use(agencyPermissionGuard);
