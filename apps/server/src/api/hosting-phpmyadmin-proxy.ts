import { Agent, request } from "undici";
import type { Context } from "hono";
import { createContext } from "@npanel/api";
import { getPleskPanelBase } from "@npanel/api/lib/plesk/session";

export const PHPMYADMIN_PROXY_PREFIX = "/api/hosting/phpmyadmin/proxy";

const pleskProxyAgent = new Agent({
  connections: 8,
  pipelining: 1,
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 60_000,
  connect: { rejectUnauthorized: false },
});

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

function pleskOrigin(): URL {
  return new URL(getPleskPanelBase());
}

function shouldRewrite(contentType: string | null): boolean {
  if (!contentType) return false;
  const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return REWRITE_TYPES.includes(type);
}

function rewritePleskUrls(body: string, requestOrigin: string): string {
  const plesk = getPleskPanelBase();
  const prefix = `${requestOrigin}${PHPMYADMIN_PROXY_PREFIX}`;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let next = body.replaceAll(plesk, prefix);
  next = next.replaceAll(plesk.replace(/^https:/, "http:"), prefix);

  // Avoid double-prefixing paths we already rewrote.
  next = next.replace(new RegExp(`${escapedPrefix}${escapedPrefix}`, "g"), prefix);

  next = next.replace(
    /(^|["'`(=])\/(?!api\/hosting\/phpmyadmin\/proxy)(phpMyAdmin|smb\/|enterprise\/|modules\/phpMyAdmin)/g,
    `$1${PHPMYADMIN_PROXY_PREFIX}/$2`,
  );
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

export async function handlePhpMyAdminProxy(c: Context) {
  const ctx = await createContext({ context: c });
  if (!ctx.session?.user?.id) {
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

  const method = c.req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : Buffer.from(await c.req.arrayBuffer());

  try {
    const response = await request(upstream.toString(), {
      method,
      headers: Object.fromEntries(outgoing.entries()),
      body,
      dispatcher: pleskProxyAgent,
      signal: AbortSignal.timeout(120_000),
    });

    const origin = requestOriginFrom(c);
    const headers = new Headers();
    for (const [key, value] of Object.entries(response.headers)) {
      if (value == null) continue;
      const lower = key.toLowerCase();
      if (HOP_BY_HOP.has(lower)) continue;
      if (lower === "x-frame-options" || lower === "content-security-policy" || lower === "content-length") {
        continue;
      }
      const values = Array.isArray(value) ? value : [value];
      if (lower === "set-cookie") {
        for (const cookie of values) {
          headers.append("set-cookie", rewriteSetCookie(String(cookie)));
        }
        continue;
      }
      if (lower === "location") {
        headers.set("location", rewriteLocation(String(values[0]), origin));
        continue;
      }
      headers.set(key, String(values[0]));
    }
    headers.set("x-frame-options", "SAMEORIGIN");

    const contentType = headers.get("content-type");
    if (shouldRewrite(contentType) && method !== "HEAD") {
      const text = await response.body.text();
      const rewritten = rewritePleskUrls(text, origin);
      return new Response(rewritten, {
        status: response.statusCode,
        headers,
      });
    }

    const payload = method === "HEAD" ? null : await response.body.arrayBuffer();
    return new Response(payload, {
      status: response.statusCode,
      headers,
    });
  } catch (error) {
    console.error("[phpMyAdmin proxy] error:", error);
    return c.text("Could not load phpMyAdmin. Try opening it in a new tab.", 502);
  }
}
