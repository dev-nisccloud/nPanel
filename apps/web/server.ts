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

const BACKEND_ORIGIN = new URL(API_TARGET);
/** Default API proxy budget (non-streaming). */
const PROXY_TIMEOUT_MS = 55_000;
/**
 * PageSpeed Insights analysis can take up to 120s (Google release notes, 2021-03-02).
 * OpenProvider full TLD list (limit 2500 + prices) regularly exceeds 55s.
 * Cutting these off early produced plain-text upstream 503 "Service Unavailable"
 * that the tRPC client could not JSON-parse.
 */
const EXTENDED_API_PROXY_TIMEOUT_MS = 150_000;
/**
 * SSE / long tool turns (Zeepo AI image batches) need far longer than 55s.
 * Aborting the upstream mid-stream caused "reply ended unexpectedly" while
 * image jobs kept finishing in the background.
 */
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

const STATIC_ROOT = join(import.meta.dir, "build/client");
// Cloud Run injects PORT at runtime - do not set PORT in deploy env_vars or secrets.
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

  // Cloud Run routes by the backend service hostname - forwarding the web Host breaks upstream.
  headers.set("host", BACKEND_ORIGIN.host);
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", incoming.protocol.replace(":", ""));
  if (!headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", incoming.host);
  }

  return headers;
}

function isLongLivedApiProxy(pathname: string, request: Request): boolean {
  if (pathname === "/api/zeepo-ai/chat/stream") return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/event-stream");
}

/** Procedures that legitimately need longer than the default 55s proxy budget. */
function isExtendedTimeoutApiProxy(pathname: string): boolean {
  return (
    pathname.includes("pagespeedInsights") ||
    pathname.includes("openProvider.tlds")
  );
}

/** tRPC httpBatchLink expects a JSON array envelope even for a single procedure. */
function trpcProxyErrorResponse(status: number, message: string): Response {
  return Response.json(
    [
      {
        error: {
          message,
          code: -32603,
          data: {
            code: "INTERNAL_SERVER_ERROR",
            httpStatus: status,
          },
        },
      },
    ],
    { status },
  );
}

async function proxyToBackend(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const target = `${API_TARGET}${incoming.pathname}${incoming.search}`;
  const headers = buildProxyHeaders(request, incoming);

  const hasBody =
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.method !== "OPTIONS";

  const timeoutMs = isLongLivedApiProxy(incoming.pathname, request)
    ? STREAM_PROXY_TIMEOUT_MS
    : isExtendedTimeoutApiProxy(incoming.pathname)
      ? EXTENDED_API_PROXY_TIMEOUT_MS
      : PROXY_TIMEOUT_MS;

  const backendResponse = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    ...(hasBody ? { duplex: "half" as const } : {}),
  });

  const contentType = backendResponse.headers.get("content-type") ?? "";
  // Cloud Run / edge 5xx often returns plain text ("Service Unavailable"). Forwarding
  // that body makes the tRPC client throw JSON.parse errors in the UI.
  if (backendResponse.status >= 500 && !contentType.includes("json")) {
    const text = (await backendResponse.text()).trim();
    const friendly =
      /service unavailable/i.test(text) || text.length === 0
        ? "Service temporarily unavailable. Please try again."
        : text.slice(0, 300);
    return trpcProxyErrorResponse(backendResponse.status, friendly);
  }

  // Browser still sees this response as same-origin (web URL). Set-Cookie without Domain
  // attaches to the SPA host, which is what Better Auth OAuth needs.
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

    // Lightweight probe for the web container itself (no backend hop).
    if (pathname === "/health" || pathname === "/healthz") {
      return Response.json({ status: "ok", service: "npanel-web" });
    }

    if (pathname.startsWith("/api/")) {
      try {
        return await proxyToBackend(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[web-server] API proxy error:", message);
        const isTimeout =
          (error instanceof Error && error.name === "TimeoutError") ||
          /timeout|aborted/i.test(message);
        return trpcProxyErrorResponse(
          isTimeout ? 504 : 502,
          isTimeout
            ? "The request took too long. Please try again."
            : "Bad Gateway",
        );
      }
    }

    return serveStatic(pathname);
  },
});
