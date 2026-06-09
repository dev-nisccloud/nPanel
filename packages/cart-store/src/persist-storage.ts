/** VAT and inc-VAT total with VAT always rounded up (never down). */
function ceilConvertedPrice(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.ceil(amount);
}

export function computeCeilVatTotals(
  subtotalExVat: number,
  vatRate = 0.16,
): { subtotalExVat: number; vatAmount: number; totalIncVat: number } {
  const subtotal = Number.isFinite(subtotalExVat) ? subtotalExVat : 0;
  const vatAmount = ceilConvertedPrice(subtotal * vatRate);
  return {
    subtotalExVat: subtotal,
    vatAmount,
    totalIncVat: subtotal + vatAmount,
  };
}

export const CART_STORAGE_KEY = "npanel-cart";

type PersistedCartItem = {
  id?: string;
  type?: string;
  domain?: string;
  bundleId?: string;
  addedAt?: number;
};

type PersistedCartPayload = {
  state?: { items?: PersistedCartItem[]; cartUpdatedAt?: number };
  version?: number;
};

function parsePersistedPayload(raw: string | null): PersistedCartPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedCartPayload;
  } catch {
    return null;
  }
}

function getCartTimestamp(parsed: PersistedCartPayload | null): number {
  if (!parsed?.state) return 0;
  if (parsed.state.cartUpdatedAt) return parsed.state.cartUpdatedAt;
  const items = parsed.state.items ?? [];
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.addedAt ?? 0));
}

function serializePayload(parsed: PersistedCartPayload): string {
  return JSON.stringify(parsed);
}

function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  if (host === "localhost" || host.endsWith(".local") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return undefined;
  }
  if (host === "nisccloud.com" || host.endsWith(".nisccloud.com")) {
    return ".nisccloud.com";
  }
  return undefined;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 30;
  let cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  const domain = getCookieDomain();
  if (domain) cookie += `; domain=${domain}`;
  try {
    document.cookie = cookie;
  } catch {
    // Cookie write can fail when payload exceeds browser limits.
  }
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  let cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  const domain = getCookieDomain();
  if (domain) cookie += `; domain=${domain}`;
  document.cookie = cookie;
}

function mergePersistedState(local: string | null, remote: string | null): string | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;

  const localParsed = parsePersistedPayload(local);
  const remoteParsed = parsePersistedPayload(remote);
  if (!localParsed || !remoteParsed) return local ?? remote;

  const localItems = localParsed.state?.items ?? [];
  const remoteItems = remoteParsed.state?.items ?? [];

  // Cookie is the cross-subdomain channel; an empty cart there clears other origins' caches.
  if (remoteItems.length === 0) {
    return serializePayload(remoteParsed);
  }
  if (localItems.length === 0) {
    return serializePayload(remoteParsed);
  }

  const localTs = getCartTimestamp(localParsed);
  const remoteTs = getCartTimestamp(remoteParsed);
  const winner = remoteTs >= localTs ? remoteParsed : localParsed;
  return serializePayload(winner);
}

/** localStorage + `.nisccloud.com` cookie so landing page and dashboard share the same cart. */
export const crossOriginCartStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    const local = window.localStorage.getItem(name);
    const cookie = readCookie(name);
    const merged = mergePersistedState(local, cookie);
    if (merged && merged !== local) {
      try {
        window.localStorage.setItem(name, merged);
      } catch {
        // ignore quota errors
      }
    }
    return merged;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, value);
    writeCookie(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
    removeCookie(name);
  },
};
