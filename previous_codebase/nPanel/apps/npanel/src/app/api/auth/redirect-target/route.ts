import { NextResponse } from "next/server";
import { getRootRedirectTarget } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const FALLBACK_REDIRECT = "/auth/login";

/**
 * GET /api/auth/redirect-target
 * Returns { redirect: string } for the root path. Used by the client-only root page.
 * NEVER returns 5xx – always 200 with a redirect path so "/" can never 500 from this.
 */
export async function GET() {
  try {
    const target = await getRootRedirectTarget();
    const redirect =
      typeof target === "string" && target ? target : FALLBACK_REDIRECT;
    return NextResponse.json({ redirect });
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      console.error("[redirect-target] Error (sending fallback redirect)");
    } else {
      console.error("[redirect-target] Error:", err);
    }
    return NextResponse.json({ redirect: FALLBACK_REDIRECT }, { status: 200 });
  }
}
