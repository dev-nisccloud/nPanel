import { auth } from "@npanel/auth";
import type { Context as HonoContext } from "hono";
import { createHash } from "node:crypto";
import { db, eq } from "@npanel/db";
import { apiKey } from "@npanel/db/schema/auth-extras";
import { user } from "@npanel/db/schema/auth";
import { and, isNull, or } from "@npanel/db";
import { userMfaSession, userMfaSettings } from "@npanel/db/schema/auth-extras";

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
  /** Used by AI chat to get a tRPC caller. Injected by the app. */
  createCaller?: (ctx: Context) => unknown;
  ipAddress?: string | null;
  apiKeyError?: string | null;
};

export type CreateContextOptions = {
  context: HonoContext;
  createCaller?: (ctx: Context) => unknown;
};

export async function createContext({
  context,
  createCaller,
}: CreateContextOptions): Promise<Context> {
  const authHeader = context.req.raw.headers.get("Authorization");
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
          ipAddress: context.req.raw.headers.get("x-forwarded-for") ?? null,
        };
      }

      if (!keyRecord.isActive) {
        return {
          session: null,
          apiKeyError: "API Key is revoked",
          ipAddress: context.req.raw.headers.get("x-forwarded-for") ?? null,
        };
      }

      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        return {
          session: null,
          apiKeyError: "API Key has expired",
          ipAddress: context.req.raw.headers.get("x-forwarded-for") ?? null,
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
          ipAddress: context.req.raw.headers.get("x-forwarded-for") ?? null,
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
        ipAddress: context.req.raw.headers.get("x-forwarded-for") ?? null,
        userAgent: context.req.raw.headers.get("user-agent") ?? null,
        token: token,
      };

      const ipAddress = context.req.raw.headers.get("x-forwarded-for") ?? null;

      return {
        session: { session: mockSessionObj, user: sessionUser } as unknown as Session,
        createCaller,
        apiKey: { id: keyRecord.id, permissions: keyRecord.permissions },
        ipAddress,
      };
    }
  }

  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  const ipAddress = context.req.raw.headers.get("x-forwarded-for") ?? null;

  let mfaRequired = false;
  let mfaVerified = true;
  let mfaSetupRequired = false;
  const sessionUserId = session?.user?.id;
  const sessionId = session?.session?.id;
  if (typeof sessionUserId === "string" && sessionUserId.length > 0 && sessionId) {
    const mfaRows = await db
      .select({
        id: userMfaSettings.id,
        setupRequired: userMfaSettings.setupRequired,
      })
      .from(userMfaSettings)
      .where(
        and(
          eq(userMfaSettings.userId, sessionUserId),
          or(
            eq(userMfaSettings.emailOtpEnabled, true),
            eq(userMfaSettings.setupRequired, true),
          ),
        ),
      )
      .limit(1);

    mfaRequired = Boolean(mfaRows[0]);
    mfaSetupRequired = mfaRows[0]?.setupRequired === true;

    if (!mfaRequired && mfaSetupRequired) {
      mfaRequired = true;
    }

    if (mfaRequired) {
      const pendingRows = await db
        .select({ id: userMfaSession.id })
        .from(userMfaSession)
        .where(
          and(
            eq(userMfaSession.sessionId, sessionId),
            isNull(userMfaSession.verifiedAt),
          ),
        )
        .limit(1);
      mfaVerified = !pendingRows[0];
    }
  }

  return {
    session: session as Session,
    mfaRequired,
    mfaVerified,
    mfaSetupRequired,
    createCaller,
    ipAddress,
  };
}
