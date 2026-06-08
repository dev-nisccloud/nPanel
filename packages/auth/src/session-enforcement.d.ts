import { type IdleSessionValidation } from "./session-policy";
export declare function invalidateSessionById(sessionId: string): Promise<void>;
/** Set initial idle window when a session is first created. */
export declare function applyStandardSessionExpiryByToken(sessionToken: string): Promise<void>;
export type { IdleSessionValidation } from "./session-policy";
/**
 * Expire idle sessions and silently extend active ones (throttled).
 * Each extension resets the 30-minute idle clock.
 */
export declare function validateAndRefreshIdleSessionById(sessionId: string): Promise<IdleSessionValidation>;
/** @deprecated Use validateAndRefreshIdleSessionById */
export declare function enforceSessionLifetimeById(sessionId: string): Promise<"valid" | "expired">;
