import { NextResponse } from "next/server";
import { getRootRedirectTarget } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const FALLBACK_REDIRECT = "/auth/login";

/**
 * GET /api/auth/redirect-target
 * Returns { redirect: string } for the root path so the client can show a loader
 * and then redirect. Never returns 5xx so production load balancers and health
 * checks are not triggered by auth/DB issues.
 */
export async function GET() {
  try {
    const redirect = await getRootRedirectTarget();
    return NextResponse.json({ redirect: redirect ?? FALLBACK_REDIRECT });
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      // Log without leaking details; stdout is captured by Cloud Run / Render
      console.error("[redirect-target] Error (sending fallback redirect)");
    } else {
      console.error("[redirect-target] Error:", err);
    }
    return NextResponse.json({ redirect: FALLBACK_REDIRECT }, { status: 200 });
  }
}
