"use client";

import * as React from "react";
import { useDomainSearch as useSharedDomainSearch, type CurrencyContext } from "@/hooks/use-domain-search";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import { useCurrency } from "./currency-context";

// Adapter hook that bridges shared logic with customer-specific currency context
export function useDomainSearch() {
  const currencyContext = useCurrency();
  
  // Create currency context for shared hook
  const sharedCurrencyContext: CurrencyContext = {
    selectedCurrency: currencyContext.selectedCurrency,
    isConversionAvailable: currencyContext.isConversionAvailable,
    convertPricesBatch: currencyContext.convertPricesBatch,
  };

  // Get pricing hook with currency context
  const pricingHook = useDomainPricing(sharedCurrencyContext);

  // Use shared domain search hook
  return useSharedDomainSearch(sharedCurrencyContext, pricingHook);
}
