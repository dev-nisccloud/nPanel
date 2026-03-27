const FALLBACK_REDIRECT = "/auth/login";

// Only use VITE_SERVER_URL when it's a real HTTPS URL (production).
// In dev/ngrok VITE_SERVER_URL is http://localhost — the browser can't reach it
// cross-origin from ngrok HTTPS and it bypasses Vite's dev proxy. Keep the
// relative path so the proxy handles it transparently.
const _rawServerUrl = (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/+$/, "");
const REDIRECT_TARGET_URL = _rawServerUrl?.startsWith("https://")
  ? `${_rawServerUrl}/api/auth/redirect-target`
  : "/api/auth/redirect-target";

/**
 * Fetch redirect target (dashboard or create-team) and navigate.
 * Retries once after delay if session not ready yet (e.g. right after login).
 * Use a short delay (e.g. 200ms) to avoid blocking redirect when the first call returns login.
 */
export async function redirectToTarget(retryAfterMs = 0): Promise<void> {
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
  // But if the target is a dashboard or other non-auth page, proceed normally
  // (this is the post-login redirect case).
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/auth") &&
    target.startsWith("/auth")
  ) {
    return;
  }

  window.location.replace(target);
}
