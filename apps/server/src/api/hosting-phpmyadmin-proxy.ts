import type { Context } from "hono";
import { createContext } from "@npanel/api";
import { getPleskPanelBase } from "@npanel/api/lib/plesk/session";

export const PHPMYADMIN_PROXY_PREFIX = "/api/hosting/phpmyadmin/proxy";

const FRAME_BUST_NOOP = `/* nPanel: keep phpMyAdmin in the iframe and undo clickjack hiding */
(function () {
  function reveal() {
    var style = document.getElementById("cfs-style");
    if (style && style.parentNode) style.parentNode.removeChild(style);
    if (document.documentElement) document.documentElement.style.display = "block";
  }
  reveal();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reveal);
  }
})();
`;
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

type TlsFetchInit = RequestInit & {
  tls?: { rejectUnauthorized?: boolean };
};

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const REWRITE_TYPES = [
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/x-javascript",
  "application/json",
  "application/xml",
  "text/xml",
  "application/xhtml+xml",
];

const DROP_COOKIE_PREFIX = /^(better-auth|__secure-better-auth|np\.|npanel)/i;

type CachedAuth = { userId: string; expiresAt: number };
const proxyAuthCache = new Map<string, CachedAuth>();
const PROXY_AUTH_TTL_MS = 30_000;

type CookieJar = Map<string, string>;

type PleskFetchResult = {
  status: number;
  headers: Headers;
  setCookies: string[];
  body: ArrayBuffer;
};

function pleskOrigin(): URL {
  return new URL(getPleskPanelBase());
}

function shouldRewrite(contentType: string | null): boolean {
  if (!contentType) return false;
  const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return REWRITE_TYPES.includes(type);
}

