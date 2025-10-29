"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { useCartStore } from "@/stores/cart-store";
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
  getAllTldExtensions,
  removeDotPrefix
} from "@nPanel/utils";
import { useDomainPricing } from "./use-domain-pricing";
import type { DomainSearchResult } from "./domain-search";

export function useDomainSearch() {
  const [domainName, setDomainName] = React.useState("");
  const [debouncedDomainName, setDebouncedDomainName] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("popular");
  const [error, setError] = React.useState<string | null>(null);

  // Pricing hook
  const { calculatePricesBatch, isLoadingTldSettings, selectedCurrency } = useDomainPricing();

  // Cart store
  const addDomain = useCartStore(state => state.addDomain);
  const removeDomainByName = useCartStore(state => state.removeDomainByName);
  const cartItems = useCartStore(state => state.items);
  
  // Helper function to check if domain is in cart
  const isDomainInCart = React.useCallback((domainName: string) => {
    return cartItems.some(item => item.type === 'domain' && item.domain === domainName);
  }, [cartItems]);

  // Debounce domain name input to avoid excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDomainName(domainName);
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, [domainName]);

  // Domain search query
  const searchQuery = trpc.openProvider.domains.checkAvailability.useQuery(
    {
      name: debouncedDomainName,
      extensions: getCurrentTabExtensions(activeTab).map(removeDotPrefix),
      with_price: true,
      with_whois: true,
    },
    {
      enabled: debouncedDomainName.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    }
  );

  // Handle adding domain to cart
  const handleAddToCart = React.useCallback((result: DomainSearchResult) => {
    addDomain({
      domain: result.domain,
      status: result.status,
      price: result.price,
      addedInCurrency: selectedCurrency, // Store the currency that was active when added
    });
  }, [addDomain, selectedCurrency]);

  // Handle removing domain from cart
  const handleRemoveFromCart = React.useCallback((domain: string) => {
    removeDomainByName(domain);
  }, [removeDomainByName]);

  // Process search results with pricing calculations
  const [searchResults, setSearchResults] = React.useState<DomainSearchResult[]>([]);
  const [isProcessingResults, setIsProcessingResults] = React.useState(false);

  React.useEffect(() => {
    const processResults = async () => {
      if (!searchQuery.data?.success || !searchQuery.data.data?.results) {
        setSearchResults([]);
        return;
      }

      setIsProcessingResults(true);

      try {
        // First, map the raw results
        const rawResults = searchQuery.data.data.results.map((result: any) => ({
          domain: result.domain || 'unknown',
          status: result.status || 'unknown',
          reason: result.reason || '',
          price: result.price || undefined,
          whois: result.whois || undefined,
        }));

        // Then apply pricing calculations in batch for efficiency
        const processedResults = await calculatePricesBatch(rawResults);
        setSearchResults(processedResults);
      } catch (error) {
        console.error('Failed to process search results:', error);
        setSearchResults([]);
      } finally {
        setIsProcessingResults(false);
      }
    };

    processResults();
  }, [searchQuery.data, calculatePricesBatch, selectedCurrency]);

  return {
    domainName,
    setDomainName,
    activeTab,
    setActiveTab,
    error,
    setError,
    searchResults,
    isLoading: searchQuery.isLoading || isLoadingTldSettings || isProcessingResults,
    isError: searchQuery.isError,
    isDomainInCart,
    handleAddToCart,
    handleRemoveFromCart,
  };
}

// Helper function to get extensions for current tab using TLD utility
function getCurrentTabExtensions(tab: string): string[] {
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
}
