import * as React from "react";
import { trpcQuery } from "./api";
import { calculateBundleTotalKes, convertPriceWithCeil } from "./bundle-pricing";
import type {
  CalculatedPrice,
  DomainSearchResult,
  ExchangeRates,
  MarginConfig,
} from "./types";

const SELECTED_CURRENCY = "KES";

interface MarginMap {
  default: MarginConfig | null;
  overrides: Record<string, MarginConfig>;
}

function extractExtension(domain: string): string {
  const normalized = domain.trim().toLowerCase();
  const idx = normalized.indexOf(".");
  if (idx < 0) return normalized.replace(/^\.+/, "");
  return normalized.slice(idx + 1);
}

function resolveMargin(
  map: MarginMap | null,
  domain: string,
): MarginConfig | null {
  if (!map) return null;
  const key = extractExtension(domain);
  if (key && map.overrides[key]) return map.overrides[key];
  return map.default;
}

interface ConvertedPrice {
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  currency: string;
}

interface PricingContextValue {
  selectedCurrency: string;
  isConversionAvailable: boolean;
  isLoadingTldSettings: boolean;
  hasDefaultSetting: boolean;
  convertPricesBatch: (
    prices: Array<{ amount: number; currency: string }>,
    targetCurrency: string,
  ) => Promise<ConvertedPrice[]>;
  calculatePricesBatch: (results: DomainSearchResult[]) => Promise<DomainSearchResult[]>;
  getPricingInfo: (
    domain: string,
    originalPrice: number,
    currency: string,
  ) => CalculatedPrice;
}

const PricingContext = React.createContext<PricingContextValue | undefined>(undefined);

