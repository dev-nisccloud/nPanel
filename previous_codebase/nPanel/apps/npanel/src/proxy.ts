import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy: request boundary for auth checks and pathname forwarding.
 * Only checks for session cookie existence (fast, no DB calls).
 * Role-based redirects are handled by Server Components in layouts.
 */
export async function proxy(req: NextRequest) {
  try {
    return await runProxy(req);
  } catch (err) {
    console.error("[Proxy] Error (continuing with request):", err instanceof Error ? err.message : String(err));
    return NextResponse.next();
  }
}

async function runProxy(req: NextRequest): Promise<NextResponse> {
  const rawPath = req.nextUrl?.pathname ?? "";
  const pathname = typeof rawPath === "string" ? rawPath.trim() : "";
  const normalizedPath = pathname.replace(/\/+/g, "/");
  const pathForHeader = normalizedPath === "" || normalizedPath === "/" ? "/" : normalizedPath;

  // Always forward pathname so root layout can choose minimal shell vs full layout (QueryProvider).
  const nextRes = (response: NextResponse) => {
    try {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-pathname", pathForHeader);
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return response;
    }
  };

  if (pathname.startsWith("/agency")) {
    const isLoggedIn = await isSessionValid(req);
    if (!isLoggedIn) {
      const redirectRes = safeRedirectToLogin(req, pathname);
      if (redirectRes) return redirectRes;
      return nextRes(NextResponse.next());
    }
    return nextRes(NextResponse.next());
  }

  const isRoot = normalizedPath === "" || normalizedPath === "/";
  if (isRoot) {
    return nextRes(NextResponse.next());
  }

  if (pathname.startsWith("/auth")) {
    return nextRes(NextResponse.next());
  }

  const publicRoutes = ["/auth", "/api", "/_next", "/accept-invite", "/create-team", "/account-status", "/unauthorized", "/update-role"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return nextRes(NextResponse.next());
  }

  const isLoggedIn = await isSessionValid(req);
  if (!isLoggedIn) {
    const redirectRes = safeRedirectToLogin(req, pathname);
    if (redirectRes) return redirectRes;
    return nextRes(NextResponse.next());
  }

  return nextRes(NextResponse.next());
}

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

async function isSessionValid(req: NextRequest): Promise<boolean> {
  try {
    const sessionCookie = req.cookies.get("better-auth.session_token") ??
      req.cookies.get("__Secure-better-auth.session_token");
    return !!sessionCookie?.value;
  } catch {
    return false;
  }
}
