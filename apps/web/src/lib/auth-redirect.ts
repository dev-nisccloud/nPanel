const FALLBACK_REDIRECT = "/auth/login";

/**
 * Fetch redirect target (dashboard or create-team) and navigate.
 * Retries once after delay if session not ready yet (e.g. right after login).
 * Use a short delay (e.g. 200ms) to avoid blocking redirect when the first call returns login.
 */
export async function redirectToTarget(retryAfterMs = 0): Promise<void> {
  const doFetch = async (): Promise<string> => {
    const res = await fetch("/api/auth/redirect-target", {
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
  window.location.replace(target);
}
