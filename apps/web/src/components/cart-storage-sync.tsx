import { useEffect } from "react";
import { initCartStorageSync, importCartFromUrl } from "@npanel/cart-store";

/**
 * Keeps the in-memory cart in sync with shared storage (dashboard ↔ landing page).
 * Also imports any cart items passed via the `_cart` URL param — used when the
 * landing page is on a different origin (e.g. Vercel preview) and can't share a cookie.
 */
export function CartStorageSync() {
  useEffect(() => {
    // URL-based handoff runs first so cookie/localStorage sync doesn't race it.
    importCartFromUrl();
    return initCartStorageSync();
  }, []);
  return null;
}
