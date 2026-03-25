"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { 
  getPopularTlds,
  getBusinessTlds,
  getEducationTlds,
  getInternationalTlds,
  getTechnologyTlds,
  getSocialPersonalTlds,
  getProfessionalServicesTlds,
  getMediaEntertainmentTlds,
  getEcommerceShoppingTlds,
  getIndustrySectorTlds,
  getLifestyleHobbiesTlds,
  getCountryCodeTlds,
  removeDotPrefix
} from "@nPanel/utils";
import { useCurrency } from "./currency-context";
import type { DomainSearchResult } from "./domain-search";

interface AISuggestion {
  name: string;
  description?: string;
  confidence?: number;
}

// Get extensions for current tab using TLD utility
const getCurrentTabExtensions = (tab: string) => {
  switch (tab) {
    case "popular": 
      return getPopularTlds().map(ext => `.${ext}`);
    case "business": 
      return getBusinessTlds().map(ext => `.${ext}`);
    case "education": 
      return getEducationTlds().map(ext => `.${ext}`);
    case "international": 
      return getInternationalTlds().map(ext => `.${ext}`);
    case "technology": 
      return getTechnologyTlds().map(ext => `.${ext}`);
    case "socialpersonal": 
      return getSocialPersonalTlds().map(ext => `.${ext}`);
    case "professionalservices": 
      return getProfessionalServicesTlds().map(ext => `.${ext}`);
    case "mediaentertainment": 
      return getMediaEntertainmentTlds().map(ext => `.${ext}`);
    case "ecommerceshopping": 
      return getEcommerceShoppingTlds().map(ext => `.${ext}`);
    case "industrysector": 
      return getIndustrySectorTlds().map(ext => `.${ext}`);
    case "lifestylehobbies": 
      return getLifestyleHobbiesTlds().map(ext => `.${ext}`);
    case "countrycodes": 
      return getCountryCodeTlds().map(ext => `.${ext}`);
    default: 
      return getPopularTlds().map(ext => `.${ext}`);
  }
};

