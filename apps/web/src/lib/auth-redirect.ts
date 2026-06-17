import { apiUrl } from "./auth-client";

const FALLBACK_REDIRECT = "/auth/login";
const MFA_VERIFY_PATH = "/auth/mfa";

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

async function fetchRedirectTargetOnce(): Promise<string> {
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
}

/** Resolve post-auth destination without navigating. */
export async function fetchRedirectTarget(retryAfterMs = 0): Promise<string> {
  let target = await fetchRedirectTargetOnce();
  if (target === FALLBACK_REDIRECT && retryAfterMs > 0) {
    await new Promise((r) => setTimeout(r, retryAfterMs));
    target = await fetchRedirectTargetOnce();
  }
  return target;
}

/** True when redirect-target indicates MFA verification is required before continuing. */
export function isMfaRedirectTarget(target: string): boolean {
  try {
    const pathname = new URL(target, "http://local").pathname;
    return pathname === MFA_VERIFY_PATH || pathname.startsWith(`${MFA_VERIFY_PATH}/`);
  } catch {
    return target.startsWith(MFA_VERIFY_PATH);
  }
}

function shouldStayOnCurrentPage(target: string): boolean {
  if (typeof window === "undefined") return false;
  const current = window.location.pathname;
  if (target === current) return true;
  if (current.startsWith("/auth") && target === FALLBACK_REDIRECT) return true;
  return false;
}

type NavigateFn = (to: string, options?: { replace?: boolean }) => void;

/**
 * Navigate to the post-auth destination. Prefer client-side navigation when a
 * router `navigate` function is provided (faster than a full document load).
 */
export function goToRedirectTarget(
  target: string,
  navigate?: NavigateFn,
): boolean {
  if (shouldStayOnCurrentPage(target)) return false;

  if (navigate && target.startsWith("/")) {
    navigate(target, { replace: true });
    return true;
  }

  window.location.replace(target);
  return true;
}

/**
 * Fetch redirect target (dashboard or create-team) and navigate.
 * Returns `true` if a redirect was initiated, `false` otherwise (callers
 * should treat `false` as "stay on the current page").
 */
export async function redirectToTarget(
  retryAfterMs = 0,
  navigate?: NavigateFn,
): Promise<boolean> {
  const target = await fetchRedirectTarget(retryAfterMs);
  return goToRedirectTarget(target, navigate);
}
