"use client";

import * as React from "react";
import { useCartStore } from "@/stores/cart-store";

// Shared domain search result type
export interface DomainSearchResult {
  domain: string;
  status: string;
  reason?: string;
  price?: {
    product: {
      price: number;
      currency: string;
    };
    reseller: {
      price: number;
      currency: string;
    };
    calculated?: {
      originalPrice: number;
      marginAmount: number;
      finalPrice: number;
      currency: string;
      marginType: string | null;
      marginValue: string | null;
      convertedPrice?: number;
      exchangeRate?: number;
      displayCurrency?: string;
    };
  };
  whois?: {
    registrant?: string;
    registrar?: string;
    creation_date?: string;
    expiration_date?: string;
  };
}

// Currency context interface - shared between agency and customer
export interface CurrencyContext {
  selectedCurrency: string;
  isConversionAvailable: boolean;
  convertPricesBatch: (prices: Array<{ amount: number; currency: string }>, targetCurrency: string) => Promise<any[]>;
}

// Pricing hook interface
export interface DomainPricingHook {
  calculatePricesBatch: (results: DomainSearchResult[]) => Promise<DomainSearchResult[]>;
  isLoadingTldSettings: boolean;
  selectedCurrency: string;
}

// Stable selector function outside component to prevent recreation
const selectCartDomainNames = (state: ReturnType<typeof useCartStore.getState>) => {
  const domainNames: string[] = [];
  for (const item of state.items) {
    if (item.type === "domain" && (item as any).domain) {
      domainNames.push((item as any).domain);
    }
  }
  return domainNames.sort().join(",");
};

/**
 * Domain search hook (agency/customer).
 * No single bulk query; sections fetch on scroll via useSectionDomainCheck.
 */
export function useDomainSearch(
  _currencyContext: CurrencyContext,
  pricingHook: DomainPricingHook
) {
  const [domainName, setDomainName] = React.useState("");
  const [searchQueryName, setSearchQueryName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const { selectedCurrency } = pricingHook;
  const addDomain = useCartStore((state) => state.addDomain);
  const removeDomainByName = useCartStore((state) => state.removeDomainByName);
  const cartDomainNamesHash = useCartStore(selectCartDomainNames);

  const cartDomainSet = React.useMemo(() => {
    if (!cartDomainNamesHash) return new Set<string>();
    return new Set(cartDomainNamesHash.split(",").filter(Boolean));
  }, [cartDomainNamesHash]);

  const isDomainInCart = React.useCallback(
    (domainName: string) => cartDomainSet.has(domainName),
    [cartDomainSet]
  );

  const sanitizeDomainName = React.useCallback((input: string): string => {
    let sanitized = input.trim().toLowerCase();
    sanitized = sanitized.replace(/^https?:\/\//, "");
    sanitized = sanitized.replace(/\/+$/, "");
    sanitized = sanitized.replace(/^www\./i, "");
    sanitized = sanitized.replace(/\.[a-z0-9-]{2,63}$/i, "");
    return sanitized.trim();
  }, []);

  const triggerSearch = React.useCallback(() => {
    if (domainName.trim()) {
      const sanitized = sanitizeDomainName(domainName);
      if (sanitized) setSearchQueryName(sanitized);
    }
  }, [domainName, sanitizeDomainName]);

  const handleAddToCart = React.useCallback(
    (result: DomainSearchResult) => {
      addDomain({
        domain: result.domain,
        status: result.status,
        price: result.price,
        addedInCurrency: selectedCurrency,
      });
    },
    [addDomain, selectedCurrency]
  );

  const handleRemoveFromCart = React.useCallback((domain: string) => {
    removeDomainByName(domain);
  }, [removeDomainByName]);

  return {
    domainName,
    setDomainName,
    searchQueryName,
    error,
    setError,
    isDomainInCart,
    handleAddToCart,
    handleRemoveFromCart,
    triggerSearch,
    sanitizeDomainName,
  };
}
