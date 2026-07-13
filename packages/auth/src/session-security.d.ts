export declare function isMfaEnabledForUser(userId: string): Promise<boolean>;
export declare function clearSessionMfaVerification(
  sessionId: string,
  userId: string,
): Promise<void>;
export type SessionSecurityNotifyKind = "new_signin" | "ip_anomaly";
export declare function notifySessionSecurityEvent(params: {
  userId: string;
  kind: SessionSecurityNotifyKind;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
}): Promise<void>;
export declare function handleIpAnomaly(params: {
  userId: string;
  sessionId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt?: Date;
}): Promise<{ reauthRequired: boolean; mfaRequired: boolean }>;
export declare function resolveReauthRequired(sessionId: string): Promise<boolean>;
export declare function maybeNotifyNewSignIn(params: {
  userId: string;
  sessionId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void>;
export declare function ensurePendingMfaSession(
  userId: string,
  sessionId: string,
): Promise<void>;
