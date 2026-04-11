import { getRootRedirectTargetFromHeaders } from "@npanel/auth/root-redirect-target";

const FALLBACK_REDIRECT = "/auth/login";

/**
 * GET /auth/redirect-target (legacy path mirror)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedRedirect =
      url.searchParams.get("redirect") ?? url.searchParams.get("returnUrl");
    const target = await getRootRedirectTargetFromHeaders(
      request.headers,
      requestedRedirect,
    );
    const redirect =
      typeof target === "string" && target ? target : FALLBACK_REDIRECT;
    return Response.json({ redirect });
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      console.error("[redirect-target] Error (sending fallback redirect)");
    } else {
      console.error("[redirect-target] Error:", err);
    }
    return Response.json({ redirect: FALLBACK_REDIRECT }, { status: 200 });
  }
}
