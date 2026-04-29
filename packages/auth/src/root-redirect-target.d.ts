type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export interface UserWithStatus {
    id: string;
    status?: UserStatus;
    role?: string;
    lastAccessedTeamId?: string | null;
    [key: string]: unknown;
}
/**
 * Same as legacy auth-server `getCustomerTeamRedirectPath`, using Drizzle.
 * Picks active team, updates lastAccessedTeamId, logs TEAM_ACCESSED.
 */
export declare function getCustomerTeamRedirectPath(user: UserWithStatus): Promise<string>;
/**
 * Root "/" redirect target for authenticated users. Uses request cookies via Better Auth.
 * Safe for Hono (pass `c.req.raw.headers`) and Next (pass `await headers()`).
 *
 * When `requestedRedirect` is set (e.g. from `?redirect=` on `/api/auth/redirect-target`), it is
 * used only if it is a safe internal path and allowed for the user's role (agency vs customer team).
 */
export declare function getRootRedirectTargetFromHeaders(headers: Headers, requestedRedirect?: string | null): Promise<string>;
export {};
