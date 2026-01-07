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

  // Cart store
  const addDomain = useCartStore(state => state.addDomain);
  const removeDomainByName = useCartStore(state => state.removeDomainByName);
  const cartItems = useCartStore(state => state.items);
  
  // Helper function to check if domain is in cart
  const isDomainInCart = React.useCallback((domainName: string) => {
    return cartItems.some(item => item.type === 'domain' && item.domain === domainName);
  }, [cartItems]);

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
  const extensions = React.useMemo(() => {
    return getCurrentTabExtensions(activeTab).map(removeDotPrefix);
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
        // First, map the raw results
        const rawResults = searchQuery.data.data.results.map((result: any) => ({
          domain: result.domain || 'unknown',
          status: result.status || 'unknown',
          reason: result.reason || '',
          price: result.price || undefined,
          whois: result.whois || undefined,
        }));

        // P0-3: Progressive rendering - process results in chunks and update UI incrementally
        const CHUNK_SIZE = 10; // Process 10 domains at a time
        const chunks: DomainSearchResult[][] = [];
        
        for (let i = 0; i < rawResults.length; i += CHUNK_SIZE) {
          chunks.push(rawResults.slice(i, i + CHUNK_SIZE));
        }

        // Process chunks sequentially and update UI after each chunk
        const allProcessedResults: DomainSearchResult[] = [];
        for (const chunk of chunks) {
          const processedChunk = await calculatePricesBatch(chunk);
          allProcessedResults.push(...processedChunk);
          // P3-12: Use transition for non-urgent UI updates
          startTransition(() => {
            setSearchResults([...allProcessedResults]);
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
    triggerSearch,
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

