import { posts } from "../pages/blog/posts-data.ts";

/**
 * Every URL the SPA serves with HTTP 200. Must mirror the <Route>s in src/App.tsx.
 * Consumed by server.ts (Bun host) and checked against vercel.json at build time,
 * so anything not listed here is answered with the 404 page and a 404 status.
 */
export const STATIC_PUBLIC_ROUTES = [
  "/",
  "/services",
  "/services/marketing",
  "/services/brand-identity",
  "/services/website-design",
  "/services/ecommerce",
  "/services/seo",
  "/services/paid-ads",
  "/services/social-media",
  "/services/zepo-ai",
  "/services/email-marketing",
  "/contact",
  "/pricing",
  "/about",
  "/platform",
  "/work",
  "/blog",
  "/hosting",
  "/hosting/microsoft-365",
  "/hosting/google-workspace",
  "/hosting/transfer",
  "/hosting/agency",
  "/hosting/web-hosting",
  "/hosting/wordpress",
  "/hosting/vps",
  "/hosting/vds",
  "/hosting/dedicated-servers",
  "/hosting/domains",
  "/hosting/hybrid-email",
  "/hosting/email",
  "/hosting/ssl",
  "/help",
  "/whois",
  "/domain-transfer",
  "/security",
  "/security/email",
  "/security/ssl",
  "/security/malware-removal",
  "/security/website-maintenance",
  "/cart",
  "/terms",
  "/privacy",
  "/cookies",
] as const;

/** Retired URLs and their replacements, served as permanent (301/308) redirects by every host. */
export const PERMANENT_REDIRECTS: Readonly<Record<string, string>> = {
  "/services/zeepo-ai": "/services/zepo-ai",
  "/hosting/shared": "/hosting/web-hosting",
  "/blog/shared-vs-vps-hosting-kenya": "/blog/web-hosting-vs-vps-kenya",
};

export const PUBLIC_ROUTES: readonly string[] = [
  ...STATIC_PUBLIC_ROUTES,
  ...posts.map((p) => `/blog/${p.slug}`),
  ...Object.keys(PERMANENT_REDIRECTS),
];

/** Redirects and the noindex cart keep the plain SPA shell; everything else is prerendered. */
const NOT_PRERENDERED = new Set(["/cart", "/services/marketing", ...Object.keys(PERMANENT_REDIRECTS)]);

export const PRERENDER_ROUTES: readonly string[] = PUBLIC_ROUTES.filter((r) => !NOT_PRERENDERED.has(r));

/** Unrendered SPA shell, written by scripts/prerender.ts before dist/index.html becomes the prerendered homepage. */
export const SPA_SHELL_FILE = "/spa.html";

/** File served for a public route, relative to dist (e.g. `/hosting/vps/index.html`). */
export function routeHtmlFile(route: string): string {
  if (NOT_PRERENDERED.has(route)) return SPA_SHELL_FILE;
  if (route === "/") return "/index.html";
  return `${route}/index.html`;
}

const PUBLIC_ROUTE_SET = new Set(PUBLIC_ROUTES);

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_SET.has(pathname.replace(/\/+$/, "") || "/");
}