function neutralizeFrameBusting(body: string): string {
  return body
    .replace(/<style\b[^>]*id=["']cfs-style["'][^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/html\s*\{\s*display\s*:\s*none\s*;?\s*\}/gi, "html{display:block}")
    .replace(/target\s*=\s*(["'])_top\1/gi, "target=$1_self$1")
    .replace(/target\s*=\s*(["'])_parent\1/gi, "target=$1_self$1")
    .replace(/\bwindow\.top\.location(?:\.href)?\s*=/g, "window.self.location=")
    .replace(/\btop\.location(?:\.href)?\s*=/g, "self.location=")
    .replace(/\bparent\.location(?:\.href)?\s*=/g, "self.location=");
}

function rewritePleskUrls(body: string, requestOrigin: string, contentType: string | null): string {
  const plesk = getPleskPanelBase();
  const prefix = `${requestOrigin}${PHPMYADMIN_PROXY_PREFIX}`;
  const type = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";

  let next = body.replaceAll(plesk, prefix);
  next = next.replaceAll(plesk.replace(/^https:/, "http:"), prefix);

  if (type === "text/html" || type === "application/xhtml+xml") {
    next = next.replace(
      /(^|["'`(=])\/(?!api\/hosting\/phpmyadmin\/proxy)(phpMyAdmin|modules\/phpMyAdmin)/g,
      `$1${PHPMYADMIN_PROXY_PREFIX}/$2`,
    );
    if (!/<style\b[^>]*id=["']npanel-pma-frame["']/i.test(next)) {
      next = next.replace(
        /<head([^>]*)>/i,
        `<head$1><style id="npanel-pma-frame">html{display:block!important}</style>`,
      );
    }
    return neutralizeFrameBusting(next);
  }

  return next;
}

function rewriteLocation(location: string, requestOrigin: string): string {
  try {
    const plesk = pleskOrigin();
    const resolved = new URL(location, plesk);
    if (resolved.origin === plesk.origin) {
      return `${requestOrigin}${PHPMYADMIN_PROXY_PREFIX}${resolved.pathname}${resolved.search}${resolved.hash}`;
    }
    return location;
  } catch {
    if (location.startsWith("/") && !location.startsWith(PHPMYADMIN_PROXY_PREFIX)) {
      return `${requestOrigin}${PHPMYADMIN_PROXY_PREFIX}${location}`;
    }
    return location;
  }
}

function rewriteSetCookie(value: string): string {
  let next = value
    .replace(/;\s*domain=[^;]*/i, "")
    .replace(/;\s*secure/gi, "")
    .replace(/;\s*samesite=[^;]*/gi, "");
  if (/;\s*path=/i.test(next)) {
    next = next.replace(/;\s*path=[^;]*/i, `; Path=${PHPMYADMIN_PROXY_PREFIX}`);
  } else {
    next = `${next}; Path=${PHPMYADMIN_PROXY_PREFIX}`;
  }
  return next.trim();
}

function requestOriginFrom(c: Context): string {
  const proto = c.req.header("x-forwarded-proto") || new URL(c.req.url).protocol.replace(":", "");
  const host = c.req.header("x-forwarded-host") || c.req.header("host") || new URL(c.req.url).host;
  return `${proto}://${host}`;
}

function isAllowedProxyPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return (
    path.startsWith("/phpmyadmin") ||
    path.startsWith("/modules/phpmyadmin") ||
    path.startsWith("/theme/") ||
    path.startsWith("/favicon.ico")
  );
}

function isPhpMyAdminPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return path.includes("phpmyadmin");
}

function isSsoBootstrapPath(pathname: string): boolean {
  return (
    pathname.includes("rsession_init") || pathname.includes("/smb/database/webadmin")
  );
}

function readSetCookies(res: Response): string[] {
  if (typeof res.headers.getSetCookie === "function") {
    const list = res.headers.getSetCookie();
    if (list.length > 0) return list;
  }
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
}

function parseCookiePair(setCookie: string): { name: string; value: string } | null {
  const first = setCookie.split(";")[0] ?? "";
  const eq = first.indexOf("=");
  if (eq <= 0) return null;
  const name = first.slice(0, eq).trim();
  const value = first.slice(eq + 1).trim();
  if (!name) return null;
  return { name, value };
}

function applySetCookies(jar: CookieJar, setCookies: string[]) {
  for (const line of setCookies) {
    const parsed = parseCookiePair(line);
    if (parsed) jar.set(parsed.name, parsed.value);
  }
}

function cookieHeaderFromJar(jar: CookieJar): string {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function cookiesForPlesk(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const kept = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const name = part.split("=")[0]?.trim() ?? "";
      return name.length > 0 && !DROP_COOKIE_PREFIX.test(name);
    });
  return kept.length > 0 ? kept.join("; ") : undefined;
}

function extractPhpMyAdminUrl(html: string, base: URL): URL | null {
  const patterns = [
    /window\.open\s*\(\s*["']([^"']+)["']/i,
    /(?:href|src|action)\s*=\s*["']([^"']*phpMyAdmin[^"']*)["']/i,
    /location(?:\.href)?\s*=\s*["']([^"']*phpMyAdmin[^"']*)["']/i,
    /(?:replace|assign)\(\s*["']([^"']*phpMyAdmin[^"']*)["']/i,
    /["']([^"']*\/phpMyAdmin[^"']*)["']/i,
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (!match?.[1]) continue;
    try {
      const found = new URL(match[1].replace(/&amp;/g, "&"), base);
      if (isPhpMyAdminPath(found.pathname)) return found;
    } catch {
      // ignore malformed URLs in Plesk HTML
    }
  }
  return null;
}

function refreshUrl(headers: Headers, base: URL): URL | null {
  const refresh = headers.get("refresh");
  if (!refresh) return null;
  const match = refresh.match(/url\s*=\s*(.+)$/i);
  if (!match?.[1]) return null;
  try {
    return new URL(match[1].trim().replace(/^['"]|['"]$/g, ""), base);
  } catch {
    return null;
  }
}

function decodeText(body: ArrayBuffer): string {
  return new TextDecoder("utf-8").decode(body);
}

async function requireProxyUser(c: Context): Promise<string | null> {
  const cookie = c.req.header("cookie") ?? "";
  const cached = proxyAuthCache.get(cookie);
  if (cached && cached.expiresAt > Date.now()) return cached.userId;

  const ctx = await createContext({ context: c });
  const userId = ctx.session?.user?.id;
  if (!userId) return null;

  proxyAuthCache.set(cookie, { userId, expiresAt: Date.now() + PROXY_AUTH_TTL_MS });
  if (proxyAuthCache.size > 200) {
    const now = Date.now();
    for (const [key, value] of proxyAuthCache) {
      if (value.expiresAt <= now) proxyAuthCache.delete(key);
    }
  }
  return userId;
}

async function fetchPlesk(url: string, init: RequestInit = {}): Promise<PleskFetchResult> {
  // Bun's undici build uses native fetch and ignores Agent rejectUnauthorized.
  // Plesk's cert hostname does not match orion.nisccloud.com.
  const response = await fetch(url, {
    method: init.method || "GET",
    headers: init.headers,
    body: init.body,
    signal: init.signal,
    redirect: "manual",
    tls: { rejectUnauthorized: false },
  } as TlsFetchInit);

  const headers = new Headers();
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") headers.set(key, value);
  });

  return {
    status: response.status,
    headers,
    setCookies: readSetCookies(response),
    body: await response.arrayBuffer(),
  };
}

async function followPleskDocument(
  startUrl: string,
  jar: CookieJar,
): Promise<{ result: PleskFetchResult; finalUrl: URL; setCookies: string[] }> {
  const plesk = pleskOrigin();
  let url = new URL(startUrl);
  const allSetCookies: string[] = [];
  let last: PleskFetchResult | null = null;
  let triedPhpMyAdminFallback = false;

  for (let hop = 0; hop < 12; hop++) {
    const headers = new Headers();
    headers.set("host", url.host);
    headers.set("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    headers.set("accept-encoding", "identity");
    headers.set("user-agent", CHROME_UA);
    headers.set("referer", `${plesk.origin}/`);
    const cookie = cookieHeaderFromJar(jar);
    if (cookie) headers.set("cookie", cookie);

    last = await fetchPlesk(url.toString(), {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(60_000),
    });

    allSetCookies.push(...last.setCookies);
    applySetCookies(jar, last.setCookies);

    const location = last.headers.get("location");
    const contentType = last.headers.get("content-type") ?? "";
    console.log("[phpMyAdmin proxy] hop", {
      status: last.status,
      path: url.pathname + url.search,
      location,
      contentType,
      cookies: jar.size,
    });

    if (last.status >= 300 && last.status < 400 && location) {
      const next = new URL(location, url);
      if (next.origin !== plesk.origin) break;
      if (triedPhpMyAdminFallback && !isPhpMyAdminPath(next.pathname)) break;
      url = next;
      continue;
    }

    const viaRefresh = refreshUrl(last.headers, url);
    if (viaRefresh && viaRefresh.origin === plesk.origin) {
      url = viaRefresh;
      continue;
    }

    if (contentType.includes("text/html")) {
      const html = decodeText(last.body);
      const pma = extractPhpMyAdminUrl(html, url);
      if (pma && pma.origin === plesk.origin && pma.href !== url.href) {
        url = pma;
        continue;
      }

      if (isPhpMyAdminPath(url.pathname)) {
        break;
      }

      if (!triedPhpMyAdminFallback) {
        triedPhpMyAdminFallback = true;
        console.log("[phpMyAdmin proxy] html preview", {
          path: url.pathname,
          snippet: html.slice(0, 600).replace(/\s+/g, " "),
        });
        url = new URL("/phpMyAdmin/index.php", plesk);
        continue;
      }
    }

    break;
  }

  if (!last) throw new Error("No response from Plesk");
  return { result: last, finalUrl: url, setCookies: allSetCookies };
}

function proxyUrlFor(finalUrl: URL, requestOrigin: string): string {
  return `${requestOrigin}${PHPMYADMIN_PROXY_PREFIX}${finalUrl.pathname}${finalUrl.search}${finalUrl.hash}`;
}

function cookieResponseHeaders(setCookies: string[]): Headers {
  const headers = new Headers();
  for (const cookie of setCookies) {
    headers.append("set-cookie", rewriteSetCookie(cookie));
  }
  headers.set("x-frame-options", "SAMEORIGIN");
  headers.set("cache-control", "no-store");
  return headers;
}

/** Consume Plesk SSO redirects server-side, then send the iframe to phpMyAdmin. */
export async function bootstrapPhpMyAdminEmbed(
  c: Context,
  pleskSsoUrl: string,
): Promise<Response> {
  try {
    const origin = requestOriginFrom(c);
    const jar: CookieJar = new Map();
    const { finalUrl, setCookies } = await followPleskDocument(pleskSsoUrl, jar);

    if (!isPhpMyAdminPath(finalUrl.pathname)) {
      console.error("[phpMyAdmin proxy] SSO did not reach phpMyAdmin", {
        finalPath: finalUrl.pathname + finalUrl.search,
      });
      return c.text("Could not open phpMyAdmin. Please try again.", 502);
    }

    const headers = cookieResponseHeaders(setCookies);
    headers.set("location", proxyUrlFor(finalUrl, origin));
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error("[phpMyAdmin proxy] bootstrap error:", error);
    return c.text("Could not open phpMyAdmin. Please try again.", 502);
  }
}

export async function handlePhpMyAdminProxy(c: Context) {
  const userId = await requireProxyUser(c);
  if (!userId) {
    return c.text("Unauthorized", 401);
  }

  const prefix = PHPMYADMIN_PROXY_PREFIX;
  const url = new URL(c.req.url);
  if (!url.pathname.startsWith(`${prefix}/`) && url.pathname !== prefix) {
    return c.text("Not found", 404);
  }

  const restPath = url.pathname === prefix ? "/" : url.pathname.slice(prefix.length);
  if (!restPath.startsWith("/") || restPath.includes("..")) {
    return c.text("Invalid path", 400);
  }

  if (restPath.toLowerCase().includes("cross_framing_protection")) {
    return new Response(FRAME_BUST_NOOP, {
      status: 200,
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const method = c.req.method.toUpperCase();
  const origin = requestOriginFrom(c);

  if (method === "GET" && isSsoBootstrapPath(restPath)) {
    const start = new URL(getPleskPanelBase());
    start.pathname = restPath;
    start.search = url.search;
    try {
      const jar: CookieJar = new Map();
      const incoming = cookiesForPlesk(c.req.header("cookie"));
      if (incoming) {
        for (const part of incoming.split(";")) {
          const parsed = parseCookiePair(part.trim());
          if (parsed) jar.set(parsed.name, parsed.value);
        }
      }
      const { finalUrl, setCookies } = await followPleskDocument(start.toString(), jar);
      if (isPhpMyAdminPath(finalUrl.pathname) && finalUrl.pathname !== restPath) {
        const headers = cookieResponseHeaders(setCookies);
        headers.set("location", proxyUrlFor(finalUrl, origin));
        return new Response(null, { status: 302, headers });
      }
    } catch (error) {
      console.error("[phpMyAdmin proxy] SSO follow error:", error);
      return c.text("Could not open phpMyAdmin. Please try again.", 502);
    }
  }

  if (!isAllowedProxyPath(restPath)) {
    return c.text("Forbidden", 403);
  }

  const upstream = new URL(getPleskPanelBase());
  upstream.pathname = restPath;
  upstream.search = url.search;

  const outgoing = new Headers();
  c.req.raw.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === "host" || lower === "origin" || lower === "referer") return;
    if (lower === "accept-encoding") return;
    if (lower === "cookie") return;
    outgoing.set(key, value);
  });
  outgoing.set("host", upstream.host);
  outgoing.set("accept-encoding", "identity");
  outgoing.set("user-agent", c.req.header("user-agent") || CHROME_UA);
  outgoing.set("referer", `${getPleskPanelBase()}/`);
  const cookie = cookiesForPlesk(c.req.header("cookie"));
  if (cookie) outgoing.set("cookie", cookie);

  const body =
    method === "GET" || method === "HEAD" ? undefined : Buffer.from(await c.req.arrayBuffer());

  try {
    const response = await fetchPlesk(upstream.toString(), {
      method,
      headers: outgoing,
      body,
      signal: AbortSignal.timeout(120_000),
    });

    const headers = new Headers();
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (HOP_BY_HOP.has(lower)) return;
      if (
        lower === "x-frame-options" ||
        lower === "content-security-policy" ||
        lower === "content-length"
      ) {
        return;
      }
      if (lower === "location") {
        headers.set("location", rewriteLocation(value, origin));
        return;
      }
      headers.set(key, value);
    });
    for (const cookieLine of response.setCookies) {
      headers.append("set-cookie", rewriteSetCookie(cookieLine));
    }
    headers.set("x-frame-options", "SAMEORIGIN");

    const contentType = headers.get("content-type");
    if (shouldRewrite(contentType) && method !== "HEAD") {
      return new Response(rewritePleskUrls(decodeText(response.body), origin, contentType), {
        status: response.status,
        headers,
      });
    }

    const payload = method === "HEAD" ? null : response.body;
    return new Response(payload, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("[phpMyAdmin proxy] error:", error);
    return c.text("Could not load phpMyAdmin.", 502);
  }
}
