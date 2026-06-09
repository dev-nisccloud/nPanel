import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  bundleDomainKey,
  createBundleId,
  getDomainBundleCartLineCurrency,
  getDomainBundleCartLinePrice,
  type DomainBundleCartDomain,
} from "./domain-bundle-cart";
import { CART_STORAGE_KEY, computeCeilVatTotals, crossOriginCartStorage } from "./persist-storage";

interface BaseCartItem {
  id: string;
  type: string;
  addedAt: number;
}

export interface DomainCartItem extends BaseCartItem {
  type: "domain";
  domain: string;
  status?: string;
  price?: {
    product?: {
      price?: number;
      currency?: string;
    };
    reseller?: {
      price?: number;
      currency?: string;
    };
    calculated?: {
      originalPrice?: number;
      marginAmount?: number;
      finalPrice?: number;
      currency?: string;
      marginType?: string | null;
      marginValue?: string | null;
      convertedPrice?: number;
      exchangeRate?: number;
      displayCurrency?: string;
    };
  };
  addedInCurrency?: string;
}

export interface DomainBundleCartItem extends BaseCartItem {
  type: "domain_bundle";
  bundleId: string;
  bundleLabel: string;
  bundlePrice: number;
  bundleCurrency: string;
  domains: DomainBundleCartDomain[];
  addedInCurrency?: string;
}

export interface HostingCartItem extends BaseCartItem {
  type: "hosting";
  plan: string;
  price?: number;
  currency?: string;
}

export interface ServiceCartItem extends BaseCartItem {
  type: "service";
  name: string;
  price?: number;
  currency?: string;
}

export interface HivelocityCartItem extends BaseCartItem {
  type: "hivelocity";
  productType: string;
  niscProductId?: string;
  planName: string;
  planType?: string;
  billingCycle?: string;
  hivelocityPeriod: string;
  currency: string;
  basePrice: number;
  hostname: string;
  locationName?: string;
  locationDisplayName?: string;
  hivelocityProductId: number;
  os: {
    id: string;
    name: string;
    price: number;
    priceUsd?: number;
  } | null;
  addons: Array<{
    id: string;
    name: string;
    price: number;
    group?: string;
    priceUsd?: number;
  }>;
  invoiceLines: Array<{
    id: string;
    kind: "base" | "os" | "addon";
    name: string;
    description?: string;
    amountExVat: number;
    optionId?: number;
  }>;
  subtotalExVat: number;
  vatAmount: number;
  totalPrice: number;
  selectedOptionIds: number[];
  basePriceUsdMonthly?: number;
  osPriceUsdMonthly?: number;
  addonsPriceUsdMonthly?: number;
}

export type CartItem =
  | DomainCartItem
  | DomainBundleCartItem
  | HostingCartItem
  | ServiceCartItem
  | HivelocityCartItem;

function domainInBundleItem(item: DomainBundleCartItem, domainName: string): boolean {
  const n = domainName.toLowerCase();
  return item.domains.some((d) => d.domain.toLowerCase() === n);
}

function filterConflictingBundleItems(
  items: CartItem[],
  domainNames: Set<string>,
): CartItem[] {
  return items.filter((item) => {
    if (item.type === "domain" && domainNames.has(item.domain.toLowerCase())) {
      return false;
    }
    if (item.type === "domain_bundle") {
      const overlap = item.domains.some((d) => domainNames.has(d.domain.toLowerCase()));
      return !overlap;
    }
    return true;
  });
}

