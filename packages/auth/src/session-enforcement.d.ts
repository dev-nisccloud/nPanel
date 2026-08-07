import { type IdleSessionValidation } from "./session-policy";
export type SessionEnforcementOpts = {
    userAgent?: string | null;
    ipAddress?: string | null;
    /** Only enable when the caller can rewrite the Better Auth signed session cookie. */
    rotateToken?: boolean;
    /**
     * When true, failed checks return `expired` without deleting the session row.
     * Used for storefront/landing probes so a cross-app request cannot log the user
     * out of nPanel (missing UA through a proxy, IP header mismatch, etc.).
     */
    softFail?: boolean;
};
export declare function invalidateSessionById(sessionId: string): Promise<void>;
/** Set initial idle window when a session is first created. */
export declare function applyStandardSessionExpiryByToken(sessionToken: string): Promise<void>;
export type { IdleSessionValidation } from "./session-policy";
/**
 * Expire idle sessions, enforce UA binding, detect IP anomalies,
 * and silently extend active sessions (throttled). Token rotation is opt-in.
 */
export declare function validateAndRefreshIdleSessionById(sessionId: string, opts?: SessionEnforcementOpts): Promise<IdleSessionValidation>;
/** Update bound IP after successful step-up (MFA or password re-auth). */
export declare function updateSessionBoundIp(sessionId: string, ipAddress: string | null): Promise<void>;
/** @deprecated Use validateAndRefreshIdleSessionById */
export declare function enforceSessionLifetimeById(sessionId: string, opts?: SessionEnforcementOpts): Promise<"valid" | "expired">;
