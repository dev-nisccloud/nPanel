/**
 * Production landing server: static SPA + same-origin `/api` reverse proxy to npanel-server.
 */
import { existsSync, readFileSync } from "fs";
import { extname, join, normalize } from "path";

const API_TARGET = (
  process.env.VITE_NPANEL_SERVER_URL ??
  process.env.NPANEL_SERVER_URL ??
  ""
).replace(/\/+$/, "");

if (!API_TARGET) {
  console.error("[www-server] VITE_NPANEL_SERVER_URL or NPANEL_SERVER_URL is required at runtime.");
  process.exit(1);
}

const BACKEND_ORIGIN = new URL(API_TARGET);
const PROXY_TIMEOUT_MS = 55_000;

const HOP_BY_HOP_HEADERS = new Set([
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

const STATIC_ROOT = join(import.meta.dir, "dist");
const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8080;
const HOSTNAME = process.env.HOSTNAME ?? "0.0.0.0";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function resolveStaticPath(pathname: string): string | null {
  const decoded = decodeURIComponent(pathname.split("?")[0] ?? "/");
  const safeRelative = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = join(STATIC_ROOT, safeRelative === "/" ? "index.html" : safeRelative);

  if (!candidate.startsWith(STATIC_ROOT)) {
    return null;
  }

  if (existsSync(candidate) && !candidate.endsWith("/")) {
    return candidate;
  }

  const indexPath = join(STATIC_ROOT, "index.html");
  return existsSync(indexPath) ? indexPath : null;
}

function serveStatic(pathname: string): Response {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    return new Response("Not Found", { status: 404 });
  }

  const body = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": contentType },
  });
}

function buildProxyHeaders(request: Request, incoming: URL): Headers {
  const headers = new Headers();

  for (const [key, value] of request.headers.entries()) {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
    if (key.toLowerCase() === "host") continue;
    headers.set(key, value);
  }

  headers.set("host", BACKEND_ORIGIN.host);
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", incoming.protocol.replace(":", ""));
  if (!headers.has("x-forwarded-for")) {
    // Prefer a real client address; never use the Host header (hostname:port).
    const clientIp =
      request.headers.get("cf-connecting-ip")?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      "unknown";
    headers.set("x-forwarded-for", clientIp);
  }

  return headers;
}

async function proxyToBackend(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const target = `${API_TARGET}${incoming.pathname}${incoming.search}`;
  const headers = buildProxyHeaders(request, incoming);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const backendResponse = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    ...(hasBody ? { duplex: "half" as const } : {}),
  });

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: backendResponse.headers,
  });
}

console.log(`[www-server] Serving ${STATIC_ROOT}`);
console.log(`[www-server] Proxying /api/* -> ${API_TARGET}`);
console.log(`[www-server] Listening on ${HOSTNAME}:${PORT}`);

Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (pathname === "/health" || pathname === "/healthz") {
      return Response.json({ status: "ok", service: "www-nisccloud" });
    }

    if (pathname.startsWith("/api/")) {
      try {
        return await proxyToBackend(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[www-server] API proxy error:", message);
        return new Response("Bad Gateway", { status: 502 });
      }
    }

    return serveStatic(pathname);
  },
});
