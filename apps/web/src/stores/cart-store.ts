import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeCeilVatTotals } from '@npanel/api/lib/convert-price';

// Base item interface that all cart items must have
interface BaseCartItem {
  id: string;
  type: string;
  addedAt: number;
}

// Domain-specific item structure
interface DomainCartItem extends BaseCartItem {
  type: 'domain';
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
  // Store the currency that was active when the item was added
  addedInCurrency?: string;
}

// Future item types can be added here
interface HostingCartItem extends BaseCartItem {
  type: 'hosting';
  plan: string;
  price?: number;
  currency?: string;
}

interface ServiceCartItem extends BaseCartItem {
  type: 'service';
  name: string;
  price?: number;
  currency?: string;
}

interface HivelocityCartItem extends BaseCartItem {
  type: "hivelocity";
  /** DEDICATED_SERVERS | VPS | VDS */
  productType: string;
  /** nisc_product UUID - same product for base plan, OS, and add-ons */
  niscProductId?: string;
  planName: string;
  planType?: string;
  billingCycle?: string;
  hivelocityPeriod: string;
  /** Currency used for display/checkout in the UI (KES or USD typically) */
  currency: string;

  /** Base plan (already in display currency, ex VAT) */
  basePrice: number;

  hostname: string;
  locationName?: string;
  locationDisplayName?: string;
  hivelocityProductId: number;

  os: {
    id: string;
    name: string;
    /** Price in display currency per month, ex VAT */
    price: number;
    priceUsd?: number;
  } | null;

  addons: Array<{
    id: string;
    name: string;
    /** Price in display currency per month, ex VAT */
    price: number;
    group?: string;
    priceUsd?: number;
  }>;

  /** Invoice-style lines (ex VAT) - OS and add-ons under main product */
  invoiceLines: Array<{
    id: string;
    kind: "base" | "os" | "addon";
    name: string;
    description?: string;
    amountExVat: number;
    optionId?: number;
  }>;

  /** Subtotal ex VAT (base + os + addons) */
  subtotalExVat: number;
  vatAmount: number;
  /** @deprecated use subtotalExVat - kept for persisted carts */
  totalPrice: number;
  selectedOptionIds: number[];
  basePriceUsdMonthly?: number;
  osPriceUsdMonthly?: number;
  addonsPriceUsdMonthly?: number;
}

// Union type for all possible cart items
type CartItem = DomainCartItem | HostingCartItem | ServiceCartItem | HivelocityCartItem;

interface CartStore {
  items: CartItem[];
  
  // Generic methods
  removeItem: (id: string) => void;
  clearCart: () => void;
  getItemById: (id: string) => CartItem | undefined;
  
  // Domain-specific methods
  addDomain: (domainData: Omit<DomainCartItem, 'id' | 'type' | 'addedAt'>) => void;
  removeDomain: (domainId: string) => void;
  removeDomainByName: (domainName: string) => void;
  getDomains: () => DomainCartItem[];
  isDomainInCart: (domainName: string) => boolean;
  getDomainFromCart: (domainName: string) => DomainCartItem | undefined;
  
  // Future item type methods can be added here
  // addHosting: (hostingData: Omit<HostingCartItem, 'id' | 'type' | 'addedAt'>) => void;
  // addService: (serviceData: Omit<ServiceCartItem, 'id' | 'type' | 'addedAt'>) => void;

  // Hivelocity-specific methods
  addHivelocity: (data: Omit<HivelocityCartItem, "id" | "type" | "addedAt">) => void;
  removeHivelocityAddon: (itemId: string, addonId: string) => void;
  
  // Computed values
  getTotal: () => number;
  getItemCount: () => number;
  getItemCountByType: (type: string) => number;
  