interface CartStore {
  items: CartItem[];
  cartUpdatedAt: number;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getItemById: (id: string) => CartItem | undefined;
  addDomain: (domainData: Omit<DomainCartItem, "id" | "type" | "addedAt">) => void;
  addDomainBundle: (data: Omit<DomainBundleCartItem, "id" | "type" | "addedAt">) => void;
  removeDomain: (domainId: string) => void;
  removeDomainByName: (domainName: string) => void;
  removeDomainBundleById: (bundleItemId: string) => void;
  removeDomainBundleByDomains: (domainNames: string[]) => void;
  getDomains: () => DomainCartItem[];
  getDomainBundles: () => DomainBundleCartItem[];
  isDomainInCart: (domainName: string) => boolean;
  isDomainBundleInCart: (domainNames: string[]) => boolean;
  getDomainFromCart: (domainName: string) => DomainCartItem | undefined;
  addHivelocity: (data: Omit<HivelocityCartItem, "id" | "type" | "addedAt">) => void;
  removeHivelocityAddon: (itemId: string, addonId: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemCountByType: (type: string) => number;
  getTotalsByCurrency: () => Record<string, number>;
  getCurrenciesInCart: () => string[];
  getTotalForCurrency: (currency: string) => number;
}

function touchCart(items: CartItem[]): Pick<CartStore, "items" | "cartUpdatedAt"> {
  return { items, cartUpdatedAt: Date.now() };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartUpdatedAt: 0,

      removeItem: (id) => {
        set((state) => touchCart(state.items.filter((item) => item.id !== id)));
      },

      clearCart: () => set(touchCart([])),

      getItemById: (id) => get().items.find((item) => item.id === id),

      addDomain: (domainData) => {
        if (get().isDomainInCart(domainData.domain)) return;

        const domainItem: DomainCartItem = {
          ...domainData,
          type: "domain",
          id: `domain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: Date.now(),
        };

        set((state) => touchCart([...state.items, domainItem]));
      },

      addDomainBundle: (data) => {
        const domainNames = new Set(data.domains.map((d) => d.domain.toLowerCase()).filter(Boolean));
        if (domainNames.size === 0) return;

        const bundleItem: DomainBundleCartItem = {
          ...data,
          bundleId: data.bundleId || createBundleId(),
          type: "domain_bundle",
          id: `domain-bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: Date.now(),
        };

        set((state) =>
          touchCart([...filterConflictingBundleItems(state.items, domainNames), bundleItem]),
        );
      },

      addHivelocity: (data) => {
        const item: HivelocityCartItem = {
          ...data,
          type: "hivelocity",
          id: `hivelocity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: Date.now(),
        };
        set((state) => touchCart([...state.items, item]));
      },

      removeHivelocityAddon: (itemId, addonId) => {
        set((state) =>
          touchCart(
            state.items.map((it) => {
            if (it.id !== itemId) return it;
            if (it.type !== "hivelocity") return it;
            const hv = it as HivelocityCartItem;
            const nextAddons = hv.addons.filter((a) => a.id !== addonId);
            const nextInvoiceLines = hv.invoiceLines.filter((l) => l.id !== `addon-${addonId}`);
            const subtotalExVat = nextInvoiceLines.reduce((s, l) => s + l.amountExVat, 0);
            const { vatAmount } = computeCeilVatTotals(subtotalExVat);
            return {
              ...hv,
              addons: nextAddons,
              invoiceLines: nextInvoiceLines,
              subtotalExVat,
              vatAmount,
              totalPrice: subtotalExVat,
              selectedOptionIds: nextAddons
                .map((a) => Number(a.id))
                .filter((n) => Number.isFinite(n)),
            };
          }),
          ),
        );
      },

      removeDomain: (domainId) => {
        set((state) =>
          touchCart(state.items.filter((item) => !(item.type === "domain" && item.id === domainId))),
        );
      },

      removeDomainByName: (domainName) => {
        const n = domainName.toLowerCase();
        set((state) =>
          touchCart(
            state.items.filter((item) => {
              if (item.type === "domain") return item.domain.toLowerCase() !== n;
              if (item.type === "domain_bundle") return !domainInBundleItem(item, domainName);
              return true;
            }),
          ),
        );
      },

      removeDomainBundleById: (bundleItemId) => {
        set((state) => touchCart(state.items.filter((item) => item.id !== bundleItemId)));
      },

      removeDomainBundleByDomains: (domainNames) => {
        const key = bundleDomainKey(domainNames);
        set((state) =>
          touchCart(
            state.items.filter(
              (item) =>
                !(
                  item.type === "domain_bundle" &&
                  bundleDomainKey(item.domains.map((d) => d.domain)) === key
                ),
            ),
          ),
        );
      },

      getDomains: () => get().items.filter((item): item is DomainCartItem => item.type === "domain"),

      getDomainBundles: () =>
        get().items.filter((item): item is DomainBundleCartItem => item.type === "domain_bundle"),

      isDomainInCart: (domainName) => {
        const n = domainName.toLowerCase();
        return get().items.some((item) => {
          if (item.type === "domain") return item.domain.toLowerCase() === n;
          if (item.type === "domain_bundle") return domainInBundleItem(item, domainName);
          return false;
        });
      },

      isDomainBundleInCart: (domainNames) => {
        const key = bundleDomainKey(domainNames);
        return get().items.some(
          (item) =>
            item.type === "domain_bundle" &&
            bundleDomainKey(item.domains.map((d) => d.domain)) === key,
        );
      },

      getDomainFromCart: (domainName) =>
        get().items.find(
          (item) => item.type === "domain" && item.domain === domainName,
        ) as DomainCartItem | undefined,

      getTotal: () =>
        get().items.reduce((sum, item) => {
          if (item.type === "domain" && item.price) {
            const price = item.price.reseller?.price || item.price.product?.price || 0;
            return sum + price;
          }
          if (item.type === "domain_bundle") {
            return sum + getDomainBundleCartLinePrice(item);
          }
          if (item.type === "hivelocity") {
            const hv = item as HivelocityCartItem;
            const subtotal = Number(hv.subtotalExVat ?? hv.totalPrice ?? 0) || 0;
            return sum + subtotal;
          }
          return sum;
        }, 0),

      getItemCount: () => get().items.length,

      getItemCountByType: (type) => get().items.filter((item) => item.type === type).length,

      getTotalsByCurrency: () => {
        const totals: Record<string, number> = {};

        get().items.forEach((item) => {
          if (item.type === "domain" && item.price) {
            let currency: string;
            let price: number;

            if (item.addedInCurrency && item.price.calculated?.convertedPrice) {
              currency = item.addedInCurrency;
              price = item.price.calculated.convertedPrice;
            } else if (item.price.calculated?.finalPrice) {
              currency = item.price.calculated.currency || "USD";
              price = item.price.calculated.finalPrice;
            } else {
              currency = item.price.reseller?.currency || item.price.product?.currency || "USD";
              price = item.price.reseller?.price || item.price.product?.price || 0;
            }

            totals[currency] = (totals[currency] || 0) + price;
          }
          if (item.type === "domain_bundle") {
            const currency = getDomainBundleCartLineCurrency(item);
            const price = getDomainBundleCartLinePrice(item);
            totals[currency] = (totals[currency] || 0) + price;
          }
          if (item.type === "hivelocity") {
            const hv = item as HivelocityCartItem;
            const currency = hv.currency || "USD";
            const price = Number(hv.subtotalExVat ?? hv.totalPrice ?? 0) || 0;
            totals[currency] = (totals[currency] || 0) + price;
          }
        });

        return totals;
      },

      getCurrenciesInCart: () => {
        const currencies = new Set<string>();

        get().items.forEach((item) => {
          if (item.type === "domain" && item.price) {
            if (item.addedInCurrency) {
              currencies.add(item.addedInCurrency);
            } else if (item.price.calculated?.currency) {
              currencies.add(item.price.calculated.currency);
            } else if (item.price.reseller?.currency) {
              currencies.add(item.price.reseller.currency);
            } else if (item.price.product?.currency) {
              currencies.add(item.price.product.currency);
            }
          }
          if (item.type === "domain_bundle") {
            currencies.add(getDomainBundleCartLineCurrency(item));
          }
          if (item.type === "hivelocity") {
            const hv = item as HivelocityCartItem;
            currencies.add(hv.currency || "USD");
          }
        });

        return Array.from(currencies);
      },

      getTotalForCurrency: (currency) => {
        const totals = get().getTotalsByCurrency();
        return totals[currency] || 0;
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => crossOriginCartStorage),
      partialize: (state) => {
        const MAX_CART_ITEMS = 100;
        const limitedItems = state.items.slice(0, MAX_CART_ITEMS);
        return { items: limitedItems, cartUpdatedAt: state.cartUpdatedAt };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Cart rehydration error:", error);
          if (typeof window !== "undefined" && window.localStorage) {
            try {
              window.localStorage.removeItem(CART_STORAGE_KEY);
              removeCookieSafe(CART_STORAGE_KEY);
            } catch (e) {
              console.error("Failed to clear corrupted cart:", e);
            }
          }
        }
      },
    },
  ),
);

function removeCookieSafe(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${name}=; path=/; max-age=0; domain=.nisccloud.com; SameSite=Lax`;
}

export { CART_STORAGE_KEY };
