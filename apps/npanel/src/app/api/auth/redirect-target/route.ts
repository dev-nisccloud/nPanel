import { NextResponse } from "next/server";
import { getRootRedirectTarget } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/redirect-target
 * Returns { redirect: string } for the root path so the client can show a loader
 * and then redirect, avoiding ERR_FAILED while middleware/API are compiling.
 */
export async function GET() {
  try {
    const redirect = await getRootRedirectTarget();
    return NextResponse.json({ redirect });
  } catch (err) {
    console.error("[redirect-target] Error:", err);
    return NextResponse.json({ redirect: "/auth/login" }, { status: 200 });
  }
}
