"use client";

import * as React from "react";
import { useTransition } from "react";
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
// Shared domain search result type
export interface DomainSearchResult {
  domain: string;
  status: string;
  reason?: string;
  price?: {
    product: {
      price: number;
      currency: string;
    };
    reseller: {
      price: number;
      currency: string;
    };
    calculated?: {
      originalPrice: number;
      marginAmount: number;
      finalPrice: number;
      currency: string;
      marginType: string | null;
      marginValue: string | null;
      convertedPrice?: number;
      exchangeRate?: number;
      displayCurrency?: string;
    };
  };
  whois?: {
    registrant?: string;
    registrar?: string;
    creation_date?: string;
    expiration_date?: string;
  };
}

// Currency context interface - shared between agency and customer
export interface CurrencyContext {
  selectedCurrency: string;
  isConversionAvailable: boolean;
  convertPricesBatch: (prices: Array<{ amount: number; currency: string }>, targetCurrency: string) => Promise<any[]>;
}

// Pricing hook interface
export interface DomainPricingHook {
  calculatePricesBatch: (results: DomainSearchResult[]) => Promise<DomainSearchResult[]>;
  isLoadingTldSettings: boolean;
  selectedCurrency: string;
}

// Stable selector function outside component to prevent recreation
const selectCartDomainNames = (state: ReturnType<typeof useCartStore.getState>) => {
  const domainNames: string[] = [];
  for (const item of state.items) {
    if (item.type === 'domain' && (item as any).domain) {
      domainNames.push((item as any).domain);
    }
  }
  // Return sorted, comma-separated string for stable comparison
  return domainNames.sort().join(',');
};

