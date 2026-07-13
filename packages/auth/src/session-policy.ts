/** Idle timeout: session ends after this much time without activity. */
export const STANDARD_SESSION_MAX_AGE_SEC = 30 * 60;

/** Minimum interval between DB session extension writes while the user is active. */
export const SESSION_TOUCH_THROTTLE_MS = 60 * 1000;

/** Dedupe window for IP-anomaly in-app/email alerts per session. */
export const SESSION_IP_ALERT_DEDUPE_SEC = 60 * 60;

export function isSessionLifetimeExpired(
  expiresAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function nextIdleSessionExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + STANDARD_SESSION_MAX_AGE_SEC * 1000);
}

export function normalizeUserAgent(userAgent: string | null | undefined): string | null {
  if (typeof userAgent !== "string") return null;
  const trimmed = userAgent.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeIpAddress(ipAddress: string | null | undefined): string | null {
  if (typeof ipAddress !== "string") return null;
  const trimmed = ipAddress.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type IdleSessionExpiryReason = "idle" | "ua_mismatch" | "missing";

export type IdleSessionValidation =
  | { status: "expired"; reason?: IdleSessionExpiryReason }
  | {
      status: "valid";
      expiresAt: Date;
      extended: boolean;
      ipAnomaly?: boolean;
      rotatedToken?: string;
      userId?: string;
    };
