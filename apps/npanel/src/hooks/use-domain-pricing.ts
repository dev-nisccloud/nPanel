"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import type { DomainSearchResult } from "./use-domain-search";

// Types for pricing calculation
interface TldSetting {
  id: string;
  name: string;
  marginType: string | null; // API returns string, not enum
  percentageMargin: string | null;
  fixedMargin: string | null;
  roundOff: string | null;
  isDefault: boolean;
}

interface CalculatedPrice {
  originalPrice: number;
  marginAmount: number;
  finalPrice: number;
  currency: string;
  marginType: string | null; // API returns string, not enum
  marginValue: string | null;
  // Currency conversion fields
  convertedPrice?: number;
  exchangeRate?: number;
  displayCurrency?: string;
}

interface PricingCache {
  [domain: string]: CalculatedPrice;
}

// Cache for calculated prices to avoid recalculation
// Key format: `${tldSettingHash}-${currency}`
const pricingCache = new Map<string, PricingCache>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to create a hash of TLD setting for cache key
function getTldSettingHash(tldSetting: TldSetting | null): string {
  if (!tldSetting) return 'no-setting';
  return `${tldSetting.id}-${tldSetting.marginType}-${tldSetting.percentageMargin}-${tldSetting.fixedMargin}-${tldSetting.roundOff}`;
}

// Currency context interface - shared between agency and customer
interface CurrencyContext {
  selectedCurrency: string;
  isConversionAvailable: boolean;
  convertPricesBatch: (prices: Array<{ amount: number; currency: string }>, targetCurrency: string) => Promise<any[]>;
}

