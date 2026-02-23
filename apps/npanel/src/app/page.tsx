import { redirect } from "next/navigation";
import { getRootRedirectTarget } from "@/lib/auth-server";

/**
 * Root path "/" - redirect to login or dashboard on the server.
 * Uses redirect() in a Server Component (Next.js recommended approach).
 * No client fetch, so no second request and no ERR_FAILED from redirect-target API.
 */
export default async function RootPage() {
  let target: string;
  try {
    target = await getRootRedirectTarget();
  } catch {
    target = "/auth/login";
  }
  redirect(target);
}
