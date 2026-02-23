import { redirect } from "next/navigation";
import { getRootRedirectTarget } from "@/lib/auth-server";

/**
 * Root path "/" - redirect to login or dashboard on the server.
 */
export default async function RootPage() {
  let target: string;
  try {
    target = await getRootRedirectTarget();
  } catch (err) {
    // Log so Cloud Run / production logs show the real cause of failures
    console.error("[RootPage] getRootRedirectTarget failed:", err instanceof Error ? err.message : String(err), err instanceof Error ? err.stack : "");
    target = "/auth/login";
  }
  redirect(target);
}
