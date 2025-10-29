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
const pricingCache = new Map<string, PricingCache>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useDomainPricing() {
  const [defaultTldSetting, setDefaultTldSetting] = React.useState<TldSetting | null>(null);
  const [isLoadingTldSettings, setIsLoadingTldSettings] = React.useState(true);

  // Use currency context for efficient state management
  const { selectedCurrency, isConversionAvailable, convertPricesBatch } = useCurrency();

  // Fetch default TLD setting
  const { data: tldSettingsData } = trpc.tldSettings.list.useQuery(
    {
      limit: 100,
      offset: 0,
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
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
  const calculatePricesBatch = React.useCallback(async (results: DomainSearchResult[]): Promise<DomainSearchResult[]> => {
    if (!defaultTldSetting || results.length === 0) {
      return results;
    }

    const cacheKey = `batch_${Date.now()}`;
    const now = Date.now();
    
    // Check if we have a recent cache
    const recentCache = Array.from(cacheExpiry.entries())
      .find(([key, expiry]) => now - expiry < CACHE_DURATION);
    
    let currentCache: PricingCache = {};
    if (recentCache) {
      currentCache = pricingCache.get(recentCache[0]) || {};
    }

    // Process all domains in one go
    const processedResults = await Promise.all(results.map(async (result) => {
      if (result.status !== 'free' || !result.price?.reseller?.price) {
        return result;
      }

      const domain = result.domain;
      const originalPrice = result.price.reseller.price;
      const currency = result.price.reseller.currency || 'USD';

      // Check cache first
      const cacheKey = `${domain}-${originalPrice}-${currency}-${selectedCurrency}`;
      if (currentCache[cacheKey]) {
        const cached = currentCache[cacheKey];
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

      // Calculate new price
      const calculated = calculatePrice(domain, originalPrice, currency);
      
      // Add currency conversion if available and different from original currency
      if (isConversionAvailable && selectedCurrency !== currency) {
        try {
          const convertedPrices = await convertPricesBatch([{
            amount: calculated.finalPrice,
            currency: currency,
          }], selectedCurrency);
          
          if (convertedPrices.length > 0) {
            const converted = convertedPrices[0];
            calculated.convertedPrice = converted.convertedAmount;
            calculated.exchangeRate = converted.rate;
            calculated.displayCurrency = selectedCurrency;
          }
        } catch (error) {
          console.error('Failed to convert price for domain:', domain, error);
          // Continue without conversion if it fails
        }
      }
      
      // Cache the result
      currentCache[cacheKey] = calculated;

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

    // Store in cache
    pricingCache.set(cacheKey, currentCache);
    cacheExpiry.set(cacheKey, now);

    // Clean up old cache entries
    const expiredKeys = Array.from(cacheExpiry.entries())
      .filter(([_, expiry]) => now - expiry > CACHE_DURATION)
      .map(([key]) => key);
    
    expiredKeys.forEach(key => {
      pricingCache.delete(key);
      cacheExpiry.delete(key);
    });

    return processedResults;
  }, [calculatePrice, selectedCurrency, isConversionAvailable]);

  // Get pricing info for a specific domain
  const getPricingInfo = React.useCallback((domain: string, originalPrice: number, currency: string) => {
    const cacheKey = Array.from(cacheExpiry.keys()).find(key => 
      Date.now() - (cacheExpiry.get(key) || 0) < CACHE_DURATION
    );
    
    if (cacheKey) {
      const cached = pricingCache.get(cacheKey)?.[domain];
      if (cached) {
        return cached;
      }
    }

    return calculatePrice(domain, originalPrice, currency);
  }, [calculatePrice]);

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
