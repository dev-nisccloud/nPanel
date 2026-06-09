import type { CartItem } from "./cart-store";
import { useCartStore } from "./cart-store";

/** URL search-param name used to hand off cart items across origins. */
export const CART_URL_PARAM = "_cart";

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
 * Build the destination URL with the cart items encoded as a query param.
 * @param baseUrl  The dashboard URL (e.g. "https://npanel.nisccloud.com")
 * @param items    Cart items to attach
 */
export function buildCartHandoffUrl(baseUrl: string, items: CartItem[]): string {
  if (items.length === 0) return baseUrl;
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

/**
 * Read the `_cart` URL param, merge any items into the Zustand store, then
 * remove the param from the URL bar.  Call once on dashboard mount.
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

  const incoming = parseCartFromUrlParam(raw);
  if (!incoming || incoming.length === 0) return false;

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
