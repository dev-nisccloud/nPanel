import { auth } from "@npanel/auth";
import type { Context as HonoContext } from "hono";
export declare const SUPPORT_GUEST_COOKIE = "nisc_support_guest";
export type CookieOptions = {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
};
type AuthSessionNonNull = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
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
    teamId?: string | null;
    lastAccessedTeamId?: string | null;
};
/**
 * Session from Better Auth, with `user` typed for API usage.
 * Matches the old `{ user?: { id, name?, email?, role? } } | null` idea, but we merge in
 * any extra fields Better Auth returns (e.g. session id, expiry) via `Omit<..., "user">`.
 */
export type Session = (Omit<AuthSessionNonNull, "user"> & {
    user: SessionUser;
}) | null;
/**
 * tRPC context for Hono + `@hono/trpc-server`.
 * `createCaller` is injected by the server app to avoid `appRouter` ↔ `trpc` cycles.
 */
export type Context = {
    session: Session;
    apiKey?: {
        id: string;
        permissions: string[];
    };
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
    /** Read a request cookie by name. */
    getCookie: (name: string) => string | undefined;
    /** Set a response cookie (used by guest support sessions). */
    setCookie: (name: string, value: string, options?: CookieOptions) => void;
    /** Drizzle client used by customer OAuth routers. */
    db: typeof import("@npanel/db").db;
    ip: string | null;
    userAgent: string | null;
};
export type CreateContextOptions = {
    context: HonoContext;
    createCaller?: (ctx: Context) => unknown;
};
export declare function createContext({ context, createCaller, }: CreateContextOptions): Promise<Context>;
export {};