export function useDomainSearch(
  currencyContext: CurrencyContext,
  pricingHook: DomainPricingHook
) {
  const [domainName, setDomainName] = React.useState("");
  const [searchQueryName, setSearchQueryName] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("popular");
  const [error, setError] = React.useState<string | null>(null);

  // Pricing hook (passed as parameter)
  const { calculatePricesBatch, isLoadingTldSettings, selectedCurrency } = pricingHook;

  // Cart store - OPTIMIZED: Use selector to avoid re-renders on unrelated cart changes
  const addDomain = useCartStore(state => state.addDomain);
  const removeDomainByName = useCartStore(state => state.removeDomainByName);
  
  // OPTIMIZATION: Use stable selector defined outside component to prevent infinite loops
  // Zustand will cache the result when the underlying state hasn't changed
  const cartDomainNamesHash = useCartStore(selectCartDomainNames);
  
  // OPTIMIZATION: Use Set for O(1) lookup - memoized from stable hash string
  const cartDomainSet = React.useMemo(() => {
    if (!cartDomainNamesHash) return new Set<string>();
    const names = cartDomainNamesHash.split(',').filter(Boolean);
    return new Set(names);
  }, [cartDomainNamesHash]);
  
  // Helper function to check if domain is in cart - O(1) lookup
  const isDomainInCart = React.useCallback((domainName: string) => {
    return cartDomainSet.has(domainName);
  }, [cartDomainSet]);

  /**
   * Sanitize domain name input by removing:
   * - www. prefix
   * - TLD extensions (.com, .org, .net, etc.)
   * - Any protocol (http://, https://)
   * - Trailing slashes
   * @param input - Raw domain input from user
   * @returns Sanitized domain name ready for API
   */
  const sanitizeDomainName = React.useCallback((input: string): string => {
    let sanitized = input.trim().toLowerCase();
    
    // Remove protocol if present
    sanitized = sanitized.replace(/^https?:\/\//, '');
    
    // Remove trailing slashes
    sanitized = sanitized.replace(/\/+$/, '');
    
    // Remove www. prefix (case insensitive)
    sanitized = sanitized.replace(/^www\./i, '');
    
    // Remove TLD extension if present
    // Match common TLD patterns: .com, .org, .net, .io, .co.uk, etc.
    // This regex matches a dot followed by 2-63 characters (valid TLD length)
    // and ensures it's at the end of the string
    sanitized = sanitized.replace(/\.[a-z0-9-]{2,63}$/i, '');
    
    return sanitized.trim();
  }, []);

  // Trigger search manually (called by search button)
  const triggerSearch = React.useCallback(() => {
    if (domainName.trim()) {
      const sanitized = sanitizeDomainName(domainName);
      if (sanitized) {
        setSearchQueryName(sanitized);
      }
    }
  }, [domainName, sanitizeDomainName]);

  // Note: Tab changes automatically trigger search because:
  // - When activeTab changes, extensions change
  // - Query key includes extensions, so React Query automatically refetches

  // Memoize extensions to prevent unnecessary query refetches
  // PERFORMANCE: Include promotional extensions in the main query to batch all requests
  const extensions = React.useMemo(() => {
    const tabExtensions = getCurrentTabExtensions(activeTab).map(removeDotPrefix);
    // Add promotional extensions if not already included (ai, com, info, online)
    const promotionalExtensions = ['ai', 'com', 'info', 'online'];
    const allExtensions = [...new Set([...tabExtensions, ...promotionalExtensions])];
    return allExtensions;
  }, [activeTab]);

  // Domain search query
  // P1-5: Make whois optional - set to false by default for faster responses (20-40% faster)
  // Whois data can be loaded on-demand when user views domain details
  // P3-13: Request deduplication handled by React Query via query keys
  // FIX: Query key includes extensions, so it will refetch when tab changes
  const searchQuery = trpc.openProvider.domains.checkAvailability.useQuery(
    {
      name: searchQueryName,
      extensions: extensions,
      with_price: true,
      with_whois: false, // Lazy load whois data when needed
    },
    {
      enabled: searchQueryName.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      // FIX: Don't use placeholderData - we want to see loading state when switching tabs
      // This ensures the query refetches when extensions change
      // P3-13: Ensure proper deduplication - React Query automatically deduplicates based on query key
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

  // P3-12: Use transition for non-urgent state updates to reduce blocking renders
  const [isPending, startTransition] = useTransition();
  
  // Process search results with pricing calculations
  const [searchResults, setSearchResults] = React.useState<DomainSearchResult[]>([]);
  const [isProcessingResults, setIsProcessingResults] = React.useState(false);
  const lastProcessedRef = React.useRef<{
    currency: string | null;
    dataHash: string | null;
    extensionsKey: string | null;
  }>({ currency: null, dataHash: null, extensionsKey: null });
  
  // PERFORMANCE: Cache promotional results separately by searchQueryName
  // This ensures promotional cards don't show loaders when switching tabs
  const promotionalResultsCacheRef = React.useRef<{
    searchQuery: string;
    results: { ai: any; com: any; info: any; online: any };
  } | null>(null);

  React.useEffect(() => {
    const processResults = async () => {
      if (!searchQuery.data?.success || !searchQuery.data.data?.results) {
        setSearchResults([]);
        lastProcessedRef.current = { currency: null, dataHash: null, extensionsKey: null };
        return;
      }

      // P1-4: Optimized hash calculation - faster than JSON.stringify
      // Only hash essential fields to detect changes
      const dataHash = searchQuery.data.data.results
        .map((r: any) => `${r.domain}:${r.status}:${r.price?.reseller?.price || 0}:${r.price?.reseller?.currency || 'USD'}`)
        .join('|');

      // Create extensions key to detect tab changes
      const extensionsKey = extensions.sort().join(',');

      // Skip processing if data, currency, and extensions haven't changed
      const hasChanged = dataHash !== lastProcessedRef.current.dataHash || 
                        selectedCurrency !== lastProcessedRef.current.currency ||
                        extensionsKey !== lastProcessedRef.current.extensionsKey;

      if (!hasChanged) {
        // Data, currency, and extensions haven't changed, no need to reprocess
        return;
      }

      setIsProcessingResults(true);
      setSearchResults([]); // Clear previous results for progressive rendering

      try {
        // Get tab extensions for filtering promotional domains
        const tabExtensions = getCurrentTabExtensions(activeTab).map(removeDotPrefix);
        
        // First, map the raw results
        const rawResults = searchQuery.data.data.results.map((result: any) => ({
          domain: result.domain || 'unknown',
          status: result.status || 'unknown',
          reason: result.reason || '',
          price: result.price || undefined,
          whois: result.whois || undefined,
        }));

        // P0-3: Progressive rendering - process results in chunks and update UI incrementally
        // OPTIMIZATION: Limit max results to prevent memory issues (500 domains max)
        const MAX_RESULTS = 500;
        const limitedResults = rawResults.slice(0, MAX_RESULTS);
        
        const CHUNK_SIZE = 10; // Process 10 domains at a time
        const chunks: DomainSearchResult[][] = [];
        
        for (let i = 0; i < limitedResults.length; i += CHUNK_SIZE) {
          chunks.push(limitedResults.slice(i, i + CHUNK_SIZE));
        }

        // Process chunks sequentially and update UI after each chunk
        // OPTIMIZATION: Use functional update to avoid copying entire array each time
        const allProcessedResults: DomainSearchResult[] = [];
        
        // PERFORMANCE: Filter out promotional extensions from main results (they're shown separately)
        const promotionalExtensions = ['ai', 'info', 'online']; // .com is kept if in active tab
        
        for (const chunk of chunks) {
          const processedChunk = await calculatePricesBatch(chunk);
          // Filter out promotional domains from main results (keep .com if it's in active tab)
          const filteredChunk = processedChunk.filter(result => {
            const extension = result.domain.split('.').pop()?.toLowerCase();
            // Keep .com if it's part of the active tab, otherwise filter out promotional extensions
            if (extension === 'com' && tabExtensions.includes('com')) {
              return true; // Keep .com if it's part of the active tab
            }
            return !promotionalExtensions.includes(extension || '');
          });
          allProcessedResults.push(...filteredChunk);
          // P3-12: Use transition for non-urgent UI updates
          // OPTIMIZATION: Only copy when necessary, use functional update
          startTransition(() => {
            setSearchResults(prev => {
              // Only update if we have new results
              if (allProcessedResults.length > prev.length) {
                return [...allProcessedResults];
              }
              return prev;
            });
          });
        }

        lastProcessedRef.current = { 
          currency: selectedCurrency, 
          dataHash,
          extensionsKey,
        };
      } catch (error) {
        console.error('Failed to process search results:', error);
        setSearchResults([]);
      } finally {
        setIsProcessingResults(false);
      }
    };

    processResults();
  }, [searchQuery.data, calculatePricesBatch, selectedCurrency, extensions]); // Include extensions in deps

  // PERFORMANCE: Extract and cache promotional results separately by searchQueryName
  // This ensures promotional cards persist across tab switches and don't show loaders unnecessarily
  const promotionalResults = React.useMemo(() => {
    const promotionalExtensions = ['ai', 'com', 'info', 'online'];
    const defaultResults: { ai: any; com: any; info: any; online: any } = {
      ai: null,
      com: null,
      info: null,
      online: null,
    };

    // If searchQueryName changed, clear cache (promotional cards need new data)
    if (promotionalResultsCacheRef.current?.searchQuery !== searchQueryName) {
      promotionalResultsCacheRef.current = null;
    }

    // If we have cached results for this searchQueryName, return them (even when query is loading/switching tabs)
    if (promotionalResultsCacheRef.current && promotionalResultsCacheRef.current.searchQuery === searchQueryName) {
      return promotionalResultsCacheRef.current.results;
    }

    // Extract from raw API response, not processed searchResults
    const results = { ...defaultResults };
    if (searchQuery.data?.data?.results && searchQueryName) {
      searchQuery.data.data.results.forEach((result: any) => {
        const extension = result.domain?.split('.').pop()?.toLowerCase();
        if (extension && promotionalExtensions.includes(extension)) {
          results[extension as keyof typeof results] = result;
        }
      });

      // Cache the results for this searchQueryName
      promotionalResultsCacheRef.current = {
        searchQuery: searchQueryName,
        results,
      };
    }

    return results;
  }, [searchQuery.data, searchQueryName]);
  
  // Determine if promotional cards should show loading state
  // Only show loading if we don't have cached results for this searchQueryName
  const isPromotionalLoading = React.useMemo(() => {
    // If we have cached results for this searchQueryName, never show loading
    if (promotionalResultsCacheRef.current?.searchQuery === searchQueryName) {
      return false;
    }
    // Otherwise, show loading if main query is loading AND we have a search query
    return searchQuery.isLoading && searchQueryName.length > 0;
  }, [searchQuery.isLoading, searchQueryName]);

  return {
    domainName,
    setDomainName,
    searchQueryName, // Expose sanitized query for promotional cards
    activeTab,
    setActiveTab,
    error,
    setError,
    searchResults,
    promotionalResults, // Expose promotional results from main query (cached by searchQueryName)
    isPromotionalLoading, // Separate loading state for promotional cards (only true if no cached data)
    isLoading: searchQuery.isLoading || isLoadingTldSettings || isProcessingResults,
    isError: searchQuery.isError,
    isDomainInCart,
    handleAddToCart,
    handleRemoveFromCart,
    triggerSearch,
    sanitizeDomainName, // Expose sanitization function
  };
}

// P3-11: Pre-computed extension arrays for better performance (memoized)
const EXTENSION_CACHE = new Map<string, string[]>();

function getCurrentTabExtensions(tab: string): string[] {
  // Check cache first
  if (EXTENSION_CACHE.has(tab)) {
    return EXTENSION_CACHE.get(tab)!;
  }

  let extensions: string[];
  switch (tab) {
    case "popular": 
      extensions = getPopularTlds().map(ext => `.${ext}`);
      break;
    case "business": 
      extensions = getBusinessTlds().map(ext => `.${ext}`);
      break;
    case "education": 
      extensions = getEducationTlds().map(ext => `.${ext}`);
      break;
    case "international": 
      extensions = getInternationalTlds().map(ext => `.${ext}`);
      break;
    case "technology": 
      extensions = getTechnologyTlds().map(ext => `.${ext}`);
      break;
    case "socialpersonal": 
      extensions = getSocialPersonalTlds().map(ext => `.${ext}`);
      break;
    case "professionalservices": 
      extensions = getProfessionalServicesTlds().map(ext => `.${ext}`);
      break;
    case "mediaentertainment": 
      extensions = getMediaEntertainmentTlds().map(ext => `.${ext}`);
      break;
    case "ecommerceshopping": 
      extensions = getEcommerceShoppingTlds().map(ext => `.${ext}`);
      break;
    case "industrysector": 
      extensions = getIndustrySectorTlds().map(ext => `.${ext}`);
      break;
    case "lifestylehobbies": 
      extensions = getLifestyleHobbiesTlds().map(ext => `.${ext}`);
      break;
    case "countrycodes": 
      extensions = getCountryCodeTlds().map(ext => `.${ext}`);
      break;
    default: 
      extensions = getPopularTlds().map(ext => `.${ext}`);
  }

  // Cache the result
  EXTENSION_CACHE.set(tab, extensions);
  return extensions;
}

