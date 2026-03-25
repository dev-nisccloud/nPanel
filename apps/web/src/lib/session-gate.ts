/**
 * Route classification for client-side auth gating.
 * No DB calls — session presence is checked via better-auth client (getSession).
 */

/** Normalize pathname: trim, collapse slashes, ensure leading slash. */
export function normalizePathname(pathname: string): string {
  const raw = typeof pathname === "string" ? pathname.trim() : "";
  const collapsed = raw.replace(/\/+/g, "/");
  if (collapsed === "" || collapsed === "/") return "/";
  return collapsed.startsWith("/") ? collapsed : `/${collapsed}`;
}

const PUBLIC_PREFIXES = [
  "/auth",
  "/api",
  "/accept-invite",
  "/create-team",
  "/account-status",
  "/unauthorized",
  "/update-role",
  "/offline",
  "/manifest.webmanifest",
  "/favicon",
  "/sw.js",
  "/.well-known",
] as const;

/** True if the path is allowed without a session (public / assets). */
export function isPublicPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  if (p === "/") return true;
  if (PUBLIC_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) {
    return true;
  }
  // Vite / PWA static assets often live under these patterns
  if (/\.(ico|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot|map)$/i.test(p)) {
    return true;
  }
  return false;
}

/** Build login URL with optional post-login return path. */
export function loginRedirectUrl(pathname: string): string {
  const p = normalizePathname(pathname);
  const params = new URLSearchParams();
  if (p && p !== "/" && !p.startsWith("/auth")) {
    params.set("redirect", p);
  }
  const q = params.toString();
  return q ? `/auth/login?${q}` : "/auth/login";
}
