"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";

// Supported currencies (limited set for efficiency)
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]['code'];

interface CurrencyContextType {
  selectedCurrency: SupportedCurrency;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  isConversionAvailable: boolean;
  exchangeRates: any;
  isLoadingRates: boolean;
  isConverting: boolean;
  convertPricesBatch: (prices: Array<{ amount: number; currency: string }>, targetCurrency: string) => Promise<any[]>;
}

const CurrencyContext = React.createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Agency: domain prices are always shown in KES (conversion applied when source is USD/EUR etc.)
  const [selectedCurrency, setSelectedCurrency] = React.useState<SupportedCurrency>('KES');
  const [isConverting, setIsConverting] = React.useState(false);

  // Guard setState so we never update after unmount (e.g. when user switches to Settings tab while conversion is in progress)
  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load from localStorage on mount
  // Commented out to always use KES as default for agency side
  // React.useEffect(() => {
  //   const saved = localStorage.getItem('selectedCurrency') as SupportedCurrency;
  //   if (saved && SUPPORTED_CURRENCIES.some(c => c.code === saved)) {
  //     setSelectedCurrency(saved);
  //   }
  // }, []);

  // Save to localStorage on change
  React.useEffect(() => {
    localStorage.setItem('selectedCurrency', selectedCurrency);
  }, [selectedCurrency]);

  // Fetch real exchange rates from API
  const { data: exchangeRates, isLoading: isLoadingRates } = trpc.currency.getExchangeRates.useQuery(
    { baseCurrency: 'USD' },
    {
      staleTime: 6 * 60 * 60 * 1000, // 6 hours (matches server cache)
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  // Currency conversion mutation - stable reference using useRef for callbacks; guard callbacks to avoid setState on unmounted component
  const convertPricesMutation = trpc.currency.convertPrices.useMutation({
    onMutate: () => {
      if (isMountedRef.current) setIsConverting(true);
    },
    onSettled: () => {
      if (isMountedRef.current) setIsConverting(false);
    },
  });

  // Use ref to store mutation to keep stable reference
  const mutationRef = React.useRef(convertPricesMutation);
  mutationRef.current = convertPricesMutation;

  // Keep latest exchange rates in a ref so convertPricesBatch can use them without re-creating the callback
  const exchangeRatesRef = React.useRef(exchangeRates);
  exchangeRatesRef.current = exchangeRates;

  // Batch convert prices function - stabilized with useCallback
  // Empty deps array ensures function reference stays stable
  const convertPricesBatch = React.useCallback(async (
    prices: Array<{ amount: number; currency: string }>,
    targetCurrency: string
  ): Promise<any[]> => {
    if (prices.length === 0) {
      return [];
    }

    const latestRates = exchangeRatesRef.current;
    const rates = latestRates?.success === true && latestRates.data?.rates
      ? (latestRates.data.rates as Record<string, number>)
      : null;

    // Fast path: convert fully on client using loaded exchange rates
    if (rates) {
      return prices.map(({ amount, currency }) => {
        let rate = 1;

        if (currency === targetCurrency) {
          rate = 1;
        } else if (currency === 'USD') {
          rate = rates[targetCurrency] ?? 1;
        } else if (targetCurrency === 'USD') {
          rate = 1 / (rates[currency] ?? 1);
        } else {
          const usdToSource = rates[currency] ?? 1;
          const usdToTarget = rates[targetCurrency] ?? 1;
          rate = usdToTarget / usdToSource;
        }

        const convertedAmount = Math.round(amount * rate * 100) / 100;
        return {
          originalAmount: amount,
          convertedAmount,
          rate,
          currency: targetCurrency,
        };
      });
    }

    // Fallback: use server mutation if rates are not yet available
    try {
      const result = await mutationRef.current.mutateAsync({
        prices,
        targetCurrency,
      });

      if (result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to convert prices batch:', error);
      return [];
    }
  }, []); // Empty deps - mutation ref is updated via assignment

  const isConversionAvailable = Boolean(exchangeRates?.success && exchangeRates.data?.rates);

  // NOTE: isConverting is intentionally included in deps now that the consuming side
  // uses useEffect (not useLayoutEffect). Previously omitting it from deps was a workaround
  // for the render-loop; with useEffect it's safe. We add it back to deps for correctness.
  const value = React.useMemo(() => ({
    selectedCurrency,
    setSelectedCurrency,
    isConversionAvailable,
    exchangeRates,
    isLoadingRates,
    isConverting,
    convertPricesBatch,
  }), [selectedCurrency, isConversionAvailable, exchangeRates, isLoadingRates, isConverting, convertPricesBatch]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = React.useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

