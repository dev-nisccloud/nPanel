import { auth } from "@npanel/auth";
import { validateAndRefreshIdleSessionById } from "@npanel/auth/session-enforcement";
import {
  handleIpAnomaly,
  resolveReauthRequired,
} from "@npanel/auth/session-security";
import type { Context as HonoContext } from "hono";
import { createHash } from "node:crypto";
import { db, eq } from "@npanel/db";
import { apiKey } from "@npanel/db/schema/auth-extras";
import { user } from "@npanel/db/schema/auth";
import { resolveMfaContextState } from "./lib/mfa-context";

function resolveIpAddress(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    null
  );
}

type AuthSessionNonNull = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

/**
 * User object expected on authenticated requests (legacy tRPC contract).
 * `name` / `email` / `role` are optional at the type level; runtime minimum is enforced in
 * `protectedProcedure` (see `trpc.ts`): `user` must exist and `id` must be non-empty.
 */
export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

/**
 * Session from Better Auth, with `user` typed for API usage.
 * Matches the old `{ user?: { id, name?, email?, role? } } | null` idea, but we merge in
 * any extra fields Better Auth returns (e.g. session id, expiry) via `Omit<..., "user">`.
 */
export type Session =
  | (Omit<AuthSessionNonNull, "user"> & { user: SessionUser })
  | null;

/**
 * tRPC context for Hono + `@hono/trpc-server`.
 * `createCaller` is injected by the server app to avoid `appRouter` ↔ `trpc` cycles.
 */
export type Context = {
  session: Session;
  apiKey?: { id: string; permissions: string[] };
  mfaRequired?: boolean;
  mfaVerified?: boolean;
  mfaSetupRequired?: boolean;
  /** Password re-auth required after IP anomaly when MFA is disabled. */
  reauthRequired?: boolean;
  /** Used by AI chat to get a tRPC caller. Injected by the app. */
  createCaller?: (ctx: Context) => unknown;
  ipAddress?: string | null;
  apiKeyError?: string | null;
  /** The raw Hono request, useful for URL and header inspection. */
  req: HonoContext["req"];
};

export type CreateContextOptions = {
  context: HonoContext;
  createCaller?: (ctx: Context) => unknown;
};

export async function createContext({
  context,
  createCaller,
}: CreateContextOptions): Promise<Context> {
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

      const sessionUser: SessionUser = {
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
        session: { session: mockSessionObj, user: sessionUser } as unknown as Session,
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

  const ipAddress = resolveIpAddress(context.req.raw.headers);
  const userAgent = context.req.raw.headers.get("user-agent");

  const sessionId = session?.session?.id;
  if (typeof sessionId === "string" && sessionId.length > 0) {
    const lifetime = await validateAndRefreshIdleSessionById(sessionId, {
      userAgent,
      ipAddress,
      rotateToken: false,
    });
    if (lifetime.status === "expired") {
      session = null;
    } else if (lifetime.ipAnomaly && lifetime.userId) {
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
      } catch (error) {
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
  if (
    typeof sessionUserId === "string" &&
    sessionUserId.length > 0 &&
    typeof activeSessionId === "string" &&
    activeSessionId.length > 0
  ) {
    const mfaState = await resolveMfaContextState(sessionUserId, activeSessionId);
    mfaRequired = mfaState.mfaRequired;
    mfaVerified = mfaState.mfaVerified;
    mfaSetupRequired = false;
    reauthRequired = await resolveReauthRequired(activeSessionId);
  }

  return {
    session: session as Session,
    mfaRequired,
    mfaVerified,
    mfaSetupRequired,
    reauthRequired,
    createCaller,
    ipAddress,
    req,
  };
}
