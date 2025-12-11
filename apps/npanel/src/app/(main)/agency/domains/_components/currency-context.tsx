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
  // Default currency changed to KES for agency side
  const [selectedCurrency, setSelectedCurrency] = React.useState<SupportedCurrency>('KES');
  const [isConverting, setIsConverting] = React.useState(false);

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

  // Currency conversion mutation - stable reference using useRef for callbacks
  const convertPricesMutation = trpc.currency.convertPrices.useMutation({
    onMutate: () => {
      setIsConverting(true);
    },
    onSettled: () => {
      setIsConverting(false);
    },
  });

  // Use ref to store mutation to keep stable reference
  const mutationRef = React.useRef(convertPricesMutation);
  mutationRef.current = convertPricesMutation;

  // Batch convert prices function - stabilized with useCallback
  // Empty deps array ensures function reference stays stable
  const convertPricesBatch = React.useCallback(async (
    prices: Array<{ amount: number; currency: string }>,
    targetCurrency: string
  ): Promise<any[]> => {
    if (prices.length === 0) {
      return [];
    }

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

  // CRITICAL FIX: Remove isConverting from dependencies to prevent loop
  // isConverting is just UI state, not needed for function stability
  const value = React.useMemo(() => ({
    selectedCurrency,
    setSelectedCurrency,
    isConversionAvailable,
    exchangeRates,
    isLoadingRates,
    isConverting, // Still include in value for UI, but don't use in deps
    convertPricesBatch,
  }), [selectedCurrency, isConversionAvailable, exchangeRates, isLoadingRates, convertPricesBatch]); // Removed isConverting from deps

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

