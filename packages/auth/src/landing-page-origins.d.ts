/**
 * Landing / storefront browser origins (www, staging, Vercel, local Vite).
 * Distinct from CORS_ORIGIN (nPanel web app).
 *
 * Env: LANDING_PAGE_ORIGINS=https://www.nisccloud.com,https://staging.nisccloud.com
 * Extra origins are merged with the built-in defaults (env never replaces them).
 */
/** Local/LAN Vite origins when not in production. */
export declare function isLocalDevOrigin(origin: string): boolean;
/**
 * Configured landing-page origins: built-in defaults plus any from env.
 * Does not include local-dev wildcards  use {@link isLandingPageOrigin} for that.
 */
export declare function resolveLandingPageOrigins(): string[];
/** True when the browser Origin is an allowed marketing/storefront host. */
export declare function isLandingPageOrigin(origin: string | null | undefined): boolean;
/**
 * Extract Origin from request headers (Origin, Referer origin, or forwarded host).
 */
export declare function getRequestBrowserOrigin(headers: Headers): string | null;
/**
 * Allow absolute return URLs only to LANDING_PAGE_ORIGINS (or local landing in dev),
 * limited to storefront cart paths to avoid open redirects.
 */
export declare function parseSafeLandingPageRedirect(raw: string | null | undefined): string | null;
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
export declare function isAllowedStorefrontBrowserRequest(headers: Headers | undefined): boolean;
