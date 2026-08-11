"use client";

import * as React from "react";
import { AlertCircle, ShoppingCart, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/utils/trpc";
import { useCartStore } from "@/stores/cart-store";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { useCurrency } from "../../agency.domains/_components/currency-context";
import { CurrencyProvider } from "../../agency.domains/_components/currency-context";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import { getPopularTlds } from "@/utils";
import { captureEvent } from "@/lib/posthog";

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

  // Process results directly using useMemo - no useEffect for better performance
  const rawResults = React.useMemo(() => {
    if (!searchData?.success || !searchData?.data?.results) {
      return [];
    }
    return searchData.data.results.map((result: any) => ({
      domain: result.domain || 'unknown',
      status: result.status || 'unknown',
      reason: result.reason || '',
      price: result.price || undefined,
      whois: result.whois || undefined,
    }));
  }, [searchData?.success, searchData?.data?.results]);

  // Create processing promise - memoized to avoid recreating
  const processingPromiseRef = React.useRef<Promise<DomainSearchResult[]> | null>(null);
  const processingKeyRef = React.useRef<string>("");

  // Create a stable key for processing
  const processingKey = React.useMemo(() => {
    if (!searchData?.success || !searchData?.data?.results || rawResults.length === 0) {
      return "";
    }
    const dataHash = searchData.data.results
      .map((r: any) => `${r.domain}:${r.status}:${r.price?.reseller?.price || 0}:${r.price?.reseller?.currency || 'USD'}`)
      .join('|');
    return `${dataHash}:${currencyContext.selectedCurrency}`;
  }, [searchData?.success, searchData?.data?.results, currencyContext.selectedCurrency, rawResults.length]);

  // Process results using useMemo to create promise, then unwrap with React.use()
  const processedResultsPromise = React.useMemo(() => {
    // Don't process if dependencies aren't ready
    if (pricingHook.isLoadingTldSettings || currencyContext.isLoadingRates) {
      return null;
    }

    if (rawResults.length === 0) {
      return null;
    }

    // If we already have a promise for this key, return it
    if (processingPromiseRef.current && processingKeyRef.current === processingKey) {
      return processingPromiseRef.current;
    }

    // Create new promise
    const promise = pricingHook.calculatePricesBatch(rawResults);
    processingPromiseRef.current = promise;
    processingKeyRef.current = processingKey;
    return promise;
  }, [
    rawResults,
    pricingHook.calculatePricesBatch,
    pricingHook.isLoadingTldSettings,
    currencyContext.isLoadingRates,
    processingKey,
  ]);

  // Use React.use() to unwrap promise synchronously - no useEffect needed
  // React.use() will throw the promise if pending (for Suspense), or return the value if resolved
  const processedResults: DomainSearchResult[] = processedResultsPromise 
    ? React.use(processedResultsPromise) 
    : [];
  
  const isProcessingResults = processedResultsPromise !== null && processedResults.length === 0 && rawResults.length > 0;

  // Handle adding domain to cart
  const handleAddToCart = React.useCallback((result: DomainSearchResult) => {
    addDomain({
      domain: result.domain,
      status: result.status,
      price: result.price,
      addedInCurrency: currencyContext.selectedCurrency,
    });
    const parts = result.domain.toLowerCase().split(".");
    const tld = parts.length >= 2 ? `.${parts.slice(1).join(".")}` : undefined;
    const calculated = result.price?.calculated;
    const price =
      calculated?.convertedPrice ??
      calculated?.finalPrice ??
      result.price?.reseller?.price ??
      result.price?.product?.price;
    const currency =
      calculated?.displayCurrency ??
      calculated?.currency ??
      result.price?.reseller?.currency ??
      result.price?.product?.currency ??
      currencyContext.selectedCurrency;
    captureEvent("domain_added_to_cart", {
      ...(tld ? { tld } : {}),
      ...(price != null && Number.isFinite(price) ? { price } : {}),
      ...(currency ? { currency } : {}),
    });
    captureEvent("storefront_cart_item_added", {
      item_type: "domain",
      ...(tld ? { tld } : {}),
      ...(price != null && Number.isFinite(price) ? { price } : {}),
      ...(currency ? { currency } : {}),
    });
  }, [addDomain, currencyContext.selectedCurrency]);

  // Handle removing domain from cart
  const handleRemoveFromCart = React.useCallback((domain: string) => {
    removeDomainByName(domain);
  }, [removeDomainByName]);

  // Format price helper
  const formatPrice = React.useCallback((price?: number, currency?: string) => {
    if (!price) return "N/A";

    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'KES': 'KSh',
      'EUR': '€',
      'GBP': ' ?',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': ' ?',
      'INR': '₹',
      'ZAR': 'R',
      'NGN': '₦',
    };

    const symbol = currencySymbols[currency || 'USD'] || currency || '$';
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
    
    return `${symbol} ${formattedNumber}`;
  }, []);

  const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
  const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, {
    enabled: isActive,
  });

  const handleBuyNow = React.useCallback(
    (result: DomainSearchResult) => {
      if (!domainsProductId) {
        return;
      }
      openForProduct({
        productId: domainsProductId,
        productName: "Domains",
        domain: result,
      });
    },
    [domainsProductId, openForProduct],
  );

  // Show loading until all data is ready: domain search, TLD settings, exchange rates, and price processing
  const isLoadingResults = isLoading || 
                          isProcessingResults || 
                          pricingHook.isLoadingTldSettings || 
                          currencyContext.isLoadingRates;
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
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Domain Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: BRAND_PROTECTION_TLDS.length }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="pl-6">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : processedResults.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Domain Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedResults.map((result, index) => {
                  const calculated = result.price?.calculated;
                  const displayPrice = calculated
                    ? ((calculated as any).convertedPrice ?? calculated.finalPrice)
                    : result.price?.reseller?.price;
                  const displayCurrency = calculated
                    ? ((calculated as any).displayCurrency ?? calculated.currency)
                    : result.price?.reseller?.currency;
                  const isInCart = isDomainInCart(result.domain);
                  const isAvailable = result.status === 'free';

                  return (
                    <TableRow key={`${result.domain}-${index}`}>
                      <TableCell className="pl-6 font-medium">
                        {result.domain}
                      </TableCell>
                      <TableCell>
                        {isAvailable && displayPrice ? (
                          <span className="text-sm font-bold text-primary">
                            {formatPrice(displayPrice, displayCurrency)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isAvailable ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleBuyNow(result)}
                                className="text-xs"
                              >
                                Buy Now
                              </Button>
                              <Button
                                size="sm"
                                variant={isInCart ? "destructive" : "outline"}
                                onClick={() => {
                                  if (isInCart) {
                                    handleRemoveFromCart(result.domain);
                                  } else {
                                    handleAddToCart(result);
                                  }
                                }}
                                className="h-8 w-8 p-0"
                                title={isInCart ? "Remove from cart" : "Add to cart"}
                              >
                                {isInCart ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <ShoppingCart className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="text-xs"
                            >
                              Not Available
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
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

