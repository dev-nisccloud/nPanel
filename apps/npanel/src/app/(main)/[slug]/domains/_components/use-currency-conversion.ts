"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";

// Types
interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface ConvertedPrice {
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  currency: string;
}

interface PriceToConvert {
  amount: number;
  currency: string;
}

// Supported currencies (matches backend)
const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
];

export function useCurrencyConversion() {
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>('USD');
  const [isConverting, setIsConverting] = React.useState(false);

  // Use ref to avoid dependency issues
  const selectedCurrencyRef = React.useRef(selectedCurrency);
  selectedCurrencyRef.current = selectedCurrency;

  // Get supported currencies from server
  const { data: supportedCurrencies = DEFAULT_CURRENCIES } = trpc.currency.getSupportedCurrencies.useQuery(
    undefined,
    {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      refetchOnWindowFocus: false,
    }
  );

  // Get exchange rates (cached on server)
  const { data: exchangeRates, isLoading: isLoadingRates } = trpc.currency.getExchangeRates.useQuery(
    { baseCurrency: 'USD' },
    {
      staleTime: 6 * 60 * 60 * 1000, // 6 hours
      gcTime: 6 * 60 * 60 * 1000, // 6 hours
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  // Convert prices mutation
  const convertPricesMutation = trpc.currency.convertPrices.useMutation({
    onMutate: () => {
      setIsConverting(true);
    },
    onSettled: () => {
      setIsConverting(false);
    },
  });

  // Get API usage status
  const { data: apiUsageStatus } = trpc.currency.getApiUsageStatus.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  // Get cache status for monitoring
  const { data: cacheStatus } = trpc.currency.getCacheStatus.useQuery(
    undefined,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  // Convert single price
  const convertPrice = React.useCallback(async (
    amount: number,
    fromCurrency: string,
    toCurrency: string = selectedCurrency
  ): Promise<ConvertedPrice | null> => {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        rate: 1,
        currency: toCurrency,
      };
    }

    try {
      const result = await convertPricesMutation.mutateAsync({
        prices: [{ amount, currency: fromCurrency }],
        targetCurrency: toCurrency,
      });

      if (result.success && result.data?.[0]) {
        return result.data[0];
      }

      return null;
    } catch (error) {
      console.error('Failed to convert price:', error);
      return null;
    }
  }, [convertPricesMutation]);

  // Convert multiple prices efficiently
  const convertPricesBatch = React.useCallback(async (
    prices: PriceToConvert[],
    targetCurrency: string = selectedCurrencyRef.current
  ): Promise<ConvertedPrice[]> => {
    if (prices.length === 0) {
      return [];
    }

    try {
      const result = await convertPricesMutation.mutateAsync({
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
  }, [convertPricesMutation]);

  // Get current exchange rate between two currencies
  const getExchangeRate = React.useCallback((fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    if (!exchangeRates?.success || !exchangeRates.data?.rates) {
      return 1; // Fallback to 1:1 if rates not available
    }

    const rates = exchangeRates.data.rates;

    if (fromCurrency === 'USD') {
      return rates[toCurrency] || 1;
    } else if (toCurrency === 'USD') {
      return 1 / (rates[fromCurrency] || 1);
    } else {
      // Convert between two non-USD currencies
      const usdToFrom = rates[fromCurrency] || 1;
      const usdToTo = rates[toCurrency] || 1;
      return usdToTo / usdToFrom;
    }
  }, [exchangeRates]);

  // Format currency amount
  const formatCurrency = React.useCallback((amount: number, currency: string = selectedCurrencyRef.current): string => {
    const currencyInfo = supportedCurrencies.find(c => c.code === currency);
    const symbol = currencyInfo?.symbol || currency;
    
    // Format with appropriate decimal places
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol} ${formattedAmount}`;
  }, [supportedCurrencies]);

  // Check if conversion is available
  const isConversionAvailable = React.useMemo(() => {
    return exchangeRates?.success && exchangeRates.data?.rates;
  }, [exchangeRates]);

  // Get conversion status message (computed directly, not as callback)
  const conversionStatus = React.useMemo(() => {
    if (!isConversionAvailable) {
      return {
        message: 'Currency conversion temporarily unavailable',
        type: 'warning' as const,
      };
    }

    if (apiUsageStatus?.status === 'critical') {
      return {
        message: 'API usage limit exceeded. Conversion may be limited.',
        type: 'error' as const,
      };
    }

    if (apiUsageStatus?.status === 'warning') {
      return {
        message: 'API usage approaching limit',
        type: 'warning' as const,
      };
    }

    return {
      message: 'Currency conversion active',
      type: 'success' as const,
    };
  }, [isConversionAvailable, apiUsageStatus?.status]);

  return {
    // State
    selectedCurrency,
    setSelectedCurrency,
    isConverting,
    isLoadingRates,
    
    // Data
    supportedCurrencies,
    exchangeRates,
    apiUsageStatus,
    cacheStatus,
    
    // Actions
    convertPrice,
    convertPricesBatch,
    getExchangeRate,
    formatCurrency,
    
    // Status
    isConversionAvailable,
    conversionStatus,
    
    // Error handling
    conversionError: convertPricesMutation.error,
  };
}
