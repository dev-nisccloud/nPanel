import type { IdleSessionValidation } from "./session-policy";

export declare function readCachedSessionValidation(
  sessionId: string,
  opts?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<IdleSessionValidation | null>;

export declare function writeCachedSessionValidation(
  sessionId: string,
  result: IdleSessionValidation,
  opts?: {
    boundUserAgent?: string | null;
    boundIpAddress?: string | null;
    userId?: string;
  },
): Promise<void>;

export declare function invalidateSessionCache(sessionId: string): Promise<void>;

export declare function markSessionReauthRequired(
  sessionId: string,
  ttlSec: number,
): Promise<void>;

export declare function isSessionReauthRequired(sessionId: string): Promise<boolean>;

export declare function clearSessionReauthRequired(sessionId: string): Promise<void>;

export declare function claimIpAnomalyAlert(
  sessionId: string,
  dedupeSec: number,
): Promise<boolean>;
