import { apiUrl } from "./auth-client";

const FALLBACK_REDIRECT = "/auth/login";

// Use the same server origin that authClient uses.
const REDIRECT_TARGET_URL = apiUrl("/api/auth/redirect-target");

if (typeof window !== "undefined") {
  console.debug("[auth-redirect] REDIRECT_TARGET_URL =", REDIRECT_TARGET_URL);
}

/** Post-login return path from the current page query (set by session gate on login/register). */
function redirectTargetRequestUrl(): string {
  if (typeof window === "undefined") return REDIRECT_TARGET_URL;
  const params = new URLSearchParams(window.location.search);
  const r = params.get("redirect") ?? params.get("returnUrl");
  if (!r?.trim()) return REDIRECT_TARGET_URL;
  const sep = REDIRECT_TARGET_URL.includes("?") ? "&" : "?";
  return `${REDIRECT_TARGET_URL}${sep}redirect=${encodeURIComponent(r.trim())}`;
}

/**
 * Fetch redirect target (dashboard or create-team) and navigate.
 * Returns `true` if a redirect was initiated, `false` otherwise (callers
 * should treat `false` as "stay on the current page").
 */
export async function redirectToTarget(retryAfterMs = 0): Promise<boolean> {
  const doFetch = async (): Promise<string> => {
    const fetchUrl = redirectTargetRequestUrl();
    const res = await fetch(fetchUrl, {
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
        url: fetchUrl,
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
  // an auth page (e.g. fallback to /auth/login), don't redirect   it would loop.
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
