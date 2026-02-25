const FALLBACK_REDIRECT = "/auth/login";

/**
 * Fetch redirect target (dashboard or create-team) and navigate.
 * Retries once after delay if session not ready yet (e.g. right after login).
 */
export async function redirectToTarget(retryAfterMs = 0): Promise<void> {
  const doFetch = () =>
    fetch("/api/auth/redirect-target", { cache: "no-store", credentials: "include" })
      .then((res) => res.json() as Promise<{ redirect?: string }>)
      .then((data) => data.redirect || FALLBACK_REDIRECT);

  let target = await doFetch();
  if (target === FALLBACK_REDIRECT && retryAfterMs > 0) {
    await new Promise((r) => setTimeout(r, retryAfterMs));
    target = await doFetch();
  }
  window.location.replace(target);
}
