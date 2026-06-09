import type { CartItem } from "./cart-store";
import { useCartStore } from "./cart-store";
import { CART_STORAGE_KEY, crossOriginCartStorage } from "./persist-storage";

type PersistedCartPayload = {
  state?: { items?: CartItem[]; cartUpdatedAt?: number };
  version?: number;
};

function parsePersistedRaw(raw: string | null): PersistedCartPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedCartPayload;
  } catch {
    return null;
  }
}

/** Read merged cart snapshot (localStorage + `.nisccloud.com` cookie). */
export function readMergedPersistedCart(): PersistedCartPayload | null {
  return parsePersistedRaw(crossOriginCartStorage.getItem(CART_STORAGE_KEY));
}

function itemIds(items: CartItem[]): string {
  return items.map((item) => item.id).join("|");
}

/**
 * Pull cart changes from shared storage (cookie/localStorage) into the in-memory store.
 * Used so clearing the cart on the dashboard reflects on the landing page (and vice versa).
 */
export function syncCartFromSharedStorage(): void {
  const persisted = readMergedPersistedCart();
  const externalItems = (persisted?.state?.items ?? []) as CartItem[];
  const externalTs = persisted?.state?.cartUpdatedAt ?? 0;

  const { items, cartUpdatedAt } = useCartStore.getState();
  const currentTs = cartUpdatedAt ?? 0;

  const externalIds = itemIds(externalItems);
  const currentIds = itemIds(items);
  const itemsChanged = externalIds !== currentIds;

  if (externalTs > currentTs || (itemsChanged && externalTs >= currentTs)) {
    useCartStore.setState({
      items: externalItems,
      cartUpdatedAt: externalTs || Date.now(),
    });
    return;
  }

  // Cookie may carry an explicit empty cart (clear) without a newer timestamp yet.
  if (externalItems.length === 0 && items.length > 0 && persisted != null) {
    useCartStore.setState({
      items: [],
      cartUpdatedAt: Date.now(),
    });
  }
}

/** Subscribe to cross-tab / cross-subdomain cart updates (storage, focus, polling). */
export function initCartStorageSync(options?: { pollMs?: number }): () => void {
  if (typeof window === "undefined") return () => {};

  const pollMs = options?.pollMs ?? 2000;

  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) syncCartFromSharedStorage();
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") syncCartFromSharedStorage();
  };

  syncCartFromSharedStorage();
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", syncCartFromSharedStorage);
  document.addEventListener("visibilitychange", onVisible);

  const intervalId = window.setInterval(syncCartFromSharedStorage, pollMs);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", syncCartFromSharedStorage);
    document.removeEventListener("visibilitychange", onVisible);
    window.clearInterval(intervalId);
  };
}
