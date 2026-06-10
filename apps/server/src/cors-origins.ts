/** Vercel deployment origins that are always allowed regardless of env config. */
const HARDCODED_ALLOWED_ORIGINS = [
  "https://nisccloud-website.vercel.app",
];

/**
 * Resolve allowed browser origins for Hono CORS.
 * CORS_ORIGIN is the primary app origin; CORS_EXTRA_ORIGINS adds comma-separated URLs
 * (e.g. https://www.nisccloud.com,https://nisccloud.com).
 */
export function resolveCorsAllowedOrigins(primaryOrigin: string): string[] {
  const origins = new Set<string>();
  const add = (url: string | undefined) => {
    if (!url) return;
    const normalized = url.trim().replace(/\/+$/, "");
    if (normalized) origins.add(normalized);
  };

  add(primaryOrigin);

  for (const o of HARDCODED_ALLOWED_ORIGINS) {
    add(o);
  }

  const extra = process.env.CORS_EXTRA_ORIGINS;
  if (extra) {
    for (const part of extra.split(",")) {
      add(part);
    }
  }

  return [...origins];
}

/** Local/LAN dev origins (Vite on 5173/5174, etc.) when not in production. */
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

export function createCorsOriginMatcher(primaryOrigin: string) {
  const allowed = resolveCorsAllowedOrigins(primaryOrigin);
  const isProd = process.env.NODE_ENV === "production";

  return (origin: string | undefined): string | null | undefined => {
    if (!origin) return allowed[0] ?? primaryOrigin;
    const normalized = origin.replace(/\/+$/, "");
    if (allowed.includes(normalized)) return origin;
    if (!isProd && isLocalDevOrigin(origin)) return origin;
    return null;
  };
}
