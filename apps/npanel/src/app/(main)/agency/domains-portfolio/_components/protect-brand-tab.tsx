"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DomainResultCard } from "../../domains/_components/domain-result-card";
import { trpc } from "@/utils/trpc";
import { useCartStore } from "@/stores/cart-store";
import { useCurrency } from "../../domains/_components/currency-context";
import { CurrencyProvider } from "../../domains/_components/currency-context";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import { getPopularTlds } from "@nPanel/utils";

// Popular TLDs for brand protection - using popular TLDs from utils
const BRAND_PROTECTION_TLDS = getPopularTlds().map(ext => `.${ext}`);

interface ProtectBrandTabProps {
  domainNameWithoutTld: string;
  isActive?: boolean;
}

function ProtectBrandTabContent({ domainNameWithoutTld, isActive = true }: ProtectBrandTabProps) {
  // All hooks at the top level
  const currencyContext = useCurrency();
  const pricingHook = useDomainPricing({
    selectedCurrency: currencyContext.selectedCurrency,
    isConversionAvailable: currencyContext.isConversionAvailable,
    convertPricesBatch: currencyContext.convertPricesBatch,
  });

  // Cart store hooks
  const addDomain = useCartStore((state) => state.addDomain);
  const removeDomainByName = useCartStore((state) => state.removeDomainByName);
  const cartDomainNamesHash = useCartStore((state) => {
    const domainNames: string[] = [];
    for (const item of state.items) {
      if (item.type === 'domain' && (item as any).domain) {
        domainNames.push((item as any).domain);
      }
    }
    return domainNames.sort().join(',');
  });

  // Direct tRPC query for domain availability
  const { data: searchData, isLoading, error } = trpc.openProvider.domains.checkAvailability.useQuery(
    {
      name: domainNameWithoutTld,
      extensions: BRAND_PROTECTION_TLDS,
      with_price: true,
      with_whois: false,
    },
    {
      enabled: isActive && domainNameWithoutTld.trim().length > 0,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Memoize cart domain set
  const cartDomainSet = React.useMemo(() => {
    if (!cartDomainNamesHash) return new Set<string>();
    const names = cartDomainNamesHash.split(',').filter(Boolean);
    return new Set(names);
  }, [cartDomainNamesHash]);

  const isDomainInCart = React.useCallback((domainName: string) => {
    return cartDomainSet.has(domainName);
  }, [cartDomainSet]);

  // Process and calculate prices for results
  const [processedResults, setProcessedResults] = React.useState<DomainSearchResult[]>([]);
  const [isProcessingResults, setIsProcessingResults] = React.useState(false);
  const lastProcessedDataHash = React.useRef<string>("");
  const calculatePricesBatchRef = React.useRef(pricingHook.calculatePricesBatch);

  // Update ref when function changes
  React.useEffect(() => {
    calculatePricesBatchRef.current = pricingHook.calculatePricesBatch;
  }, [pricingHook.calculatePricesBatch]);

  // Create a stable data hash to track when we need to reprocess
  const searchDataHash = React.useMemo(() => {
    if (!searchData?.success || !searchData?.data?.results) return "";
    // Create a hash from the results data
    return JSON.stringify(searchData.data.results.map((r: any) => ({
      domain: r.domain,
      status: r.status,
      price: r.price,
    })));
  }, [searchData?.success, searchData?.data?.results]);

  // Process results only when data actually changes
  React.useEffect(() => {
    if (!searchData?.success || !searchData?.data?.results) {
      setProcessedResults([]);
      lastProcessedDataHash.current = "";
      return;
    }

    // Skip if we've already processed this data
    if (lastProcessedDataHash.current === searchDataHash && searchDataHash !== "") {
      return;
    }

    let cancelled = false;

    const processResults = async () => {
      setIsProcessingResults(true);

      try {
        // Map raw results to DomainSearchResult format
        const rawResults: DomainSearchResult[] = searchData.data.results.map((result: any) => ({
          domain: result.domain || 'unknown',
          status: result.status || 'unknown',
          reason: result.reason || '',
          price: result.price || undefined,
          whois: result.whois || undefined,
        }));

        // Calculate prices with margins and currency conversion using ref
        const processed = await calculatePricesBatchRef.current(rawResults);
        
        if (!cancelled) {
          setProcessedResults(processed);
          lastProcessedDataHash.current = searchDataHash;
        }
      } catch (error) {
        console.error('Error processing domain results:', error);
        if (!cancelled) {
          setProcessedResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsProcessingResults(false);
        }
      }
    };

    processResults();

    return () => {
      cancelled = true;
    };
  }, [searchDataHash, searchData]);

  // Handle adding domain to cart
  const handleAddToCart = React.useCallback((result: DomainSearchResult) => {
    addDomain({
      domain: result.domain,
      status: result.status,
      price: result.price,
      addedInCurrency: currencyContext.selectedCurrency,
    });
  }, [addDomain, currencyContext.selectedCurrency]);

  // Handle removing domain from cart
  const handleRemoveFromCart = React.useCallback((domain: string) => {
    removeDomainByName(domain);
  }, [removeDomainByName]);

  const isLoadingResults = isLoading || isProcessingResults || pricingHook.isLoadingTldSettings;
  const errorMessage = error?.message || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Protect your brand</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Secure your brand name with different domain extensions.
        </p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : isLoadingResults ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: BRAND_PROTECTION_TLDS.length }).map((_, index) => (
            <div key={index} className="flex flex-col p-3 bg-card border border-border rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-7 w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : processedResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {processedResults.map((result, index) => (
            <DomainResultCard
              key={`${result.domain}-${index}`}
              result={result}
              isDomainInCart={isDomainInCart}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg mb-2">No domains found</div>
          <div className="text-muted-foreground/70 text-sm">
            Try searching with a different domain name.
          </div>
        </div>
      )}
    </div>
  );
}

export function ProtectBrandTab({ domainNameWithoutTld, isActive = true }: ProtectBrandTabProps) {
  return (
    <CurrencyProvider>
      <ProtectBrandTabContent domainNameWithoutTld={domainNameWithoutTld} isActive={isActive} />
    </CurrencyProvider>
  );
}
