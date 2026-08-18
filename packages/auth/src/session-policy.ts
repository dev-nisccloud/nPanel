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

/**
 * Canonical client IP from proxy headers.
 *
 * Prefer platform client headers over X-Forwarded-For, and the leftmost public
 * XFF hop (original client) over the last hop. Using `.pop()` on XFF binds the
 * session to a load-balancer / Cloudflare edge IP that rotates, which makes
 * "confirm identity" reappear after a successful step-up.
 *
 * Header order matches Better Auth `advanced.ipAddress.ipAddressHeaders`.
 */
export function resolveClientIp(headers: Headers | null | undefined): string | null {
  if (!headers) return null;

  const fromDedicated =
    normalizeIpAddress(headers.get("cf-connecting-ip")) ||
    normalizeIpAddress(headers.get("true-client-ip")) ||
    normalizeIpAddress(headers.get("x-real-ip"));
  if (fromDedicated) return fromDedicated;

  const xff = headers.get("x-forwarded-for");
  if (!xff) return null;

  const hops = xff
    .split(",")
    .map((part) => normalizeIpAddress(part))
    .filter((ip): ip is string => Boolean(ip));
  if (hops.length === 0) return null;

  return hops.find((ip) => !isIgnoredForwardedHop(ip)) ?? hops[0] ?? null;
}

/**
 * Normalize a stored or header IP for comparison.
 * Accepts raw X-Forwarded-For lists, `[IPv6]:port`, IPv4:port, and IPv4-mapped IPv6.
 */
export function normalizeIpAddress(ipAddress: string | null | undefined): string | null {
  if (typeof ipAddress !== "string") return null;
  let value = ipAddress.trim();
  if (!value) return null;

  if (value.includes(",")) {
    value = value.split(",")[0]?.trim() ?? "";
  }
  if (!value) return null;

  if (value.startsWith("[") && value.includes("]")) {
    value = value.slice(1, value.indexOf("]"));
  } else {
    const v4WithPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (v4WithPort?.[1]) value = v4WithPort[1];
  }

  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped?.[1]) value = mapped[1];

  return value.length > 0 ? value : null;
}

/**
 * True when the request IP is a *different network* from the session binding.
 *
 * Exact-string IP/UA binding is a well-known false-positive source (OWASP Cookie
 * Theft Mitigation, OWASP Session Management): mobile CGNAT, dual-stack Happy
 * Eyeballs, IPv6 privacy extensions (RFC 4941), and rotating proxy hops all
 * change the raw address without a stolen cookie.
 *
 * - Missing either address is not an anomaly (header not forwarded).
 * - IPv4 vs IPv6 is treated as the same device (Happy Eyeballs).
 * - IPv4 compared at /24; IPv6 compared at /64.
 */
export function ipsIndicateNetworkChange(
  boundIp: string | null | undefined,
  requestIp: string | null | undefined,
): boolean {
  const bound = normalizeIpAddress(boundIp);
  const request = normalizeIpAddress(requestIp);
  if (!bound || !request) return false;
  if (bound === request) return false;

  const boundV4 = isIPv4(bound);
  const requestV4 = isIPv4(request);
  if (boundV4 !== requestV4) return false;
  if (boundV4 && requestV4) {
    return ipv4Slash24(bound) !== ipv4Slash24(request);
  }

  const boundPrefix = ipv6Slash64(bound);
  const requestPrefix = ipv6Slash64(request);
  if (!boundPrefix || !requestPrefix) return bound !== request;
  return boundPrefix !== requestPrefix;
}

function isIPv4(ip: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip);
}

function ipv4Octets(ip: string): [number, number, number, number] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => Number.parseInt(part, 10));
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return octets as [number, number, number, number];
}

function ipv4Slash24(ip: string): string | null {
  const octets = ipv4Octets(ip);
  if (!octets) return null;
  return `${octets[0]}.${octets[1]}.${octets[2]}`;
}

function isIgnoredForwardedHop(ip: string): boolean {
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return true;
  const lower = ip.toLowerCase();
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
    return true;
  }

  const octets = ipv4Octets(ip);
  if (!octets) return false;
  const [a, b] = octets;
  if (a === 10 || a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function expandIPv6(ip: string): string[] | null {
  const lower = ip.toLowerCase().split("%")[0] ?? ip.toLowerCase();
  if (lower.includes(".")) return null;

  const sides = lower.split("::");
  if (sides.length > 2) return null;

  const parseGroups = (side: string): string[] =>
    side.length === 0 ? [] : side.split(":").filter((g) => g.length > 0);

  if (sides.length === 1) {
    const groups = parseGroups(sides[0] ?? "");
    if (groups.length !== 8) return null;
    if (groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
    return groups.map((g) => g.padStart(4, "0"));
  }

  const left = parseGroups(sides[0] ?? "");
  const right = parseGroups(sides[1] ?? "");
  const missing = 8 - left.length - right.length;
  if (missing < 1) return null;
  if ([...left, ...right].some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return [
    ...left.map((g) => g.padStart(4, "0")),
    ...Array.from({ length: missing }, () => "0000"),
    ...right.map((g) => g.padStart(4, "0")),
  ];
}

function ipv6Slash64(ip: string): string | null {
  const groups = expandIPv6(ip);
  if (!groups) return null;
  return groups.slice(0, 4).join(":");
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
