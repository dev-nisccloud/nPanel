/**
 * Plesk subscription limits often use `-1` meaning "unlimited".
 * Values must not be fed into `bytes / limit` or `formatBytes` without normalizing.
 */
export const PLESK_UNLIMITED = -1;

export function parseLimitNumber(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function isUnlimitedPleskLimit(n: number | undefined): boolean {
  return n === PLESK_UNLIMITED;
}

/** Positive finite cap for percentages; `null` when unlimited or not applicable */
export function finitePositiveCap(raw: unknown): number | null {
  const n = parseLimitNumber(raw);
  if (n === undefined) return null;
  if (isUnlimitedPleskLimit(n)) return null;
  if (n <= 0) return null;
  return n;
}

export function formatPleskCountLimit(raw: unknown): string {
  const n = parseLimitNumber(raw);
  if (n === undefined) return "—";
  if (isUnlimitedPleskLimit(n)) return "Unlimited";
  return String(n);
}

export function formatPleskBytesLimit(raw: unknown, formatBytes: (b: number) => string): string {
  const n = parseLimitNumber(raw);
  if (n === undefined) return "—";
  if (isUnlimitedPleskLimit(n)) return "Unlimited";
  if (!Number.isFinite(n) || n < 0) return "—";
  return formatBytes(n);
}

/** Returns capped 0–100 percent, or `null` when there is no finite quota */
export function usagePercent(used: number, cap: number | null): number | null {
  if (cap === null || cap <= 0) return null;
  if (!Number.isFinite(used) || used < 0) return null;
  return Math.min(Math.round((used / cap) * 100), 100);
}