export function useProgressiveDomainCheck() {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = React.useState(0);
  // Store results per tab: { [tab]: { [suggestionName]: DomainSearchResult[] } }
  const [suggestionResults, setSuggestionResults] = React.useState<Record<string, Record<string, DomainSearchResult[]>>>({});
  const [suggestionErrors, setSuggestionErrors] = React.useState<Record<string, Record<string, string>>>({});
  const [processingQueue, setProcessingQueue] = React.useState<AISuggestion[]>([]);

  // Use tRPC client for manual calls
  const trpcClient = trpc.useUtils();
  
  // Get currency context for pricing calculations
  const { selectedCurrency, isConversionAvailable, convertPricesBatch } = useCurrency();
  
  // Get TLD settings for pricing calculations
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
  const defaultTldSetting = React.useMemo(() => {
    if (tldSettingsData?.success && tldSettingsData.data) {
      return tldSettingsData.data.find(setting => setting.isDefault) || null;
    }
    return null;
  }, [tldSettingsData]);

  // Direct pricing calculation function
  const calculatePriceDirect = React.useCallback((domain: string, originalPrice: number, currency: string) => {
    if (!defaultTldSetting) {
      return {
        originalPrice,
        marginAmount: 0,
        finalPrice: originalPrice,
        currency,
        marginType: null,
        marginValue: null,
        convertedPrice: undefined,
        exchangeRate: undefined,
        displayCurrency: undefined,
      };
    }

    const percentageMargin = defaultTldSetting.percentageMargin;
    const fixedMargin = defaultTldSetting.fixedMargin;
    const roundOff = defaultTldSetting.roundOff;
    const marginType = defaultTldSetting.marginType;

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
      convertedPrice: undefined,
      exchangeRate: undefined,
      displayCurrency: undefined,
    };
  }, [defaultTldSetting]);

  // Direct batch pricing calculation
  const calculatePricesBatchDirect = React.useCallback(async (results: DomainSearchResult[]): Promise<DomainSearchResult[]> => {
    if (!defaultTldSetting || results.length === 0) {
      return results;
    }

    return Promise.all(results.map(async (result) => {
      if (result.status !== 'free' || !result.price?.reseller?.price) {
        return result;
      }

      const domain = result.domain;
      const originalPrice = result.price.reseller.price;
      const currency = result.price.reseller.currency || 'USD';

      // Calculate price with margins
      const calculated = calculatePriceDirect(domain, originalPrice, currency);
      
      // Add currency conversion if available and different from original currency
      if (isConversionAvailable && selectedCurrency !== currency) {
        try {
          const convertedPrices = await convertPricesBatch([{
            amount: calculated.finalPrice,
            currency: currency,
          }], selectedCurrency);
          
          if (convertedPrices.length > 0) {
            const converted = convertedPrices[0];
            (calculated as any).convertedPrice = converted.convertedAmount;
            (calculated as any).exchangeRate = converted.rate;
            (calculated as any).displayCurrency = selectedCurrency;
          }
        } catch (error) {
          console.error('Failed to convert price for domain:', domain, error);
          // Continue without conversion if it fails
        }
      }

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
  }, [defaultTldSetting, calculatePriceDirect, selectedCurrency, isConversionAvailable, convertPricesBatch]);

  // Process suggestions sequentially
  const processSuggestionsSequentially = React.useCallback(async (
    suggestions: AISuggestion[],
    activeTab: string,
    onProgressUpdate: (suggestionName: string, results: DomainSearchResult[], isComplete: boolean) => void,
    onError: (suggestionName: string, error: string) => void
  ) => {
    if (isProcessing) return; // Prevent multiple simultaneous processes
    
    setIsProcessing(true);
    setCurrentSuggestionIndex(0);
    setSuggestionResults({});
    setSuggestionErrors({});
    setProcessingQueue(suggestions);

    const extensions = getCurrentTabExtensions(activeTab);
    
    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i];
      setCurrentSuggestionIndex(i);
      
      try {
        // Check all extensions for this suggestion in a single API call
        const extensionsToCheck = extensions.map(ext => removeDotPrefix(ext));
        
        try {
          // Use tRPC client to check all extensions at once
          const result = await trpcClient.openProvider.domains.checkAvailability.fetch({
            name: suggestion.name,
            extensions: extensionsToCheck,
            with_price: true,
            with_whois: true,
          });
          
          const results: DomainSearchResult[] = [];
          
          if (result?.success && result?.data?.results) {
            // Process all results from the single API call
            for (let j = 0; j < result.data.results.length; j++) {
              const domainResult = result.data.results[j];
              const originalExtension = extensions[j];
              const domain = `${suggestion.name}${originalExtension}`;
              
              results.push({
                domain: domainResult.domain || domain,
                status: domainResult.status || 'unknown',
                reason: domainResult.reason || undefined,
                price: domainResult.price || undefined,
                whois: domainResult.whois || undefined,
              });
            }
          } else {
            // Fallback: create results for each extension
            for (const ext of extensions) {
              const domain = `${suggestion.name}${ext}`;
              results.push({
                domain,
                status: 'unknown',
                reason: 'Unable to check availability',
              });
            }
          }
          
          // Apply pricing calculations to the results
          const processedResults = await calculatePricesBatchDirect(results);
          
          // Update results for this suggestion
          setSuggestionResults(prev => ({
            ...prev,
            [activeTab]: {
              ...prev[activeTab],
              [suggestion.name]: processedResults
            }
          }));
          
          // Notify parent component
          onProgressUpdate(suggestion.name, processedResults, i === suggestions.length - 1);
          
        } catch (error) {
          console.error(`Error checking domains for ${suggestion.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Failed to check domains for ${suggestion.name}: ${errorMessage}`);
          
          // Create fallback results
          const fallbackResults: DomainSearchResult[] = extensions.map(ext => ({
            domain: `${suggestion.name}${ext}`,
            status: 'unknown',
            reason: `Error: ${errorMessage}`,
          }));
          
                  setSuggestionResults(prev => ({
                    ...prev,
                    [activeTab]: {
                      ...prev[activeTab],
                      [suggestion.name]: fallbackResults
                    }
                  }));
          
          onError(suggestion.name, errorMessage);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check domains';
        toast.error(`Failed to check domains for ${suggestion.name}: ${errorMessage}`);
        setSuggestionErrors(prev => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            [suggestion.name]: errorMessage
          }
        }));
        onError(suggestion.name, errorMessage);
      }
      
      // Add delay between suggestions to avoid overwhelming the API
      if (i < suggestions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 500ms since we're making single calls
      }
    }
    
    setIsProcessing(false);
    setProcessingQueue([]);
  }, [isProcessing, trpcClient, calculatePricesBatchDirect]);

  // Reset state
  const resetState = React.useCallback(() => {
    setIsProcessing(false);
    setCurrentSuggestionIndex(0);
    setSuggestionResults({});
    setSuggestionErrors({});
    setProcessingQueue([]);
  }, []);

  // Memoized getter functions to prevent unnecessary re-renders
  const getResults = React.useCallback((suggestionName: string, activeTab: string) => {
    return suggestionResults[activeTab]?.[suggestionName] || [];
  }, [suggestionResults]);

  const getError = React.useCallback((suggestionName: string, activeTab: string) => {
    return suggestionErrors[activeTab]?.[suggestionName];
  }, [suggestionErrors]);

  const isSuggestionComplete = React.useCallback((suggestionName: string, activeTab: string) => {
    return suggestionName in (suggestionResults[activeTab] || {});
  }, [suggestionResults]);

  const isSuggestionError = React.useCallback((suggestionName: string, activeTab: string) => {
    return suggestionName in (suggestionErrors[activeTab] || {});
  }, [suggestionErrors]);

  return {
    isProcessing,
    currentSuggestionIndex,
    suggestionResults,
    suggestionErrors,
    processingQueue,
    processSuggestionsSequentially,
    resetState,
    getResults,
    getError,
    isSuggestionComplete,
    isSuggestionError,
  };
}
