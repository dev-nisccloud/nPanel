/** Idle timeout: session ends after this much time without activity. */
export declare const STANDARD_SESSION_MAX_AGE_SEC: number;
/** Minimum interval between DB session extension writes while the user is active. */
export declare const SESSION_TOUCH_THROTTLE_MS: number;
/** Dedupe window for IP-anomaly in-app/email alerts per session. */
export declare const SESSION_IP_ALERT_DEDUPE_SEC: number;
export declare function isSessionLifetimeExpired(expiresAt: Date, now?: Date): boolean;
export declare function nextIdleSessionExpiry(from?: Date): Date;
export declare function normalizeUserAgent(userAgent: string | null | undefined): string | null;
export declare function normalizeIpAddress(ipAddress: string | null | undefined): string | null;
export type IdleSessionExpiryReason = "idle" | "ua_mismatch" | "missing";
export type IdleSessionValidation = {
    status: "expired";
    reason?: IdleSessionExpiryReason;
} | {
    status: "valid";
    expiresAt: Date;
    extended: boolean;
    ipAnomaly?: boolean;
    rotatedToken?: string;
    userId?: string;
};
