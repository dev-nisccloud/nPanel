import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight middleware for basic auth protection
 * Only checks for session cookie existence (fast, no DB calls)
 * Role-based redirects are handled by Server Components in layouts
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log("[Middleware] Processing request for:", pathname);
  
  // CRITICAL: Prevent /agency routes from matching [slug] pattern
  // This must be checked BEFORE any other route matching
  if (pathname.startsWith("/agency")) {
    console.log("[Middleware] Handling /agency route:", pathname);
    const isLoggedIn = await isSessionValid(req);
    console.log("[Middleware] Session valid for /agency:", isLoggedIn, "pathname:", pathname);
    if (!isLoggedIn) {
      console.log("[Middleware] Not logged in, redirecting to /auth/login");
      const target = new URL("/auth/login", req.url);
      if (target.pathname !== pathname) {
        return NextResponse.redirect(target, 302);
      }
      return NextResponse.next();
    }
    console.log("[Middleware] Allowing /agency route through");
    return NextResponse.next();
  }
  
  // Allow root to resolve auth server-side (prevents ping-pong at entry)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // If user hits auth pages while already authenticated, determine their role and redirect appropriately
  if (pathname.startsWith("/auth")) {
    console.log("[Middleware] Handling /auth route:", pathname);
    const isLoggedIn = await isSessionValid(req);
    console.log("[Middleware] Session valid for /auth:", isLoggedIn);
    if (isLoggedIn && pathname !== "/") {
      // User is logged in, but we can't determine role in middleware (Edge Runtime limitation)
      // So redirect to root and let the server component handle role-based redirect
      console.log("[Middleware] User logged in on /auth, redirecting to / (server will handle role-based redirect)");
      return NextResponse.redirect(new URL("/", req.url), 302);
    }
    console.log("[Middleware] Allowing /auth route through");
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
  try {
    // CRITICAL FIX: Construct origin from headers to handle ngrok/production correctly
    // Use the same approach as auth-server.ts to ensure consistency
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const xfProto = req.headers.get("x-forwarded-proto") || "";
    const proto = xfProto.includes("https") ? "https" : (xfProto.includes("http") ? "http" : (req.nextUrl.protocol === "https:" ? "https" : "http"));
    const origin = host ? `${proto}://${host}` : req.nextUrl.origin;
    
    const url = new URL("/api/auth/get-session", origin);
    
    // Get all cookies from the request - CRITICAL for redirect scenarios
    const cookieHeader = req.headers.get("cookie") ?? "";
    console.log("[Middleware] isSessionValid() - Cookie header length:", cookieHeader.length, "pathname:", req.nextUrl.pathname, "origin:", origin, "url:", url.toString());
    
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "manual",
      headers: {
        cookie: cookieHeader,
        // Preserve all relevant headers for proper origin detection
        host: host || url.host,
        "x-forwarded-host": req.headers.get("x-forwarded-host") || host || url.host,
        "x-forwarded-proto": proto,
        "x-real-ip": req.headers.get("x-real-ip") ?? "",
        "user-agent": req.headers.get("user-agent") ?? "",
        accept: req.headers.get("accept") ?? "application/json",
        "accept-language": req.headers.get("accept-language") ?? "en",
      },
    });
    
    console.log("[Middleware] isSessionValid() - Response status:", res.status, "for pathname:", req.nextUrl.pathname);
    
    if (!res.ok) {
      console.log("[Middleware] isSessionValid() - Response not OK, returning false");
      return false;
    }
    
    const data = await res.json().catch(() => null);
    const isValid = Boolean(data?.user);
    console.log("[Middleware] isSessionValid() - Session valid:", isValid, "for pathname:", req.nextUrl.pathname);
    return isValid;
  } catch (error) {
    console.error("[Middleware] isSessionValid() - Error:", error instanceof Error ? error.message : String(error), "for pathname:", req.nextUrl.pathname);
    // If fetch fails, we can't verify the session, so return false
    return false;
  }
}
