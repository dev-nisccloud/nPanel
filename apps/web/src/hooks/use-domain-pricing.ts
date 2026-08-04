"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import type { DomainSearchResult } from "./use-domain-search";
import {
  applyMarginToPrice,
  getMarginMapHash,
  resolveMarginForDomain,
  type ClientMarginMap,
} from "@/lib/tld-margin";

interface CalculatedPrice {
  originalPrice: number;
  marginAmount: number;
  finalPrice: number;
  currency: string;
  marginType: string | null;
  marginValue: string | null;
  convertedPrice?: number;
  convertedOriginalPrice?: number;
  exchangeRate?: number;
  displayCurrency?: string;
}

interface PricingCache {
  [domain: string]: CalculatedPrice;
}

const pricingCache = new Map<string, PricingCache>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 10;
const MAX_DOMAINS_PER_CACHE = 1000;

interface CurrencyContext {
  selectedCurrency: string;
  isConversionAvailable: boolean;
  convertPricesBatch: (
    prices: Array<{ amount: number; currency: string }>,
    targetCurrency: string,
  ) => Promise<any[]>;
}

export function useDomainPricing(currencyContext: CurrencyContext) {
  const { selectedCurrency, isConversionAvailable, convertPricesBatch } =
    currencyContext;

  const { data: marginMapData, isLoading: isLoadingTldSettings } =
    trpc.tldSettings.listMarginMap.useQuery(undefined, {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    });

  const marginMap: ClientMarginMap | null = React.useMemo(() => {
    if (!marginMapData?.success || !marginMapData.data) return null;
    return {
      default: marginMapData.data.default,
      overrides: marginMapData.data.overrides ?? {},
    };
  }, [marginMapData]);

  const defaultTldSetting = marginMap?.default ?? null;

  const convertBatchRef = React.useRef(convertPricesBatch);
  convertBatchRef.current = convertPricesBatch;

  const selectedCurrencyRef = React.useRef(selectedCurrency);
  selectedCurrencyRef.current = selectedCurrency;

  const isConversionAvailableRef = React.useRef(isConversionAvailable);
  isConversionAvailableRef.current = isConversionAvailable;

  const marginMapRef = React.useRef(marginMap);
  marginMapRef.current = marginMap;

  const calculatePrice = React.useCallback(
    (domain: string, originalPrice: number, currency: string): CalculatedPrice => {
      const setting = resolveMarginForDomain(marginMapRef.current, domain);
      const applied = applyMarginToPrice(originalPrice, setting);
      return {
        originalPrice,
        marginAmount: applied.marginAmount,
        finalPrice: applied.finalPrice,
        currency,
        marginType: applied.marginType,
        marginValue: applied.marginValue,
      };
    },
    [marginMap],
  );

  const calculatePricesBatch = React.useCallback(
    async (results: DomainSearchResult[]): Promise<DomainSearchResult[]> => {
      if (results.length === 0) {
        return results;
      }

      const tldSettingHash = getMarginMapHash(marginMapRef.current);
      const currentSelectedCurrency = selectedCurrencyRef.current;
      const cacheKey = `${tldSettingHash}-${currentSelectedCurrency}`;
      const now = Date.now();

      let currentCache: PricingCache = {};
      const cacheExists = pricingCache.has(cacheKey);
      const cacheIsValid =
        cacheExists &&
        now - (cacheExpiry.get(cacheKey) || 0) < CACHE_DURATION;

      if (cacheIsValid) {
        currentCache = pricingCache.get(cacheKey) || {};
      }

      interface ProcessedDomain {
        result: DomainSearchResult;
        calculated: CalculatedPrice | null;
        needsConversion: boolean;
        domainCacheKey: string;
        convertedCacheKey: string;
      }

      const processedDomains = await Promise.all(
        results.map(async (result) => {
          const rawPrice = result.price?.reseller?.price;
          const hasValidPrice =
            typeof rawPrice === "number" && !Number.isNaN(rawPrice);
          if (result.status !== "free" || !hasValidPrice) {
            return {
              result,
              calculated: null,
              needsConversion: false,
              domainCacheKey: "",
              convertedCacheKey: "",
            };
          }

          const domain = result.domain;
          const originalPrice = rawPrice as number;
          const currency = result.price?.reseller?.currency || "USD";
          const domainCacheKey = `${domain}-${originalPrice}-${currency}`;
          const convertedCacheKey = `${domainCacheKey}-converted-${currentSelectedCurrency}`;

          const existingCalculated = result.price?.calculated;
          if (existingCalculated) {
            const needsConversion = currentSelectedCurrency !== currency;
            const hasCorrectConversion = needsConversion
              ? (existingCalculated as any).convertedPrice &&
                (existingCalculated as any).displayCurrency ===
                  currentSelectedCurrency
              : true;

            if (hasCorrectConversion && existingCalculated.finalPrice) {
              return {
                result,
                calculated: existingCalculated as CalculatedPrice,
                needsConversion: false,
                domainCacheKey,
                convertedCacheKey,
              };
            }
          }

          if (cacheIsValid && currentCache[domainCacheKey]) {
            const cached = currentCache[domainCacheKey];
            if (
              currentSelectedCurrency === currency ||
              (cached as any).displayCurrency === currentSelectedCurrency
            ) {
              return {
                result,
                calculated: cached,
                needsConversion: false,
                domainCacheKey,
                convertedCacheKey,
              };
            }
          }

          const calculated = calculatePrice(domain, originalPrice, currency);

          const needsConversion =
            isConversionAvailableRef.current &&
            currentSelectedCurrency !== currency;

          if (needsConversion) {
            const cachedConverted = currentCache[convertedCacheKey] as any;
            if (
              cachedConverted?.convertedPrice &&
              cachedConverted?.displayCurrency === currentSelectedCurrency
            ) {
              calculated.convertedPrice = cachedConverted.convertedPrice;
              calculated.exchangeRate = cachedConverted.exchangeRate;
              calculated.displayCurrency = cachedConverted.displayCurrency;
            }
          } else if (currentSelectedCurrency === currency) {
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
        }),
      );

      const finalsToConvert: Array<{
        amount: number;
        currency: string;
        index: number;
      }> = [];
      const originalsToConvert: Array<{
        amount: number;
        currency: string;
        index: number;
      }> = [];
      processedDomains.forEach((processed, index) => {
        if (processed.needsConversion && processed.calculated) {
          const currency = processed.result.price?.reseller?.currency || "USD";
          finalsToConvert.push({
            amount: processed.calculated.finalPrice,
            currency,
            index,
          });
          originalsToConvert.push({
            amount: processed.calculated.originalPrice,
            currency,
            index,
          });
        }
      });

      if (finalsToConvert.length > 0) {
        try {
          const allPricesForConversion = [
            ...finalsToConvert.map((p) => ({
              amount: p.amount,
              currency: p.currency,
            })),
            ...originalsToConvert.map((p) => ({
              amount: p.amount,
              currency: p.currency,
            })),
          ];
          const allConverted = await convertBatchRef.current(
            allPricesForConversion,
            currentSelectedCurrency,
          );
          const n = finalsToConvert.length;

          finalsToConvert.forEach((priceData, priceIndex) => {
            const converted = allConverted[priceIndex];
            if (converted && processedDomains[priceData.index].calculated) {
              const calculated = processedDomains[priceData.index].calculated!;
              calculated.convertedPrice = converted.convertedAmount;
              calculated.exchangeRate = converted.rate;
              calculated.displayCurrency = currentSelectedCurrency;

              const processed = processedDomains[priceData.index];
              currentCache[processed.convertedCacheKey] = {
                ...calculated,
                convertedPrice: converted.convertedAmount,
                exchangeRate: converted.rate,
                displayCurrency: currentSelectedCurrency,
              };
            }
          });

          originalsToConvert.forEach((priceData, priceIndex) => {
            const converted = allConverted[n + priceIndex];
            if (converted && processedDomains[priceData.index].calculated) {
              processedDomains[priceData.index].calculated!.convertedOriginalPrice =
                converted.convertedAmount;
            }
          });
        } catch (error) {
          console.error("Failed to convert prices batch:", error);
        }
      }

      const processedResults = processedDomains.map((processed) => {
        if (!processed.calculated) {
          return processed.result;
        }

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

      const cacheKeys = Object.keys(currentCache);
      if (cacheKeys.length > MAX_DOMAINS_PER_CACHE) {
        const sortedKeys = cacheKeys.slice(-MAX_DOMAINS_PER_CACHE);
        const limitedCache: PricingCache = {};
        sortedKeys.forEach((key) => {
          limitedCache[key] = currentCache[key]!;
        });
        currentCache = limitedCache;
      }

      pricingCache.set(cacheKey, currentCache);
      cacheExpiry.set(cacheKey, now);

      for (const [key, expiry] of cacheExpiry.entries()) {
        if (now - expiry > CACHE_DURATION) {
          pricingCache.delete(key);
          cacheExpiry.delete(key);
        }
      }

      if (pricingCache.size > MAX_CACHE_ENTRIES) {
        const sortedEntries = Array.from(cacheExpiry.entries()).sort(
          ([, a], [, b]) => a - b,
        );

        const entriesToRemove = sortedEntries.slice(
          0,
          pricingCache.size - MAX_CACHE_ENTRIES,
        );
        for (const [key] of entriesToRemove) {
          pricingCache.delete(key);
          cacheExpiry.delete(key);
        }
      }

      return processedResults;
    },
    [marginMap, calculatePrice],
  );

  const getPricingInfo = React.useCallback(
    (domain: string, originalPrice: number, currency: string) => {
      const tldSettingHash = getMarginMapHash(marginMapRef.current);
      const currentSelectedCurrency = selectedCurrencyRef.current;
      const cacheKey = `${tldSettingHash}-${currentSelectedCurrency}`;
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
    },
    [marginMap, calculatePrice],
  );

  const clearCache = React.useCallback(() => {
    pricingCache.clear();
    cacheExpiry.clear();
  }, []);

  return {
    defaultTldSetting,
    marginMap,
    isLoadingTldSettings,
    calculatePricesBatch,
    getPricingInfo,
    clearCache,
    hasDefaultSetting:
      Boolean(defaultTldSetting) ||
      Boolean(marginMap && Object.keys(marginMap.overrides).length > 0),
    selectedCurrency,
    isConversionAvailable,
  };
}