export function useDomainPricing(currencyContext: CurrencyContext) {
  const [defaultTldSetting, setDefaultTldSetting] = React.useState<TldSetting | null>(null);
  const [isLoadingTldSettings, setIsLoadingTldSettings] = React.useState(true);

  const { selectedCurrency, isConversionAvailable, convertPricesBatch } = currencyContext;

  // P0-2: Fetch only default TLD setting (optimized endpoint - reduces payload by ~95%)
  const { data: tldSettingsData } = trpc.tldSettings.getDefault.useQuery(
    undefined,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache persists
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  // Set default TLD setting directly from optimized query
  React.useEffect(() => {
    if (tldSettingsData?.success) {
      setDefaultTldSetting(tldSettingsData.data || null);
    }
    setIsLoadingTldSettings(false);
  }, [tldSettingsData]);

  // Calculate price for a single domain
  const calculatePrice = React.useCallback((domain: string, originalPrice: number, currency: string): CalculatedPrice => {
    if (!defaultTldSetting) {
      return {
        originalPrice,
        marginAmount: 0,
        finalPrice: originalPrice,
        currency,
        marginType: null,
        marginValue: null,
      };
    }

    const { marginType, percentageMargin, fixedMargin, roundOff } = defaultTldSetting;
    let marginAmount = 0;
    let finalPrice = originalPrice;

    if (marginType === "PERCENTAGE" && percentageMargin) {
      const percentage = parseFloat(percentageMargin);
      if (!isNaN(percentage)) {
        marginAmount = (originalPrice * percentage) / 100;
        finalPrice = originalPrice + marginAmount;
      }
    } else if (marginType === "FIXED" && fixedMargin) {
      const fixed = parseFloat(fixedMargin);
      if (!isNaN(fixed)) {
        marginAmount = fixed;
        finalPrice = originalPrice + marginAmount;
      }
    }

    // Apply round off if specified
    if (roundOff) {
      const roundOffValue = parseFloat(roundOff);
      if (!isNaN(roundOffValue) && roundOffValue > 0) {
        finalPrice = Math.ceil(finalPrice / roundOffValue) * roundOffValue;
        marginAmount = finalPrice - originalPrice;
      }
    }

    return {
      originalPrice,
      marginAmount,
      finalPrice,
      currency,
      marginType,
      marginValue: marginType === "PERCENTAGE" ? percentageMargin : fixedMargin,
    };
  }, [defaultTldSetting]);

  // Batch calculate prices for multiple domains efficiently
  // This function is memoized and will update when currency, TLD settings, or conversion availability changes
  const calculatePricesBatch = React.useCallback(async (results: DomainSearchResult[]): Promise<DomainSearchResult[]> => {
    if (results.length === 0) {
      return results;
    }

    // Create a stable cache key based on TLD setting and currency
    const tldSettingHash = getTldSettingHash(defaultTldSetting);
    const cacheKey = `${tldSettingHash}-${selectedCurrency}`;
    const now = Date.now();

    // Check if we have a valid cache for this configuration
    let currentCache: PricingCache = {};
    const cacheExists = pricingCache.has(cacheKey);
    const cacheIsValid = cacheExists && (now - (cacheExpiry.get(cacheKey) || 0)) < CACHE_DURATION;

    if (cacheIsValid) {
      currentCache = pricingCache.get(cacheKey) || {};
    }

    // Process all domains in parallel, but collect prices needing conversion for batch processing
    interface ProcessedDomain {
      result: DomainSearchResult;
      calculated: CalculatedPrice | null;
      needsConversion: boolean;
      domainCacheKey: string;
      convertedCacheKey: string;
    }

    // First pass: Process all domains in parallel and collect prices needing conversion
    const processedDomains = await Promise.all(results.map(async (result, index) => {
      if (result.status !== 'free' || !result.price?.reseller?.price) {
        return {
          result,
          calculated: null,
          needsConversion: false,
          domainCacheKey: '',
          convertedCacheKey: '',
        };
      }

      const domain = result.domain;
      const originalPrice = result.price.reseller.price;
      const currency = result.price.reseller.currency || 'USD';
      const domainCacheKey = `${domain}-${originalPrice}-${currency}`;
      const convertedCacheKey = `${domainCacheKey}-converted-${selectedCurrency}`;

      // Check if result already has correct conversion - skip if it does
      const existingCalculated = result.price.calculated;
      if (existingCalculated) {
        const needsConversion = selectedCurrency !== currency;
        const hasCorrectConversion = needsConversion 
          ? (existingCalculated as any).convertedPrice && 
            (existingCalculated as any).displayCurrency === selectedCurrency
          : true; // No conversion needed
        
        if (hasCorrectConversion && existingCalculated.finalPrice) {
          // Result already has correct pricing, no processing needed
          return {
            result,
            calculated: existingCalculated as CalculatedPrice,
            needsConversion: false,
            domainCacheKey,
            convertedCacheKey,
          };
        }
      }

      // Check cache first (only if cache is valid)
      if (cacheIsValid && currentCache[domainCacheKey]) {
        const cached = currentCache[domainCacheKey];
        // Check if cached conversion matches current currency
        if (selectedCurrency === currency || 
            (cached as any).displayCurrency === selectedCurrency) {
          return {
            result,
            calculated: cached,
            needsConversion: false,
            domainCacheKey,
            convertedCacheKey,
          };
        }
      }

      // Calculate new price with markup
      const calculated = calculatePrice(domain, originalPrice, currency);

      // Check if conversion is needed and not cached
      const needsConversion = isConversionAvailable && selectedCurrency !== currency;
      
      if (needsConversion) {
        const cachedConverted = currentCache[convertedCacheKey] as any;
        if (cachedConverted?.convertedPrice && cachedConverted?.displayCurrency === selectedCurrency) {
          // Use cached conversion
          calculated.convertedPrice = cachedConverted.convertedPrice;
          calculated.exchangeRate = cachedConverted.exchangeRate;
          calculated.displayCurrency = cachedConverted.displayCurrency;
        }
        // If not cached, we'll batch convert below
      } else if (selectedCurrency === currency) {
        // Same currency, no conversion needed
        calculated.convertedPrice = undefined;
        calculated.exchangeRate = undefined;
        calculated.displayCurrency = undefined;
      }

      return {
        result,
        calculated,
        needsConversion: needsConversion && !currentCache[convertedCacheKey],
        domainCacheKey,
        convertedCacheKey,
      };
    }));

    // Collect all prices that need conversion for batch processing
    const pricesToConvert: Array<{ amount: number; currency: string; index: number }> = [];
    processedDomains.forEach((processed, index) => {
      if (processed.needsConversion && processed.calculated) {
        const currency = processed.result.price?.reseller?.currency || 'USD';
        pricesToConvert.push({
          amount: processed.calculated.finalPrice,
          currency: currency,
          index: index,
        });
      }
    });

    // Batch convert all prices that need conversion in a single API call
    if (pricesToConvert.length > 0) {
      try {
        const pricesForConversion = pricesToConvert.map(p => ({
          amount: p.amount,
          currency: p.currency,
        }));

        const convertedPrices = await convertPricesBatch(pricesForConversion, selectedCurrency);

        // Map converted prices back to their domains
        pricesToConvert.forEach((priceData, priceIndex) => {
          const converted = convertedPrices[priceIndex];
          if (converted && processedDomains[priceData.index].calculated) {
            const calculated = processedDomains[priceData.index].calculated!;
            calculated.convertedPrice = converted.convertedAmount;
            calculated.exchangeRate = converted.rate;
            calculated.displayCurrency = selectedCurrency;

            // Cache the conversion separately
            const processed = processedDomains[priceData.index];
            currentCache[processed.convertedCacheKey] = {
              ...calculated,
              convertedPrice: converted.convertedAmount,
              exchangeRate: converted.rate,
              displayCurrency: selectedCurrency,
            };
          }
        });
      } catch (error) {
        console.error('Failed to convert prices batch:', error);
        // Continue without conversion if it fails
      }
    }

    // Build final results array and cache them
    const processedResults = processedDomains.map((processed) => {
      if (!processed.calculated) {
        return processed.result;
      }

      // Cache the result
      if (processed.domainCacheKey) {
        currentCache[processed.domainCacheKey] = processed.calculated;
      }

      return {
        ...processed.result,
        price: {
          ...processed.result.price,
          product: processed.result.price?.product || {
            price: processed.calculated.originalPrice,
            currency: processed.calculated.currency,
          },
          reseller: {
            ...processed.result.price!.reseller,
            price: processed.calculated.finalPrice,
          },
          calculated: processed.calculated,
        },
      };
    });

    // Store in cache with stable key
    pricingCache.set(cacheKey, currentCache);
    cacheExpiry.set(cacheKey, now);

    // Clean up old cache entries (older than CACHE_DURATION)
    const expiredKeys = Array.from(cacheExpiry.entries())
      .filter(([_, expiry]) => now - expiry > CACHE_DURATION)
      .map(([key]) => key);

    expiredKeys.forEach(key => {
      pricingCache.delete(key);
      cacheExpiry.delete(key);
    });

    return processedResults;
  }, [defaultTldSetting, calculatePrice, selectedCurrency, isConversionAvailable, convertPricesBatch]);

  // Get pricing info for a specific domain
  const getPricingInfo = React.useCallback((domain: string, originalPrice: number, currency: string) => {
    const tldSettingHash = getTldSettingHash(defaultTldSetting);
    const cacheKey = `${tldSettingHash}-${selectedCurrency}`;
    const domainCacheKey = `${domain}-${originalPrice}-${currency}`;
    
    const cached = pricingCache.get(cacheKey)?.[domainCacheKey];
    if (cached) {
      const now = Date.now();
      const expiry = cacheExpiry.get(cacheKey) || 0;
      if (now - expiry < CACHE_DURATION) {
        return cached;
      }
    }

    return calculatePrice(domain, originalPrice, currency);
  }, [defaultTldSetting, calculatePrice, selectedCurrency]);

  // Clear cache (useful for testing or when TLD settings change)
  const clearCache = React.useCallback(() => {
    pricingCache.clear();
    cacheExpiry.clear();
  }, []);

  return {
    defaultTldSetting,
    isLoadingTldSettings,
    calculatePricesBatch,
    getPricingInfo,
    clearCache,
    hasDefaultSetting: !!defaultTldSetting,
    // Currency utilities
    selectedCurrency,
    isConversionAvailable,
  };
}

