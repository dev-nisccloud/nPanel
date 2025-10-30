import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight middleware for basic auth protection
 * Only checks for session cookie existence (fast, no DB calls)
 * Role-based redirects are handled by Server Components in layouts
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow root to resolve auth server-side (prevents ping-pong at entry)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // If user hits auth pages while already authenticated, send them to root (server decides)
  if (pathname.startsWith("/auth")) {
    const isLoggedIn = await isSessionValid(req);
    if (isLoggedIn && pathname !== "/") {
      return NextResponse.redirect(new URL("/", req.url), 302);
    }
    return NextResponse.next();
  }
  
  // Skip auth check for public routes
  const publicRoutes = ["/auth", "/api", "/_next", "/accept-invite", "/create-team", "/account-status", "/unauthorized", "/update-role"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip for agency routes (they have their own matcher)
  if (pathname.startsWith("/agency")) {
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

  // For all other routes (team slug routes), require authentication
  // This covers /{team-slug}/... routes
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
    const url = new URL("/api/auth/get-session", req.url);
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        cookie: req.headers.get("cookie") ?? "",
        host: req.headers.get("host") ?? url.host,
        "x-forwarded-host": req.headers.get("x-forwarded-host") ?? url.host,
        "x-forwarded-proto": (() => {
          const xfProto = req.headers.get("x-forwarded-proto") || "";
          return xfProto.includes("https") ? "https" : (xfProto.includes("http") ? "http" : "https");
        })(),
        "x-real-ip": req.headers.get("x-real-ip") ?? "",
        "user-agent": req.headers.get("user-agent") ?? "",
        accept: req.headers.get("accept") ?? "application/json",
        "accept-language": req.headers.get("accept-language") ?? "en",
      },
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return Boolean(data?.user);
  } catch {
    return false;
  }
}
