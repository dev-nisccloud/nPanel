import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// Union type for all possible cart items
type CartItem = DomainCartItem | HostingCartItem | ServiceCartItem;

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
export type { CartItem, DomainCartItem, HostingCartItem, ServiceCartItem };
