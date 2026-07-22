import { apiUrl } from "./auth-client";

const FALLBACK_REDIRECT = "/auth/login";
const MFA_VERIFY_PATH = "/auth/mfa";
const REAUTH_PATH = "/auth/reauth";

/** Survives refresh / OAuth round-trips when `?redirect=` is dropped from the URL. */
export const PENDING_AUTH_REDIRECT_KEY = "npanel_pending_auth_redirect";

// Use the same server origin that authClient uses.
const REDIRECT_TARGET_URL = apiUrl("/api/auth/redirect-target");

if (typeof window !== "undefined") {
  console.debug("[auth-redirect] REDIRECT_TARGET_URL =", REDIRECT_TARGET_URL);
}

function readSessionStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(key);
    return value?.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

function writeSessionStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private mode / quota — URL query remains the primary signal.
  }
}

function removeSessionStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Persist intended post-auth destination (internal path or landing cart URL). */
export function persistPendingAuthRedirect(redirect: string | null | undefined): void {
  const value = redirect?.trim();
  if (!value) return;
  // Don't stash auth pages as the destination.
  if (value.startsWith("/auth")) return;
  writeSessionStorage(PENDING_AUTH_REDIRECT_KEY, value);
}

export function peekPendingAuthRedirect(): string | null {
  return readSessionStorage(PENDING_AUTH_REDIRECT_KEY);
}

/** Read and clear the persisted redirect after a successful handoff. */
export function consumePendingAuthRedirect(): string | null {
  const value = peekPendingAuthRedirect();
  if (value) removeSessionStorage(PENDING_AUTH_REDIRECT_KEY);
  return value;
}

export function clearPendingAuthRedirect(): void {
  removeSessionStorage(PENDING_AUTH_REDIRECT_KEY);
}

/**
 * Post-login return path from page query (login/register), including invite code when present.
 * Falls back to sessionStorage so refresh / OAuth / MFA navigations do not lose the destination.
 */
export function getRequestedRedirectFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const raw = params.get("redirect") ?? params.get("returnUrl");
  let path = raw?.trim() || "";

  if (path) {
    const code = params.get("code");
    if (code && (path === "/accept-invite" || path.startsWith("/accept-invite/"))) {
      const sep = path.includes("?") ? "&" : "?";
      path = `${path}${sep}code=${encodeURIComponent(code)}`;
    }
    persistPendingAuthRedirect(path);
    return path;
  }

  return peekPendingAuthRedirect();
}

/** Build login/register/MFA links that keep `?redirect=` when present. */
export function authPathWithRedirect(
  path: string,
  redirect: string | null | undefined = peekPendingAuthRedirect(),
): string {
  const base = path.split("?")[0] || path;
  const value = redirect?.trim();
  if (!value || value.startsWith("/auth")) return base;
  const params = new URLSearchParams({ redirect: value });
  return `${base}?${params.toString()}`;
}

/** Post-login return path from the current page query (set by session gate on login/register). */
function redirectTargetRequestUrl(): string {
  if (typeof window === "undefined") return REDIRECT_TARGET_URL;
  const redirectPath = getRequestedRedirectFromSearch(window.location.search);
  if (!redirectPath) return REDIRECT_TARGET_URL;
  const sep = REDIRECT_TARGET_URL.includes("?") ? "&" : "?";
  return `${REDIRECT_TARGET_URL}${sep}redirect=${encodeURIComponent(redirectPath)}`;
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

/** True when redirect-target indicates password re-auth is required. */
export function isReauthRedirectTarget(target: string): boolean {
  try {
    const pathname = new URL(target, "http://local").pathname;
    return pathname === REAUTH_PATH || pathname.startsWith(`${REAUTH_PATH}/`);
  } catch {
    return target.startsWith(REAUTH_PATH);
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

  // Destination accepted — drop the backup so a later login doesn't reuse it.
  if (target !== FALLBACK_REDIRECT && !isMfaRedirectTarget(target) && !isReauthRedirectTarget(target)) {
    clearPendingAuthRedirect();
  }

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

/** Prefer the original post-auth destination over the current auth page URL. */
function resolveReturnRedirect(returnPath?: string): string | null {
  if (returnPath?.trim()) {
    const value = returnPath.trim();
    if (!value.startsWith("/auth")) return value;
  }
  if (typeof window === "undefined") return null;
  return getRequestedRedirectFromSearch(window.location.search);
}

export function redirectToReauth(returnPath?: string): void {
  if (typeof window === "undefined") return;
  const destination = resolveReturnRedirect(returnPath);
  if (destination) persistPendingAuthRedirect(destination);
  const params = new URLSearchParams();
  if (destination) params.set("redirect", destination);
  const q = params.toString();
  window.location.replace(q ? `${REAUTH_PATH}?${q}` : REAUTH_PATH);
}

export function redirectToMfa(returnPath?: string): void {
  if (typeof window === "undefined") return;
  const destination = resolveReturnRedirect(returnPath);
  if (destination) persistPendingAuthRedirect(destination);
  const params = new URLSearchParams();
  if (destination) params.set("redirect", destination);
  const q = params.toString();
  window.location.replace(q ? `${MFA_VERIFY_PATH}?${q}` : MFA_VERIFY_PATH);
}
