import { serverBaseURL } from "./auth-client";

const FALLBACK_REDIRECT = "/auth/login";

// Use the same server origin that authClient uses. In production it's the
// HTTPS Cloud Run server URL; in dev it's undefined so we fall back to a
// relative path (handled by Vite's dev proxy).
const REDIRECT_TARGET_URL = serverBaseURL
  ? `${serverBaseURL.replace(/\/+$/, "")}/api/auth/redirect-target`
  : "/api/auth/redirect-target";

if (typeof window !== "undefined") {
  console.debug("[auth-redirect] REDIRECT_TARGET_URL =", REDIRECT_TARGET_URL, "serverBaseURL =", serverBaseURL);
}

/**
 * Fetch redirect target (dashboard or create-team) and navigate.
 * Returns `true` if a redirect was initiated, `false` otherwise (callers
 * should treat `false` as "stay on the current page").
 */
export async function redirectToTarget(retryAfterMs = 0): Promise<boolean> {
  const doFetch = async (): Promise<string> => {
    const res = await fetch(REDIRECT_TARGET_URL, {
      cache: "no-store",
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[auth-redirect] redirect-target failed", {
        status: res.status,
        contentType,
        bodyPreview: text.slice(0, 200),
      });
      return FALLBACK_REDIRECT;
    }

    if (!contentType.includes("application/json")) {
      const text = await res.text().catch(() => "");
      console.error("[auth-redirect] redirect-target returned non-JSON", {
        contentType,
        bodyPreview: text.slice(0, 200),
        url: REDIRECT_TARGET_URL,
      });
      return FALLBACK_REDIRECT;
    }

    try {
      const data = (await res.json()) as { redirect?: string };
      return data.redirect || FALLBACK_REDIRECT;
    } catch (e) {
      console.error("[auth-redirect] redirect-target JSON parse failed", e);
      return FALLBACK_REDIRECT;
    }
  };

  let target = await doFetch();
  if (target === FALLBACK_REDIRECT && retryAfterMs > 0) {
    await new Promise((r) => setTimeout(r, retryAfterMs));
    target = await doFetch();
  }

  // Loop guard: if we're already on an auth page and the resolved target is also
  // an auth page (e.g. fallback to /auth/login), don't redirect — it would loop.
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/auth") &&
    target.startsWith("/auth")
  ) {
    return false;
  }

  window.location.replace(target);
  return true;
}
