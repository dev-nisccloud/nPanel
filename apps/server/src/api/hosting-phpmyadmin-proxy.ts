import type { Context } from "hono";
import { createContext } from "@npanel/api";
import { getPleskPanelBase } from "@npanel/api/lib/plesk/session";

export const PHPMYADMIN_PROXY_PREFIX = "/api/hosting/phpmyadmin/proxy";

const FRAME_BUST_NOOP = "/* nPanel: phpMyAdmin stays in the dialog */\n";
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

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

type CachedAuth = { userId: string; expiresAt: number };
const proxyAuthCache = new Map<string, CachedAuth>();
const PROXY_AUTH_TTL_MS = 30_000;

type CookieJar = Map<string, string>;

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
    .replace(/target\s*=\s*(["'])_top\1/gi, "target=$1_self$1")
    .replace(/target\s*=\s*(["'])_parent\1/gi, "target=$1_self$1")
    .replace(/\bwindow\.top\.location(?:\.href)?\s*=/g, "window.self.location=")
    .replace(/\btop\.location(?:\.href)?\s*=/g, "self.location=")
    .replace(/\bparent\.location(?:\.href)?\s*=/g, "self.location=");
}

function rewritePleskUrls(body: string, requestOrigin: string): string {
  const plesk = getPleskPanelBase();
  const prefix = `${requestOrigin}${PHPMYADMIN_PROXY_PREFIX}`;
  const host = pleskOrigin().host;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let next = body.replaceAll(plesk, prefix);
  next = next.replaceAll(plesk.replace(/^https:/, "http:"), prefix);
  next = next.replaceAll(`//${host}`, prefix.replace(/^https?:/, ""));
  next = next.replace(new RegExp(`${escapedPrefix}${escapedPrefix}`, "g"), prefix);
  next = next.replace(
    /(^|["'`(=])\/(?!api\/hosting\/phpmyadmin\/proxy)(phpMyAdmin|smb\/|enterprise\/|modules\/phpMyAdmin)/g,
    `$1${PHPMYADMIN_PROXY_PREFIX}/$2`,
  );
  return neutralizeFrameBusting(next);
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
  return (
    pathname.startsWith("/phpMyAdmin") ||
    pathname.startsWith("/smb/") ||
    pathname.startsWith("/enterprise/") ||
    pathname.startsWith("/modules/phpMyAdmin") ||
    pathname.startsWith("/theme/") ||
    pathname.startsWith("/ui-library/") ||
    pathname.startsWith("/javascript/") ||
    pathname === "/favicon.ico"
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

function extractPhpMyAdminUrl(html: string, base: URL): URL | null {
  const patterns = [
    /(?:href|src|action)\s*=\s*["']([^"']*phpMyAdmin[^"']*)["']/i,
    /location(?:\.href)?\s*=\s*["']([^"']*phpMyAdmin[^"']*)["']/i,
    /(?:replace|assign)\(\s*["']([^"']*phpMyAdmin[^"']*)["']/i,
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (!match?.[1]) continue;
    try {
      return new URL(match[1].replace(/&amp;/g, "&"), base);
    } catch {
      // ignore malformed URLs in Plesk HTML
    }
  }
  return null;
}

function refreshUrl(res: Response, base: URL): URL | null {
  const refresh = res.headers.get("refresh");
  if (!refresh) return null;
  const match = refresh.match(/url\s*=\s*(.+)$/i);
  if (!match?.[1]) return null;
  try {
    return new URL(match[1].trim().replace(/^['"]|['"]$/g, ""), base);
  } catch {
    return null;
  }
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

type TlsFetchInit = RequestInit & {
  tls?: { rejectUnauthorized?: boolean };
};

async function fetchPlesk(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    redirect: "manual",
    tls: { rejectUnauthorized: false },
  } as TlsFetchInit);
}

async function followPleskDocument(
  startUrl: string,
  jar: CookieJar,
): Promise<{ response: Response; finalUrl: URL; setCookies: string[] }> {
  const plesk = pleskOrigin();
  let url = new URL(startUrl);
  const allSetCookies: string[] = [];
  let last: Response | null = null;

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

    const newly = readSetCookies(last);
    allSetCookies.push(...newly);
    applySetCookies(jar, newly);

    const location = last.headers.get("location");
    console.log("[phpMyAdmin proxy] hop", {
      status: last.status,
      path: url.pathname + url.search,
      location,
      contentType: last.headers.get("content-type"),
      cookies: jar.size,
    });

    if (last.status >= 300 && last.status < 400 && location) {
      const next = new URL(location, url);
      if (next.origin !== plesk.origin) break;
      url = next;
      continue;
    }

    const viaRefresh = refreshUrl(last, url);
    if (viaRefresh && viaRefresh.origin === plesk.origin) {
      url = viaRefresh;
      continue;
    }

    const contentType = last.headers.get("content-type") ?? "";
    if (contentType.includes("text/html") && !url.pathname.includes("phpMyAdmin")) {
      const html = await last.text();
      const pma = extractPhpMyAdminUrl(html, url);
      if (pma && pma.origin === plesk.origin && pma.href !== url.href) {
        url = pma;
        continue;
      }
      return {
        response: new Response(html, {
          status: last.status,
          headers: last.headers,
        }),
        finalUrl: url,
        setCookies: allSetCookies,
      };
    }

    break;
  }

  if (!last) throw new Error("No response from Plesk");
  return { response: last, finalUrl: url, setCookies: allSetCookies };
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
  const origin = requestOriginFrom(c);
  const jar: CookieJar = new Map();
  const { finalUrl, setCookies } = await followPleskDocument(pleskSsoUrl, jar);
  const headers = cookieResponseHeaders(setCookies);
  headers.set("location", proxyUrlFor(finalUrl, origin));
  return new Response(null, { status: 302, headers });
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
  if (!isAllowedProxyPath(restPath)) {
    return c.text("Forbidden", 403);
  }

  if (restPath.includes("cross_framing_protection")) {
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
  const shouldFollowSso =
    method === "GET" &&
    (restPath.includes("rsession_init") || restPath.includes("/smb/database/webadmin"));

  if (shouldFollowSso) {
    const start = new URL(getPleskPanelBase());
    start.pathname = restPath;
    start.search = url.search;
    const jar: CookieJar = new Map();
    const { finalUrl, setCookies } = await followPleskDocument(start.toString(), jar);
    const dest = proxyUrlFor(finalUrl, origin);
    if (finalUrl.pathname !== restPath || finalUrl.search !== url.search) {
      const headers = cookieResponseHeaders(setCookies);
      headers.set("location", dest);
      return new Response(null, { status: 302, headers });
    }
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
    outgoing.set(key, value);
  });
  outgoing.set("host", upstream.host);
  outgoing.set("accept-encoding", "identity");
  outgoing.set("user-agent", c.req.header("user-agent") || CHROME_UA);
  outgoing.set("referer", `${getPleskPanelBase()}/`);

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
    const setCookies = readSetCookies(response);
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (HOP_BY_HOP.has(lower)) return;
      if (
        lower === "x-frame-options" ||
        lower === "content-security-policy" ||
        lower === "content-length" ||
        lower === "set-cookie"
      ) {
        return;
      }
      if (lower === "location") {
        headers.set("location", rewriteLocation(value, origin));
        return;
      }
      headers.set(key, value);
    });
    for (const cookie of setCookies) {
      headers.append("set-cookie", rewriteSetCookie(cookie));
    }
    headers.set("x-frame-options", "SAMEORIGIN");

    const contentType = headers.get("content-type");
    if (shouldRewrite(contentType) && method !== "HEAD") {
      const text = await response.text();
      return new Response(rewritePleskUrls(text, origin), {
        status: response.status,
        headers,
      });
    }

    const payload = method === "HEAD" ? null : await response.arrayBuffer();
    return new Response(payload, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("[phpMyAdmin proxy] error:", error);
    return c.text("Could not load phpMyAdmin.", 502);
  }
}
