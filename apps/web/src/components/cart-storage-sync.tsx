import { useEffect } from "react";
import { initCartStorageSync, importCartFromUrl, importCartFromSessionStorage } from "@npanel/cart-store";

/**
 * Keeps the in-memory cart in sync with shared storage (dashboard ↔ landing page).
 *
 * Import priority on mount:
 *  1. `_cart` URL param  present when user navigates directly from landing page
 *     while already logged in (or when no auth gate fires).
 *  2. sessionStorage rescue key  written by the inline <head> script before
 *     React/middleware runs.  Survives the login redirect so items are available
 *     after the user authenticates.
 *  3. Cookie / localStorage sync  keeps cart in sync across tabs and subdomains.
 */
export function CartStorageSync() {
  useEffect(() => {
    // Try URL param first (user was already logged in when they arrived).
    const importedFromUrl = importCartFromUrl();
    // Fall back to sessionStorage rescue (user had to log in first).
    if (!importedFromUrl) importCartFromSessionStorage();
    return initCartStorageSync();
  }, []);
  return null;
}
