/**
 * Landing / storefront browser origins (www, Vercel, local Vite).
 * Distinct from CORS_ORIGIN (nPanel web app).
 *
 * Env: LANDING_PAGE_ORIGINS=https://www.nisccloud.com,https://nisccloud-website.vercel.app
 */

const DEFAULT_LANDING_PAGE_ORIGINS = [
  "https://nisccloud-website.vercel.app",
];

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function parseCommaOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const n = normalizeOrigin(part);
    if (n) out.push(n);
  }
  return out;
}

/** Local/LAN Vite origins when not in production. */
export function isLocalDevOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Configured landing-page origins from env (plus a Vercel default when unset).
 * Does not include local-dev wildcards — use {@link isLandingPageOrigin} for that.
 */
export function resolveLandingPageOrigins(): string[] {
  const fromEnv = parseCommaOrigins(process.env.LANDING_PAGE_ORIGINS);
  const origins = new Set<string>(
    fromEnv.length > 0 ? fromEnv : DEFAULT_LANDING_PAGE_ORIGINS,
  );
  return [...origins];
}

/** True when the browser Origin is an allowed marketing/storefront host. */
export function isLandingPageOrigin(origin: string | null | undefined): boolean {
  if (!origin?.trim()) return false;
  const normalized = normalizeOrigin(origin);
  if (resolveLandingPageOrigins().includes(normalized)) return true;
  if (process.env.NODE_ENV !== "production" && isLocalDevOrigin(normalized)) {
    return true;
  }
  return false;
}

/**
 * Extract Origin from request headers (Origin, or Referer origin).
 */
export function getRequestBrowserOrigin(headers: Headers): string | null {
  const origin = headers.get("origin")?.trim();
  if (origin) return normalizeOrigin(origin);
  const referer = headers.get("referer")?.trim();
  if (!referer) return null;
  try {
    return normalizeOrigin(new URL(referer).origin);
  } catch {
    return null;
  }
}

/**
 * Allow absolute return URLs only to LANDING_PAGE_ORIGINS (or local landing in dev),
 * limited to storefront cart paths to avoid open redirects.
 */
export function parseSafeLandingPageRedirect(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  let s = raw.trim();
  if (!s) return null;
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (!s.includes("://")) return null;
  if (s.includes("\\") || s.includes("\0") || s.includes("\n") || s.includes("\r")) {
    return null;
  }
  try {
    const url = new URL(s);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!isLandingPageOrigin(url.origin)) return null;
    const path = url.pathname || "/";
    if (path !== "/cart" && !path.startsWith("/cart/")) return null;
    if (s.length > 2048) return null;
    return `${url.origin}${path}${url.search}`;
  } catch {
    return null;
  }
}

/**
 * Allow storefront session probes when:
 * - Origin/Referer is a configured landing page, or
 * - Origin is absent (some browsers omit it on same-site GETs).
 */
export function isAllowedStorefrontBrowserRequest(
  headers: Headers | undefined,
): boolean {
  if (!headers) return false;
  const origin = getRequestBrowserOrigin(headers);
  if (!origin) return true;
  return isLandingPageOrigin(origin);
}
