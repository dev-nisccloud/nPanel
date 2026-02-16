import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight middleware for basic auth protection
 * Only checks for session cookie existence (fast, no DB calls)
 * Role-based redirects are handled by Server Components in layouts
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // console.log("[Middleware] Processing request for:", pathname);

  // CRITICAL: Prevent /agency routes from matching [slug] pattern
  // This must be checked BEFORE any other route matching
  if (pathname.startsWith("/agency")) {
    // console.log("[Middleware] Handling /agency route:", pathname);
    const isLoggedIn = await isSessionValid(req);
    // console.log("[Middleware] Session valid for /agency:", isLoggedIn, "pathname:", pathname);
    if (!isLoggedIn) {
      // console.log("[Middleware] Not logged in, redirecting to /auth/login");
      const target = new URL("/auth/login", req.url);
      if (target.pathname !== pathname) {
        return NextResponse.redirect(target, 302);
      }
      return NextResponse.next();
    }
    // console.log("[Middleware] Allowing /agency route through");
    return NextResponse.next();
  }

  // Allow root to resolve auth server-side (prevents ping-pong at entry)
  if (pathname === "/") {
    return NextResponse.next();
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
  // This covers /{team-slug}/... routes
  // NOTE: /agency routes are handled above and will never reach here
  const isLoggedIn = await isSessionValid(req);

  if (!isLoggedIn) {
    const target = new URL("/auth/login", req.url);
    if (target.pathname !== pathname) {
      return NextResponse.redirect(target, 302);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
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

async function isSessionValid(req: NextRequest): Promise<boolean> {
  // OPTIMISTIC CHECK: Only check for the presence of the session cookie.
  // We do NOT fetch the session here because:
  // 1. It causes deadlocks in dev mode (Middleware waits for API, API waits for compiler).
  // 2. It adds massive latency to every request.
  // 3. The actual security verification happens in the Server Components (Layouts/Pages) via lib/auth-server.ts

  // Check for both insecure (dev) and secure (prod) cookie names
  // Better Auth prefixes cookies with __Secure- in production/https environments
  const sessionCookie = req.cookies.get("better-auth.session_token") ||
    req.cookies.get("__Secure-better-auth.session_token");

  return !!sessionCookie?.value;
}
