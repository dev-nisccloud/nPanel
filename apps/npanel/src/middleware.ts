import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight middleware for basic auth protection
 * Only checks for session cookie existence (fast, no DB calls)
 * Role-based redirects are handled by Server Components in layouts
 */
export async function middleware(req: NextRequest) {
  try {
    return await runMiddleware(req);
  } catch (err) {
    // Prevent 500 from middleware (e.g. cookie/header issues in some runtimes); let layout handle request
    console.error("[Middleware] Error (continuing with request):", err instanceof Error ? err.message : String(err));
    return NextResponse.next();
  }
}

async function runMiddleware(req: NextRequest): Promise<NextResponse> {
  // Safe pathname: behind a proxy, nextUrl/pathname can be undefined or odd (e.g. "", "//", " / ")
  const rawPath = req.nextUrl?.pathname ?? "";
  const pathname = typeof rawPath === "string" ? rawPath.trim() : "";

  // CRITICAL: Prevent /agency routes from matching [slug] pattern
  // This must be checked BEFORE any other route matching
  if (pathname.startsWith("/agency")) {
    const isLoggedIn = await isSessionValid(req);
    if (!isLoggedIn) {
      const redirectRes = safeRedirectToLogin(req, pathname);
      if (redirectRes) return redirectRes;
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // Root: pass pathname so layout can render minimal shell (no getPreference/providers) for reliable first load.
  // Behind a proxy, root can be "", "/", "//", or trimmed " / "; normalize and treat all as root.
  const normalizedPath = pathname.replace(/\/+/g, "/");
  const isRoot = normalizedPath === "" || normalizedPath === "/";
  if (isRoot) {
    try {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-pathname", "/");
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      // If header copy/set fails (e.g. read-only in some runtimes), pass through; layout treats missing x-pathname as root
      return NextResponse.next();
    }
  }

  // If user hits auth pages while already authenticated, determine their role and redirect appropriately
  // Allow auth routes to proceed even if cookie exists
  // The client-side pages (login/register) will handle redirection if the user is already authenticated
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // Skip auth check for public routes
  const publicRoutes = ["/auth", "/api", "/_next", "/accept-invite", "/create-team", "/account-status", "/unauthorized", "/update-role"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For all other routes (team slug routes), require authentication
  const isLoggedIn = await isSessionValid(req);
  if (!isLoggedIn) {
    const redirectRes = safeRedirectToLogin(req, pathname);
    if (redirectRes) return redirectRes;
    return NextResponse.next();
  }

  return NextResponse.next();
}

/** Never throws: builds redirect to /auth/login or null if URL/redirect fails (e.g. invalid req.url behind proxy). */
function safeRedirectToLogin(req: NextRequest, pathname: string): NextResponse | null {
  try {
    const base = req.url ?? "http://localhost";
    const target = new URL("/auth/login", base);
    if (target.pathname !== pathname) {
      return NextResponse.redirect(target, 302);
    }
    return null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

/** Never throws: returns false on any error (e.g. cookies read-only or missing behind proxy). */
async function isSessionValid(req: NextRequest): Promise<boolean> {
  try {
    // OPTIMISTIC CHECK: Only check for the presence of the session cookie (no DB).
    const sessionCookie = req.cookies.get("better-auth.session_token") ??
      req.cookies.get("__Secure-better-auth.session_token");
    return !!sessionCookie?.value;
  } catch {
    return false;
  }
}
