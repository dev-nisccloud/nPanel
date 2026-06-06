/** Idle timeout: session ends after this much time without activity. */
export const STANDARD_SESSION_MAX_AGE_SEC = 30 * 60;
/** Minimum interval between DB session extension writes while the user is active. */
export const SESSION_TOUCH_THROTTLE_MS = 60 * 1000;
export function isSessionLifetimeExpired(expiresAt, now = new Date()) {
    return now.getTime() >= expiresAt.getTime();
}
export function nextIdleSessionExpiry(from = new Date()) {
    return new Date(from.getTime() + STANDARD_SESSION_MAX_AGE_SEC * 1000);
}
