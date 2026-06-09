"use client";

import * as React from "react";
import { useCartStore } from "@/stores/cart-store";
import { createDomainBundleCartItem } from "@npanel/cart-store";
import { stripKenyanTldFromQuery } from "@/routes/agency.domains/_components/kenic-card-schema";

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
    if (item.type === "domain" && item.domain) {
      domainNames.push(item.domain);
    }
    if (item.type === "domain_bundle") {
      for (const entry of item.domains) {
        if (entry.domain) domainNames.push(entry.domain);
      }
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
  const addDomainBundle = useCartStore((state) => state.addDomainBundle);
  const removeDomainByName = useCartStore((state) => state.removeDomainByName);
  const removeDomainBundleByDomains = useCartStore((state) => state.removeDomainBundleByDomains);
  const isDomainBundleInCart = useCartStore((state) => state.isDomainBundleInCart);
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

  /**
   * Starts a search if valid.
   * @param overrideRaw optional raw string (e.g. from AI suggestions); when set, used instead of `domainName` and syncs `domainName` on success.
   * - started=false: invalid/empty input
   * - changed=false: same query as last submitted (no new fetch cycle expected)
   */
  const triggerSearch = React.useCallback(
    (overrideRaw?: string): { started: boolean; changed: boolean } => {
      const source = overrideRaw !== undefined ? overrideRaw : domainName;
      const raw = source.trim();
      if (!raw) return { started: false, changed: false };
      setError(null);
      const sanitized = sanitizeDomainName(raw);
      if (!isValidSearchQuery(sanitized)) {
        setError("Enter a valid search query to find your domain.");
        return { started: false, changed: false };
      }
      const nextSearchQuery = toSingleLabelName(sanitized);
      const isSameQuery = nextSearchQuery === searchQueryName && raw === rawSearchQueryForResults;
      if (isSameQuery) {
        return { started: true, changed: false };
      }
      if (overrideRaw !== undefined) {
        setDomainName(raw);
      }
      setSearchQueryName(nextSearchQuery);
      setRawSearchQueryForResults(raw);
      return { started: true, changed: true };
    },
    [
      domainName,
      sanitizeDomainName,
      isValidSearchQuery,
      toSingleLabelName,
      searchQueryName,
      rawSearchQueryForResults,
    ]
  );

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

  const handleAddDomainBundle = React.useCallback(
    (params: {
      domains: DomainSearchResult[];
      bundlePrice: number;
      bundleCurrency?: string;
      bundleLabel?: string;
    }) => {
      const domainNames = params.domains.map((d) => d.domain).filter(Boolean);
      if (isDomainBundleInCart(domainNames)) return;
      addDomainBundle(
        createDomainBundleCartItem({
          domains: params.domains.map((result) => ({
            domain: result.domain,
            status: result.status,
            reason: result.reason,
            price: result.price,
          })),
          bundlePrice: params.bundlePrice,
          bundleCurrency: params.bundleCurrency,
          bundleLabel: params.bundleLabel,
          addedInCurrency: selectedCurrency,
        }),
      );
    },
    [addDomainBundle, isDomainBundleInCart, selectedCurrency],
  );

  const handleRemoveDomainBundle = React.useCallback(
    (domainNames: string[]) => {
      removeDomainBundleByDomains(domainNames);
    },
    [removeDomainBundleByDomains],
  );

  return {
    domainName,
    setDomainName,
    searchQueryName,
    rawSearchQueryForResults,
    error,
    setError,
    isDomainInCart,
    isDomainBundleInCart,
    handleAddToCart,
    handleRemoveFromCart,
    handleAddDomainBundle,
    handleRemoveDomainBundle,
    triggerSearch,
    sanitizeDomainName,
  };
}

