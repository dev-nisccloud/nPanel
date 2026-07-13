import { type IdleSessionValidation } from "./session-policy";

export type SessionEnforcementOpts = {
  userAgent?: string | null;
  ipAddress?: string | null;
  rotateToken?: boolean;
};

export declare function invalidateSessionById(sessionId: string): Promise<void>;
/** Set initial idle window when a session is first created. */
export declare function applyStandardSessionExpiryByToken(
  sessionToken: string,
): Promise<void>;
export type { IdleSessionValidation } from "./session-policy";
/**
 * Expire idle sessions, enforce UA binding, detect IP anomalies,
 * and silently extend active sessions (throttled). Token rotation is opt-in.
 */
export declare function validateAndRefreshIdleSessionById(
  sessionId: string,
  opts?: SessionEnforcementOpts,
): Promise<IdleSessionValidation>;
export declare function updateSessionBoundIp(
  sessionId: string,
  ipAddress: string | null,
): Promise<void>;
/** @deprecated Use validateAndRefreshIdleSessionById */
export declare function enforceSessionLifetimeById(
  sessionId: string,
  opts?: SessionEnforcementOpts,
): Promise<"valid" | "expired">;
