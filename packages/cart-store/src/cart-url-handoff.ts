import type { CartItem } from "./cart-store";
import { useCartStore } from "./cart-store";

/** URL search-param name used to hand off cart items across origins. */
export const CART_URL_PARAM = "_cart";

/**
 * sessionStorage key where the inline pre-React script saves the raw `_cart`
 * param so it survives a login redirect within the same tab.
 */
export const CART_SESSION_KEY = "_npanel_pending_cart";

/**
 * Inline script source that must be injected into <head> **before** any
 * framework code runs.  It rescues the `_cart` URL param into sessionStorage
 * so it survives the session-gate login redirect.
 */
export const CART_RESCUE_SCRIPT = `(function(){try{var p=new URLSearchParams(window.location.search);var c=p.get('${CART_URL_PARAM}');if(c)sessionStorage.setItem('${CART_SESSION_KEY}',c);}catch(e){}})();`;

/**
 * Encode cart items into a URL-safe base64 string.
 * Used by the landing page when navigating the user to the dashboard.
 */
export function serializeCartToUrlParam(items: CartItem[]): string {
  if (items.length === 0) return "";
  try {
    return btoa(encodeURIComponent(JSON.stringify(items)));
  } catch {
    return "";
  }
}

/**
 * Returns true when the current page and the target URL share a cookie domain,
 * meaning the Zustand persist cookie already syncs the cart — no URL param needed.
 *
 * Covers:
 *  - same hostname (localhost → localhost, 192.168.x.x → 192.168.x.x)
 *  - same eTLD+1 (www.nisccloud.com → npanel.nisccloud.com → root "nisccloud.com")
 *
 * Excludes vercel.app (Public Suffix) so two different *.vercel.app projects
 * are never treated as sharing a cookie domain.
 */
function sharesCookieDomain(baseUrl: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const targetHost = new URL(baseUrl).hostname;
    const currentHost = window.location.hostname;
    if (targetHost === currentHost) return true;
    // IP addresses — only same-IP counts
    if (/^\d+\.\d+\.\d+\.\d+$/.test(targetHost)) return false;
    const getRoot = (h: string) => h.split(".").slice(-2).join(".");
    const targetRoot = getRoot(targetHost);
    // Reject shared public suffixes (vercel.app, github.io, netlify.app, …)
    const publicSuffixes = ["vercel.app", "github.io", "netlify.app", "pages.dev"];
    if (publicSuffixes.includes(targetRoot)) return false;
    return targetRoot === getRoot(currentHost);
  } catch {
    return false;
  }
}

/**
 * Build the destination URL, appending cart items as a `_cart` query param
 * **only** when the landing page and dashboard are on different cookie domains
 * (e.g. Vercel preview → production dashboard).
 *
 * On same-domain deployments (production, local dev) the shared cookie already
 * syncs the cart — skipping serialization keeps navigation instant.
 *
 * @param baseUrl  The dashboard URL (e.g. "https://npanel.nisccloud.com")
 * @param items    Cart items to attach
 */
export function buildCartHandoffUrl(baseUrl: string, items: CartItem[]): string {
  if (items.length === 0) return baseUrl;
  // Same cookie domain → cart syncs via shared storage, no URL bloat needed.
  if (sharesCookieDomain(baseUrl)) return baseUrl;
  const encoded = serializeCartToUrlParam(items);
  if (!encoded) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}${CART_URL_PARAM}=${encoded}`;
}

/**
 * Decode a URL param string back to cart items.
 * Returns null on any parse failure so callers can ignore safely.
 */
export function parseCartFromUrlParam(param: string): CartItem[] | null {
  if (!param) return null;
  try {
    const decoded = decodeURIComponent(atob(param));
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : null;
  } catch {
    return null;
  }
}

function mergeIncomingItems(incoming: CartItem[]): boolean {
  const currentItems = useCartStore.getState().items;
  const existingIds = new Set(currentItems.map((i) => i.id));
  const newItems = incoming.filter((item) => !existingIds.has(item.id));
  if (newItems.length === 0) return false;
  useCartStore.setState({
    items: [...currentItems, ...newItems],
    cartUpdatedAt: Date.now(),
  });
  return true;
}

/**
 * Read the `_cart` URL param, merge any items into the Zustand store, then
 * remove the param from the URL bar.  Call once on dashboard mount.
 *
 * Also clears the sessionStorage rescue key so it isn't imported twice.
 *
 * @returns true if at least one new item was merged.
 */
export function importCartFromUrl(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const raw = params.get(CART_URL_PARAM);
  if (!raw) return false;

  // Strip the param immediately — regardless of whether the payload is valid.
  params.delete(CART_URL_PARAM);
  const cleanUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState({}, "", cleanUrl);

  // Discard the sessionStorage rescue copy — URL import takes priority.
  try { sessionStorage.removeItem(CART_SESSION_KEY); } catch { /* ignore */ }

  const incoming = parseCartFromUrlParam(raw);
  if (!incoming || incoming.length === 0) return false;

  return mergeIncomingItems(incoming);
}

/**
 * Read the rescued `_cart` payload from sessionStorage (written by the inline
 * head script before React mounts).  Used after a login redirect when the
 * `_cart` URL param is no longer present.
 *
 * @returns true if at least one new item was merged.
 */
export function importCartFromSessionStorage(): boolean {
  if (typeof window === "undefined") return false;

  let raw: string | null = null;
  try { raw = sessionStorage.getItem(CART_SESSION_KEY); } catch { /* ignore */ }
  if (!raw) return false;

  // Clear immediately — only import once.
  try { sessionStorage.removeItem(CART_SESSION_KEY); } catch { /* ignore */ }

  const incoming = parseCartFromUrlParam(raw);
  if (!incoming || incoming.length === 0) return false;

  return mergeIncomingItems(incoming);
}
