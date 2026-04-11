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
 * Optional `requestedRedirect` is honored only when it is internal and role-authorized.
 */
export declare function getRootRedirectTargetFromHeaders(
  headers: Headers,
  requestedRedirect?: string | null,
): Promise<string>;
export {};