function applyMargin(price: number, config: MarginConfig | null, currency: string): CalculatedPrice {
  if (!config) {
    return {
      originalPrice: price,
      marginAmount: 0,
      finalPrice: price,
      currency,
      marginType: null,
      marginValue: null,
    };
  }

  const { marginType, percentageMargin, fixedMargin, roundOff } = config;
  let marginAmount = 0;
  let finalPrice = price;

  if (marginType === "PERCENTAGE" && percentageMargin) {
    const pct = parseFloat(percentageMargin);
    if (!Number.isNaN(pct)) {
      marginAmount = (price * pct) / 100;
      finalPrice = price + marginAmount;
    }
  } else if (marginType === "FIXED" && fixedMargin) {
    const fixed = parseFloat(fixedMargin);
    if (!Number.isNaN(fixed)) {
      marginAmount = fixed;
      finalPrice = price + marginAmount;
    }
  }

  if (roundOff) {
    const rv = parseFloat(roundOff);
    if (!Number.isNaN(rv) && rv > 0) {
      finalPrice = Math.ceil(finalPrice / rv) * rv;
      marginAmount = finalPrice - price;
    }
  }

  return {
    originalPrice: price,
    marginAmount,
    finalPrice,
    currency,
    marginType,
    marginValue: marginType === "PERCENTAGE" ? percentageMargin : fixedMargin,
  };
}

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [marginMap, setMarginMap] = React.useState<MarginMap | null>(null);
  const [isLoadingTldSettings, setIsLoadingTldSettings] = React.useState(true);
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRates | null>(null);

  const ratesRef = React.useRef(exchangeRates);
  ratesRef.current = exchangeRates;
  const marginMapRef = React.useRef(marginMap);
  marginMapRef.current = marginMap;

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoadingTldSettings(true);
      const [marginRes, ratesRes] = await Promise.allSettled([
        trpcQuery<{
          success: boolean;
          data: MarginMap | null;
        }>("publicPricing.getMarginMap"),
        trpcQuery<{ success: boolean; data: ExchangeRates | null }>(
          "publicPricing.getExchangeRatesPublic",
          { baseCurrency: "USD" },
        ),
      ]);
      if (cancelled) return;
      if (marginRes.status === "fulfilled" && marginRes.value?.success && marginRes.value.data) {
        setMarginMap({
          default: marginRes.value.data.default,
          overrides: marginRes.value.data.overrides ?? {},
        });
      } else {
        // Fallback to legacy default-only endpoint
        const legacy = await trpcQuery<{ success: boolean; data: MarginConfig | null }>(
          "publicPricing.getDefaultMarginConfig",
        ).catch(() => null);
        if (!cancelled && legacy?.success) {
          setMarginMap({ default: legacy.data, overrides: {} });
        }
      }
      if (ratesRes.status === "fulfilled" && ratesRes.value?.success && ratesRes.value.data) {
        setExchangeRates(ratesRes.value.data);
      }
      setIsLoadingTldSettings(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const convertPricesBatch = React.useCallback(
    async (
      prices: Array<{ amount: number; currency: string }>,
      targetCurrency: string,
    ): Promise<ConvertedPrice[]> => {
      if (prices.length === 0) return [];
      const rates = ratesRef.current?.rates;
      if (!rates) {
        return prices.map((p) => ({
          originalAmount: p.amount,
          convertedAmount: p.amount,
          rate: 1,
          currency: targetCurrency,
        }));
      }

      return prices.map(({ amount, currency }) => {
        let rate = 1;
        if (currency === targetCurrency) {
          rate = 1;
        } else if (currency === "USD") {
          rate = rates[targetCurrency] ?? 1;
        } else if (targetCurrency === "USD") {
          rate = 1 / (rates[currency] ?? 1);
        } else {
          const usdToSource = rates[currency] ?? 1;
          const usdToTarget = rates[targetCurrency] ?? 1;
          rate = usdToTarget / usdToSource;
        }
        return {
          originalAmount: amount,
          convertedAmount: convertPriceWithCeil(amount, currency, targetCurrency, rate),
          rate,
          currency: targetCurrency,
        };
      });
    },
    [],
  );

  const getPricingInfo = React.useCallback(
    (domain: string, originalPrice: number, currency: string): CalculatedPrice => {
      const config = resolveMargin(marginMapRef.current, domain);
      return applyMargin(originalPrice, config, currency);
    },
    [],
  );

  const calculatePricesBatch = React.useCallback(
    async (results: DomainSearchResult[]): Promise<DomainSearchResult[]> => {
      if (results.length === 0) return results;
      const targetCurrency = SELECTED_CURRENCY;

      type Processed = {
        result: DomainSearchResult;
        calculated: CalculatedPrice | null;
        needsConversion: boolean;
      };

      const processed: Processed[] = results.map((result) => {
        const rawPrice = result.price?.reseller?.price;
        const hasValidPrice = typeof rawPrice === "number" && !Number.isNaN(rawPrice);
        if (result.status !== "free" || !hasValidPrice) {
          return { result, calculated: null, needsConversion: false };
        }
        const currency = result.price?.reseller?.currency || "USD";
        const calculated = getPricingInfo(result.domain, rawPrice, currency);
        return {
          result,
          calculated,
          needsConversion: currency !== targetCurrency,
        };
      });

      const finalsToConvert: Array<{ amount: number; currency: string; index: number }> = [];
      const originalsToConvert: Array<{ amount: number; currency: string; index: number }> = [];

      processed.forEach((item, index) => {
        if (!item.calculated || !item.needsConversion) return;
        const currency = item.result.price?.reseller?.currency || "USD";
        finalsToConvert.push({ amount: item.calculated.finalPrice, currency, index });
        originalsToConvert.push({ amount: item.calculated.originalPrice, currency, index });
      });

      if (finalsToConvert.length > 0) {
        const allPrices = [
          ...finalsToConvert.map((p) => ({ amount: p.amount, currency: p.currency })),
          ...originalsToConvert.map((p) => ({ amount: p.amount, currency: p.currency })),
        ];
        const converted = await convertPricesBatch(allPrices, targetCurrency);
        const n = finalsToConvert.length;

        finalsToConvert.forEach((entry, i) => {
          const calc = processed[entry.index]?.calculated;
          const c = converted[i];
          if (calc && c) {
            calc.convertedPrice = c.convertedAmount;
            calc.exchangeRate = c.rate;
            calc.displayCurrency = targetCurrency;
          }
        });

        originalsToConvert.forEach((entry, i) => {
          const calc = processed[entry.index]?.calculated;
          const c = converted[n + i];
          if (calc && c) {
            calc.convertedOriginalPrice = c.convertedAmount;
          }
        });
      }

      return processed.map((item) => {
        if (!item.calculated) return item.result;
        const c = item.calculated;
        return {
          ...item.result,
          price: {
            ...item.result.price,
            product: item.result.price?.product || {
              price: c.originalPrice,
              currency: c.currency,
            },
            reseller: {
              ...item.result.price!.reseller,
              price: c.finalPrice,
            },
            calculated: c,
          },
        };
      });
    },
    [convertPricesBatch, getPricingInfo],
  );

  const value = React.useMemo(
    (): PricingContextValue => ({
      selectedCurrency: SELECTED_CURRENCY,
      isConversionAvailable: Boolean(exchangeRates?.rates),
      isLoadingTldSettings,
      hasDefaultSetting: marginMap?.default != null || Object.keys(marginMap?.overrides ?? {}).length > 0,
      convertPricesBatch,
      calculatePricesBatch,
      getPricingInfo,
    }),
    [
      exchangeRates,
      isLoadingTldSettings,
      marginMap,
      convertPricesBatch,
      calculatePricesBatch,
      getPricingInfo,
    ],
  );

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function usePricing() {
  const ctx = React.useContext(PricingContext);
  if (!ctx) throw new Error("usePricing must be used within PricingProvider");
  return ctx;
}

export function useBundleTotalKes(
  basePrices: Array<{ amount: number; currency: string }>,
): number | null {
  const { convertPricesBatch } = usePricing();
  const [total, setTotal] = React.useState<number | null>(null);
  const priceKey = basePrices.map((p) => `${p.amount}:${p.currency}`).join("|");

  React.useEffect(() => {
    if (!basePrices.length) {
      setTotal(null);
      return;
    }
    let cancelled = false;
    void calculateBundleTotalKes(basePrices, convertPricesBatch).then((result) => {
      if (!cancelled) setTotal(result);
    });
    return () => {
      cancelled = true;
    };
  }, [basePrices, convertPricesBatch, priceKey]);

  return total;
}
