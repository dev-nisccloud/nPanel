import { redirect, type DataStrategyResult, type LoaderFunctionArgs } from "react-router";

import { authClient } from "@/lib/auth-client";
import { isPublicPath, loginRedirectUrl, normalizePathname } from "@/lib/session-gate";

async function hasSession(): Promise<boolean> {
  try {
    // Add a strict timeout to ensure we don't hang hydration
    const res = await Promise.race([
      authClient.getSession(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
    ]);
    
    if (!res || res.error) return false;
    return Boolean(res.data?.user);
  } catch (err) {
    console.warn("[sessionGateClientMiddleware] hasSession catch:", err);
    return false;
  }
}

/**
 * Client middleware  runs on navigations (and on hydration when root `clientLoader.hydrate` is true).
 * Public routes pass through; others require a session.
 */
export async function sessionGateClientMiddleware(
  { request }: LoaderFunctionArgs,
  next: () => Promise<Record<string, DataStrategyResult>>,
): Promise<void | Record<string, DataStrategyResult>> {
  const url = new URL(request.url);
  const pathname = normalizePathname(url.pathname);

  if (isPublicPath(pathname)) {
    return next();
  }

  let loggedIn = false;
  try {
    loggedIn = await hasSession();
  } catch (err) {
    console.error(
      "[sessionGateClientMiddleware] getSession failed (allowing navigation):",
      err instanceof Error ? err.message : String(err),
    );
    return next();
  }

  if (loggedIn) {
    return next();
  }

  throw redirect(loginRedirectUrl(pathname));
}
