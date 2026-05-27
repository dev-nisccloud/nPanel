/**
 * Production web server: static SPA + same-origin `/api` reverse proxy.
 *
 * Better Auth OAuth state cookies must be set on the user-facing origin.
 * See https://www.better-auth.com/docs/concepts/cookies (Safari / cross-domain).
 */
import { existsSync, readFileSync } from "fs";
import { extname, join, normalize } from "path";

const API_TARGET = (process.env.VITE_SERVER_URL ?? "").replace(/\/+$/, "");
if (!API_TARGET) {
  console.error("[web-server] VITE_SERVER_URL is required at runtime.");
  process.exit(1);
}

const STATIC_ROOT = join(import.meta.dir, "build/client");
// Cloud Run injects PORT at runtime — do not set PORT in deploy env_vars or secrets.
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

async function proxyToBackend(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const target = `${API_TARGET}${incoming.pathname}${incoming.search}`;

  const headers = new Headers(request.headers);
  // Keep the browser Host (frontend origin). Matches Vite dev proxy `changeOrigin: false`
  // so Better Auth Set-Cookie values attach to the SPA origin, not the API host.

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const backendResponse = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
    ...(hasBody ? { duplex: "half" as const } : {}),
  });

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: backendResponse.headers,
  });
}

console.log(`[web-server] Serving ${STATIC_ROOT}`);
console.log(`[web-server] Proxying /api/* -> ${API_TARGET}`);
console.log(`[web-server] Listening on ${HOSTNAME}:${PORT}`);

Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/")) {
      try {
        return await proxyToBackend(request);
      } catch (error) {
        console.error("[web-server] API proxy error:", error);
        return new Response("Bad Gateway", { status: 502 });
      }
    }

    return serveStatic(pathname);
  },
});
