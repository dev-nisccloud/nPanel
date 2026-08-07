export declare function isMfaEnabledForUser(userId: string): Promise<boolean>;
/** Clear MFA verifiedAt so the next request requires OTP again. */
export declare function clearSessionMfaVerification(sessionId: string, userId: string): Promise<void>;
export type SessionSecurityNotifyKind = "new_signin" | "ip_anomaly";
export declare function notifySessionSecurityEvent(params: {
    userId: string;
    kind: SessionSecurityNotifyKind;
    ipAddress?: string | null;
    userAgent?: string | null;
    sessionId?: string | null;
}): Promise<void>;
/**
 * Handle soft IP anomaly: step-up (MFA or password re-auth) + deduped alerts.
 * Google-only accounts without MFA cannot password-reauth → session is invalidated.
 */
export declare function handleIpAnomaly(params: {
    userId: string;
    sessionId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresAt?: Date;
}): Promise<{
    reauthRequired: boolean;
    mfaRequired: boolean;
    invalidated?: boolean;
}>;
export declare function resolveReauthRequired(sessionId: string): Promise<boolean>;
/**
 * After a successful login, notify if this looks like a new device/session.
 */
export declare function maybeNotifyNewSignIn(params: {
    userId: string;
    sessionId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
}): Promise<void>;
/** Ensure MFA pending row exists for a session when MFA is enabled (email + OAuth). */
export declare function ensurePendingMfaSession(userId: string, sessionId: string): Promise<void>;
