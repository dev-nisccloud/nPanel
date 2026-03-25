import { getRootRedirectTargetFromHeaders } from "@npanel/auth/root-redirect-target";

const FALLBACK_REDIRECT = "/auth/login";

/**
 * GET /api/auth/redirect-target
 * Returns { redirect: string } for the root path. Used by the client-only root page.
 * NEVER returns 5xx – always 200 with a redirect path so "/" can never 500 from this.
 */
export async function GET(request: Request) {
  try {
    const target = await getRootRedirectTargetFromHeaders(request.headers);
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
