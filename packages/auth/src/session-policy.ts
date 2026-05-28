/** Fixed auth session lifetime from creation (all sign-in methods). */
export const STANDARD_SESSION_MAX_AGE_SEC = 30 * 60;

/**
 * True when the session is past the 30-minute window from `createdAt`.
 * Also respects `expiresAt` when it is sooner (e.g. legacy rows).
 */
export function isSessionLifetimeExpired(
  createdAt: Date,
  expiresAt: Date,
  now: Date = new Date(),
): boolean {
  const nowMs = now.getTime();
  const hardEndMs = createdAt.getTime() + STANDARD_SESSION_MAX_AGE_SEC * 1000;
  return nowMs >= hardEndMs || nowMs >= expiresAt.getTime();
}
