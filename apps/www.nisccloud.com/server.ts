/**
 * Production landing server: static SPA + same-origin `/api` reverse proxy to npanel-server.
 */
import { existsSync, readFileSync, statSync } from "fs";
import { extname, join, normalize } from "path";
// Public routes get their prerendered file; unknown paths get the SPA shell (React 404 page) with a 404 status.
import { SPA_SHELL_FILE, isPublicRoute, routeHtmlFile } from "./src/lib/public-routes.ts";
import { SECURITY_HEADERS } from "./src/lib/security-headers.ts";

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
const STREAM_PROXY_TIMEOUT_MS = 1_800_000;

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
/** Set when a load balancer in front of this host appends the client address to X-Forwarded-For. */
const TRUST_PROXY = process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true";

function clientAddress(request: Request, socketIp: string | null): string | null {
  if (TRUST_PROXY) {
    const hops = (request.headers.get("x-forwarded-for") ?? "").split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1] ?? null;
  }
  return socketIp;
}
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

function resolveStaticPath(pathname: string): { filePath: string; status: number } | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname.split("?")[0] ?? "/");
  } catch {
    return null;
  }
  const safeRelative = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = join(STATIC_ROOT, safeRelative === "/" ? "index.html" : safeRelative);

  if (!candidate.startsWith(STATIC_ROOT)) {
    return null;
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return { filePath: candidate, status: 200 };
  }

  // Asset-like paths (with an extension) that do not exist are plain 404s.
  if (extname(decoded)) {
    return null;
  }

  const route = decoded.replace(/\/+$/, "") || "/";
  if (isPublicRoute(route)) {
    const prerendered = join(STATIC_ROOT, routeHtmlFile(route));
    if (existsSync(prerendered)) return { filePath: prerendered, status: 200 };
  }
  const shellPath = [join(STATIC_ROOT, SPA_SHELL_FILE), join(STATIC_ROOT, "index.html")].find((p) => existsSync(p));
  if (!shellPath) return null;
  return { filePath: shellPath, status: isPublicRoute(route) ? 200 : 404 };
}

function serveStatic(pathname: string): Response {
  const resolved = resolveStaticPath(pathname);
  if (!resolved) {
    return new Response("Not Found", { status: 404 });
  }

  const body = readFileSync(resolved.filePath);
  const ext = extname(resolved.filePath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  const headers = new Headers({ "Content-Type": contentType });
  for (const { key, value } of SECURITY_HEADERS) headers.set(key, value);
  return new Response(body, { status: resolved.status, headers });
}

function buildProxyHeaders(request: Request, incoming: URL, clientIp: string | null): Headers {
  const headers = new Headers();

  for (const [key, value] of request.headers.entries()) {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
    const lower = key.toLowerCase();
    if (lower === "host") continue;
    // Client-supplied forwarding headers would let a caller choose the IP the backend rate-limits and logs.
    if (lower === "x-forwarded-for" || lower === "x-real-ip" || lower === "forwarded") continue;
    headers.set(key, value);
  }

  headers.set("host", BACKEND_ORIGIN.host);
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", incoming.protocol.replace(":", ""));
  headers.set("x-forwarded-for", clientIp ?? "unknown");

  return headers;
}

async function proxyToBackend(request: Request, clientIp: string | null): Promise<Response> {
  const incoming = new URL(request.url);
  const target = `${API_TARGET}${incoming.pathname}${incoming.search}`;
  const headers = buildProxyHeaders(request, incoming, clientIp);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const isStream =
    incoming.pathname === "/api/zeepo-ai/support/guest/stream" ||
    incoming.pathname === "/api/zeepo-ai/chat/stream" ||
    (request.headers.get("accept") ?? "").includes("text/event-stream");

  const backendResponse = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(isStream ? STREAM_PROXY_TIMEOUT_MS : PROXY_TIMEOUT_MS),
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
  async fetch(request, server) {
    const { pathname } = new URL(request.url);

    if (pathname === "/health" || pathname === "/healthz") {
      return Response.json({ status: "ok", service: "www-nisccloud" });
    }

    if (pathname.startsWith("/api/")) {
      try {
        return await proxyToBackend(request, clientAddress(request, server.requestIP(request)?.address ?? null));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[www-server] API proxy error:", message);
        return new Response("Bad Gateway", { status: 502 });
      }
    }

    return serveStatic(pathname);
  },
});
