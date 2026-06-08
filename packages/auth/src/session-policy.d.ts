/** Idle timeout: session ends after this much time without activity. */
export declare const STANDARD_SESSION_MAX_AGE_SEC: number;
/** Minimum interval between DB session extension writes while the user is active. */
export declare const SESSION_TOUCH_THROTTLE_MS: number;
export declare function isSessionLifetimeExpired(expiresAt: Date, now?: Date): boolean;
export declare function nextIdleSessionExpiry(from?: Date): Date;
export type IdleSessionValidation = {
    status: "expired";
} | {
    status: "valid";
    expiresAt: Date;
    extended: boolean;
};
