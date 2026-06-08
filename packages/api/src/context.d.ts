import { auth } from "@npanel/auth";
import type { Context as HonoContext } from "hono";
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
export declare function createContext({ context, createCaller, }: CreateContextOptions): Promise<Context>;
export {};
