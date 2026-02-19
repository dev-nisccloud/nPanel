"use client";

import * as React from "react";
import { useCartStore } from "@/stores/cart-store";
import { stripKenyanTldFromQuery } from "@/app/(main)/agency/domains/_components/kenic-card-schema";

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
  /** Raw input at time of last successful search – used for results only (no live-typing / debounce). */
  const [rawSearchQueryForResults, setRawSearchQueryForResults] = React.useState("");
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
    let s = input.trim().toLowerCase();
    s = s.replace(/#.*$/, "").trim(); // fragment (#hash)
    s = s.replace(/\?.*$/, "").trim(); // query (?x=1)
    s = (s.split("/")[0] ?? s).trim(); // path (only hostname part)
    s = s.replace(/^https?:\/\//, "");
    s = s.replace(/\/+$/, "");
    s = s.replace(/^www\./i, "");
    s = stripKenyanTldFromQuery(s);
    s = s.replace(/\.[a-z0-9-]{2,63}$/i, "");
    s = s.replace(/^[.-]+|[.-]+$/g, ""); // no leading/trailing dots or hyphens
    return s.trim();
  }, []);

  /** True if the sanitized name is valid for domain search (letters, numbers, hyphens, dots; no invalid chars). */
  const isValidSearchQuery = React.useCallback((sanitized: string): boolean => {
    if (!sanitized || sanitized.length > 253) return false;
    if (/[^a-z0-9.-]/.test(sanitized)) return false; // only these chars
    if (/^[.-]|[.-]$/.test(sanitized)) return false; // no start/end with . or -
    if (/\.\./.test(sanitized)) return false; // no consecutive dots
    const labels = sanitized.split(".");
    if (labels.some((l) => l.length === 0 || l.length > 63)) return false;
    if (labels.some((l) => /^-|-$/.test(l))) return false; // label cannot start/end with hyphen
    return true;
  }, []);

  /**
   * Single-label name for KENIC + OpenProvider (both reject or mis-handle dots in name).
   * e.g. "me.fineyakwoyo" → "fineyakwoyo". Same rule as OpenProvider so Kenyan and OpenProvider search the same base name.
   */
  const toSingleLabelName = React.useCallback((sanitized: string): string => {
    const t = sanitized.trim();
    if (!t) return t;
    const parts = t.split(".");
    return parts[parts.length - 1] ?? t;
  }, []);

  /** Returns true if search was started (valid query); false if invalid (error set). */
  const triggerSearch = React.useCallback((): boolean => {
    const raw = domainName.trim();
    if (!raw) return false;
    setError(null);
    const sanitized = sanitizeDomainName(raw);
    if (!isValidSearchQuery(sanitized)) {
      setError("Enter a valid search query to find your domain.");
      return false;
    }
    setSearchQueryName(toSingleLabelName(sanitized));
    setRawSearchQueryForResults(raw);
    return true;
  }, [domainName, sanitizeDomainName, isValidSearchQuery, toSingleLabelName]);

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
    rawSearchQueryForResults,
    error,
    setError,
    isDomainInCart,
    handleAddToCart,
    handleRemoveFromCart,
    triggerSearch,
    sanitizeDomainName,
  };
}
