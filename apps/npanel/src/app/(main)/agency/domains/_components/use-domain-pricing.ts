"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import type { DomainSearchResult } from "./domain-search";
import { useCurrency } from "./currency-context";

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

export function useDomainPricing() {
  const [defaultTldSetting, setDefaultTldSetting] = React.useState<TldSetting | null>(null);
  const [isLoadingTldSettings, setIsLoadingTldSettings] = React.useState(true);

  // Use currency context for efficient state management
  const { selectedCurrency, isConversionAvailable, convertPricesBatch } = useCurrency();

  // Fetch default TLD setting with React Query caching
  const { data: tldSettingsData } = trpc.tldSettings.list.useQuery(
    {
      limit: 100,
      offset: 0,
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache persists
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  // Find default TLD setting
  React.useEffect(() => {
    if (tldSettingsData?.success && tldSettingsData.data) {
      const defaultSetting = tldSettingsData.data.find(setting => setting.isDefault);
      setDefaultTldSetting(defaultSetting || null);
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

    // Process all domains in one go
    const processedResults = await Promise.all(results.map(async (result) => {
      if (result.status !== 'free' || !result.price?.reseller?.price) {
        return result;
      }

      const domain = result.domain;
      const originalPrice = result.price.reseller.price;
      const currency = result.price.reseller.currency || 'USD';

      // Create a domain-specific cache key
      const domainCacheKey = `${domain}-${originalPrice}-${currency}`;
      
      // Check if result already has correct conversion - skip if it does
      const existingCalculated = result.price.calculated;
      if (existingCalculated) {
        const needsConversion = selectedCurrency !== currency;
        const hasCorrectConversion = needsConversion 
          ? (existingCalculated as any).convertedPrice && 
            (existingCalculated as any).displayCurrency === selectedCurrency
          : true; // No conversion needed
        
        if (hasCorrectConversion && existingCalculated.finalPrice) {
          // Result already has correct pricing, return as-is
          return result;
        }
      }
      
      // Check cache first (only if cache is valid)
      if (cacheIsValid && currentCache[domainCacheKey]) {
        const cached = currentCache[domainCacheKey];
        // Check if cached conversion matches current currency
        if (selectedCurrency === currency || 
            (cached as any).displayCurrency === selectedCurrency) {
          return {
            ...result,
            price: {
              ...result.price,
              reseller: {
                ...result.price.reseller,
                price: cached.finalPrice,
              },
              calculated: cached,
            },
          };
        }
      }

      // Calculate new price with markup
      const calculated = calculatePrice(domain, originalPrice, currency);

      // Add currency conversion if available and different from original currency
      // Only convert if we don't already have the conversion for this currency
      if (isConversionAvailable && selectedCurrency !== currency) {
        // Check if we already have this conversion in cache by checking the domain cache key with currency
        const convertedCacheKey = `${domainCacheKey}-converted-${selectedCurrency}`;
        const cachedConverted = currentCache[convertedCacheKey] as any;
        
        if (cachedConverted?.convertedPrice && cachedConverted?.displayCurrency === selectedCurrency) {
          // Use cached conversion
          calculated.convertedPrice = cachedConverted.convertedPrice;
          calculated.exchangeRate = cachedConverted.exchangeRate;
          calculated.displayCurrency = cachedConverted.displayCurrency;
        } else {
          // Only convert if we don't have cached conversion
          try {
            const convertedPrices = await convertPricesBatch([{
              amount: calculated.finalPrice,
              currency: currency,
            }], selectedCurrency);

            if (convertedPrices.length > 0 && convertedPrices[0]) {
              const converted = convertedPrices[0];
              calculated.convertedPrice = converted.convertedAmount;
              calculated.exchangeRate = converted.rate;
              calculated.displayCurrency = selectedCurrency;
              
              // Cache the conversion separately
              currentCache[convertedCacheKey] = {
                ...calculated,
                convertedPrice: converted.convertedAmount,
                exchangeRate: converted.rate,
                displayCurrency: selectedCurrency,
              };
            }
          } catch (error) {
            console.error('Failed to convert price for domain:', domain, error);
            // Continue without conversion if it fails
          }
        }
      } else if (selectedCurrency === currency) {
        // Same currency, no conversion needed
        calculated.convertedPrice = undefined;
        calculated.exchangeRate = undefined;
        calculated.displayCurrency = undefined;
      }

      // Cache the result
      currentCache[domainCacheKey] = calculated;

      return {
        ...result,
        price: {
          ...result.price,
          reseller: {
            ...result.price.reseller,
            price: calculated.finalPrice,
          },
          calculated,
        },
      };
    }));

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