  // Currency-aware methods
  getTotalsByCurrency: () => Record<string, number>;
  getCurrenciesInCart: () => string[];
  getTotalForCurrency: (currency: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      // Generic remove item method
      removeItem: (id) => {
        set((state) => ({ 
          items: state.items.filter(item => item.id !== id) 
        }));
      },
      
      // Clear all items
      clearCart: () => set({ items: [] }),
      
      // Get item by ID
      getItemById: (id) => {
        return get().items.find(item => item.id === id);
      },
      
      // Domain-specific add method
      addDomain: (domainData) => {
        const domainItem: DomainCartItem = {
          ...domainData,
          type: 'domain',
          id: `domain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: Date.now(),
        };
        
        set((state) => ({ 
          items: [...state.items, domainItem] 
        }));
      },

      addHivelocity: (data) => {
        const item: HivelocityCartItem = {
          ...data,
          type: "hivelocity",
          id: `hivelocity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: Date.now(),
        };
        set((state) => ({ items: [...state.items, item] }));
      },

      removeHivelocityAddon: (itemId, addonId) => {
        set((state) => ({
          items: state.items.map((it) => {
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
        }));
      },
      
      // Domain-specific remove method
      removeDomain: (domainId) => {
        set((state) => ({ 
          items: state.items.filter(item => !(item.type === 'domain' && item.id === domainId)) 
        }));
      },
      
      // Remove domain by name
      removeDomainByName: (domainName) => {
        set((state) => ({ 
          items: state.items.filter(item => !(item.type === 'domain' && item.domain === domainName)) 
        }));
      },
      
      // Get all domain items
      getDomains: () => {
        return get().items.filter((item): item is DomainCartItem => item.type === 'domain');
      },
      
      // Check if domain is in cart
      isDomainInCart: (domainName) => {
        return get().items.some(item => item.type === 'domain' && item.domain === domainName);
      },
      
      // Get domain from cart by name
      getDomainFromCart: (domainName) => {
        return get().items.find(item => item.type === 'domain' && item.domain === domainName) as DomainCartItem | undefined;
      },
      
      // Calculate total price (using reseller price if available, otherwise product price)
      getTotal: () => {
        return get().items.reduce((sum, item) => {
          if (item.type === 'domain' && item.price) {
            const price = item.price.reseller?.price || item.price.product?.price || 0;
            return sum + price;
          }
          if (item.type === "hivelocity") {
            const hv = item as HivelocityCartItem;
            const subtotal = Number(hv.subtotalExVat ?? hv.totalPrice ?? 0) || 0;
            return sum + subtotal;
          }
          // Add other item type calculations here as needed
          return sum;
        }, 0);
      },
      
      // Get total item count
      getItemCount: () => get().items.length,
      
      // Get item count by type
      getItemCountByType: (type) => {
        return get().items.filter(item => item.type === type).length;
      },
      
      // Currency-aware methods
      getTotalsByCurrency: () => {
        const totals: Record<string, number> = {};
        
        get().items.forEach(item => {
          if (item.type === 'domain' && item.price) {
            // Determine the currency and price to use
            let currency: string;
            let price: number;
            
            if (item.addedInCurrency && item.price.calculated?.convertedPrice) {
              // Use the converted price and currency
              currency = item.addedInCurrency;
              price = item.price.calculated.convertedPrice;
            } else if (item.price.calculated?.finalPrice) {
              // Use calculated price
              currency = item.price.calculated.currency || 'USD';
              price = item.price.calculated.finalPrice;
            } else {
              // Fallback to reseller or product price
              currency = item.price.reseller?.currency || item.price.product?.currency || 'USD';
              price = item.price.reseller?.price || item.price.product?.price || 0;
            }
            
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
        
        get().items.forEach(item => {
          if (item.type === 'domain' && item.price) {
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
          if (item.type === "hivelocity") {
            const hv = item as any;
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
      name: 'npanel-cart',
      // OPTIMIZATION: Limit localStorage size and add error handling
      partialize: (state) => {
        // Limit cart to max 100 items to prevent localStorage bloat
        const MAX_CART_ITEMS = 100;
        const limitedItems = state.items.slice(0, MAX_CART_ITEMS);
        return { items: limitedItems };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Cart rehydration error:', error);
          // Clear corrupted cart data
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.removeItem('npanel-cart');
            } catch (e) {
              console.error('Failed to clear corrupted cart:', e);
            }
          }
        }
      },
    }
  )
);

// Export types for use in components
export type { CartItem, DomainCartItem, HostingCartItem, ServiceCartItem, HivelocityCartItem };
