import {
  isLandingPageOrigin,
  isLocalDevOrigin,
  resolveLandingPageOrigins,
} from "@npanel/auth/landing-page-origins";

export { isLandingPageOrigin, isLocalDevOrigin, resolveLandingPageOrigins };

/**
 * Resolve allowed browser origins for Hono CORS.
 * - CORS_ORIGIN: nPanel web app
 * - LANDING_PAGE_ORIGINS: marketing / storefront (www, Vercel, …)
 * - CORS_EXTRA_ORIGINS: optional extra comma-separated URLs
 */
export function resolveCorsAllowedOrigins(primaryOrigin: string): string[] {
  const origins = new Set<string>();
  const add = (url: string | undefined) => {
    if (!url) return;
    const normalized = url.trim().replace(/\/+$/, "");
    if (normalized) origins.add(normalized);
  };

  add(primaryOrigin);

  for (const o of resolveLandingPageOrigins()) {
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
