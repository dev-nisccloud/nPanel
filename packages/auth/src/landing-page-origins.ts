/**
 * Landing / storefront browser origins (www, staging, Vercel, local Vite).
 * Distinct from CORS_ORIGIN (nPanel web app).
 *
 * Env: LANDING_PAGE_ORIGINS=https://www.nisccloud.com,https://staging.nisccloud.com
 * Extra origins are merged with the built-in defaults (env never replaces them).
 */

const DEFAULT_LANDING_PAGE_ORIGINS = [
  "https://www.nisccloud.com",
  "https://nisccloud.com",
  "https://staging.nisccloud.com",
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
 * Configured landing-page origins: built-in defaults plus any from env.
 * Does not include local-dev wildcards  use {@link isLandingPageOrigin} for that.
 */
export function resolveLandingPageOrigins(): string[] {
  const origins = new Set<string>(DEFAULT_LANDING_PAGE_ORIGINS);
  for (const o of parseCommaOrigins(process.env.LANDING_PAGE_ORIGINS)) {
    origins.add(o);
  }
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
 * Origin from x-forwarded-* when the marketing site reverse-proxies `/api`
 * (Vercel rewrite or Bun www-server). Same-origin GETs often omit Origin;
 * Referer may also be stripped  the proxy still records the browser host.
 */
function originFromForwardedHost(headers: Headers): string | null {
  const fwdHost =
    headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headers.get("x-original-host")?.trim();
  if (!fwdHost) return null;
  const proto = (
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https"
  ).toLowerCase();
  const scheme = proto === "http" ? "http" : "https";
  try {
    return normalizeOrigin(new URL(`${scheme}://${fwdHost}`).origin);
  } catch {
    return null;
  }
}

/**
 * Extract Origin from request headers (Origin, Referer origin, or forwarded host).
 */
export function getRequestBrowserOrigin(headers: Headers): string | null {
  const origin = headers.get("origin")?.trim();
  if (origin && origin.toLowerCase() !== "null") {
    return normalizeOrigin(origin);
  }
  const referer = headers.get("referer")?.trim();
  if (referer) {
    try {
      return normalizeOrigin(new URL(referer).origin);
    } catch {
      // fall through to forwarded host
    }
  }
  return originFromForwardedHost(headers);
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
 * Allow storefront / guest-support browser requests when a browser-facing
 * origin matches a configured landing page.
 *
 * Signals (any positive match allows):
 * - `Origin`
 * - `Referer` origin
 * - `x-forwarded-host` from the marketing-site `/api` reverse proxy
 *   (Vercel rewrite or Bun www-server)  used when Origin is omitted or
 *   rewritten to the API host
 *
 * When Origin and Referer are both absent, allow (same-site GETs often omit
 * them). A non-landing forwarded host alone does not cause a reject.
 */
export function isAllowedStorefrontBrowserRequest(
  headers: Headers | undefined,
): boolean {
  if (!headers) return false;

  const browserOrigins: string[] = [];

  const origin = headers.get("origin")?.trim();
  if (origin && origin.toLowerCase() !== "null") {
    browserOrigins.push(normalizeOrigin(origin));
  }

  const referer = headers.get("referer")?.trim();
  if (referer) {
    try {
      browserOrigins.push(normalizeOrigin(new URL(referer).origin));
    } catch {
      // ignore invalid referer
    }
  }

  for (const candidate of browserOrigins) {
    if (isLandingPageOrigin(candidate)) return true;
  }

  const forwarded = originFromForwardedHost(headers);
  if (forwarded && isLandingPageOrigin(forwarded)) return true;

  // No Origin/Referer (common on same-origin GETs) → allow.
  if (browserOrigins.length === 0) return true;

  return false;
}
