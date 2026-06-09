"use client";

import * as React from "react";
import { Gift, ShoppingCart, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { trpc } from "@/utils/trpc";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import { useCurrency } from "./currency-context";
import { getCustomerRetailDisplayPrice } from "./customer-domain-display-price";
import { createDomainBundleCheckoutContext, formatDomainBundleLabel, getDomainResultsBasePrices } from "@/lib/domain-bundle-checkout";
import { useBundleTotalKes } from "@/hooks/use-bundle-total-kes";

interface PromotionalCardsProps {
  searchQuery: string;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  isDomainInCart: (domain: string) => boolean;
  isLoading?: boolean;
  // PERFORMANCE: Use promotional results from main query instead of separate API call
  promotionalResults?: {
    ai: any;
    com: any;
    info: any;
    online: any;
    queryTldResult?: any;
    queryTldParsed?: { name: string; extension: string };
  };
}

const formatPrice = (price?: number, currency?: string) => {
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
};

/**
 * Sanitize domain name input by removing:
 * - www. prefix
 * - TLD extensions (.com, .org, .net, etc.)
 * - Any protocol (http://, https://)
 * - Trailing slashes
 * @param input - Raw domain input from user
 * @returns Sanitized domain name ready for API
 */
function sanitizeDomainName(input: string): string {
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
}

// Search TLD card: shown only when the search query contained a valid TLD (e.g. example.com, example.co.ke).
// Displays the result for that exact domain (available or not).
function SearchTldCard({
  queryTldParsed,
  queryTldResult,
  onAddToCart,
  onRemoveFromCart,
  isDomainInCart,
  isLoadingTld,
}: Omit<PromotionalCardsProps, 'searchQuery'> & {
  queryTldParsed: { name: string; extension: string };
  queryTldResult: any;
  isLoadingTld: boolean;
}) {
  const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
  const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, { enabled: true });
  const currencyContext = useCurrency();
  const pricingHook = useDomainPricing(currencyContext);
  const { calculatePricesBatch, hasDefaultSetting, isLoadingTldSettings } = pricingHook;
  const retailPricingReady = !isLoadingTldSettings && hasDefaultSetting;
  const domain = `${queryTldParsed.name}.${queryTldParsed.extension}`;
  const isInCart = isDomainInCart(domain);

  const rawResult = React.useMemo(() => {
    if (!queryTldResult || queryTldResult.status !== 'free' || !queryTldResult.price?.reseller) return null;
    return {
      domain,
      status: queryTldResult.status,
      price: {
        product: queryTldResult.price?.product,
        reseller: queryTldResult.price?.reseller,
      },
      reason: `Result for your search: ${domain}`,
    } as DomainSearchResult;
  }, [queryTldResult, domain]);

  const pricedResultRef = React.useRef<DomainSearchResult | null>(null);
  const [pricedResult, setPricedResult] = React.useState<DomainSearchResult | null>(null);
  const pricingKeyRef = React.useRef<string>('');

  React.useEffect(() => {
    if (!rawResult || !calculatePricesBatch) {
      setPricedResult(null);
      pricedResultRef.current = null;
      return;
    }
    const key = `${rawResult.domain}-${rawResult.status}-${rawResult.price?.reseller?.price ?? 0}`;
    if (pricingKeyRef.current === key && pricedResultRef.current) return;
    pricingKeyRef.current = key;
    calculatePricesBatch([rawResult]).then(([priced]) => {
      pricedResultRef.current = priced;
      setPricedResult(priced);
    }).catch(() => setPricedResult(rawResult));
  }, [rawResult, calculatePricesBatch]);

  const displayResult = pricedResult || rawResult;
  const isAvailable = rawResult != null;
  const retail = displayResult && rawResult ? getCustomerRetailDisplayPrice(displayResult) : { displayPrice: undefined as number | undefined, displayCurrency: undefined as string | undefined };
  const displayPrice = retail.displayPrice;
  const displayCurrency = retail.displayCurrency;
  const priceReady =
    retailPricingReady &&
    isAvailable &&
    displayPrice != null &&
    displayCurrency != null &&
    !Number.isNaN(displayPrice);

  const handleCartAction = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!displayResult?.domain) return;
    if (isInCart) onRemoveFromCart(domain);
    else if (priceReady) onAddToCart(displayResult);
  };

  if (isLoadingTld) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <Badge className={isAvailable
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
            : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
          }>
            {isAvailable ? "Available" : "Not available"}
          </Badge>
        </div>

        <div className="mb-3">
          <h3 className="text-lg font-bold text-card-foreground mb-2">
            {domain}
          </h3>

          {isAvailable && priceReady && (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-card-foreground">
                {formatPrice(displayPrice!, displayCurrency!)}/1st yr
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          {isAvailable ? (
            <>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>Claim the exact domain you searched for ?? secure your brand and start building your online presence today.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>Get a professional web address that matches what your audience is already typing.</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>Your search included .{queryTldParsed.extension} ?? this domain is not available.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>Try a different extension or variation ?? we have hundreds of TLDs to help you find the perfect match.</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          {isAvailable && displayResult ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e?.preventDefault();
                  e?.stopPropagation();
                  if (domainsProductId && displayResult) openForProduct({ productId: domainsProductId, productName: "Domains", domain: displayResult });
                }}
                className="px-4"
                disabled={!domainsProductId || !priceReady}
              >
                Buy Now
              </Button>
              <Button
                size="sm"
                variant={isInCart ? "destructive" : "outline"}
                onClick={handleCartAction}
                className="h-9 w-9 p-0"
                disabled={!priceReady && !isInCart}
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
            <Button size="sm" variant="outline" className="px-4" disabled>
              Try another extension
            </Button>
          )}
        </div>
      </div>

    </>
  );
}

// Bundle Card Component
function BundleCard({ 
  searchQuery, 
  bundleData,
  isLoadingBundle 
}: { 
  searchQuery: string;
  bundleData: { com: any; info: any; online: any };
  isLoadingBundle: boolean;
}) {
  const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
  const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, {
    enabled: true,
  });
  const currencyContext = useCurrency();

  // Process bundle domains from batched data - only show if ALL are available
  const bundleResults = React.useMemo(() => {
    const results: DomainSearchResult[] = [];
    
    // Check if all required domains are available
    // .com, .info, .online must all be 'free', .co.ke is always available (hardcoded)
    const comAvailable = bundleData.com && bundleData.com.status === 'free' && bundleData.com.price?.reseller;
    const infoAvailable = bundleData.info && bundleData.info.status === 'free' && bundleData.info.price?.reseller;
    const onlineAvailable = bundleData.online && bundleData.online.status === 'free' && bundleData.online.price?.reseller;
    
    // If ANY domain is not available, return empty array (card won't be shown)
    if (!comAvailable || !infoAvailable || !onlineAvailable) {
      return [];
    }
    
    // All domains are available, add them to results
    if (comAvailable) {
      results.push({
        domain: `${searchQuery}.com`,
        status: bundleData.com.status,
        price: {
          product: bundleData.com.price.product,
          reseller: bundleData.com.price.reseller,
        },
      } as DomainSearchResult);
    }

    if (infoAvailable) {
      results.push({
        domain: `${searchQuery}.info`,
        status: bundleData.info.status,
        price: {
          product: bundleData.info.price.product,
          reseller: bundleData.info.price.reseller,
        },
      } as DomainSearchResult);
    }

    if (onlineAvailable) {
      results.push({
        domain: `${searchQuery}.online`,
        status: bundleData.online.status,
        price: {
          product: bundleData.online.price.product,
          reseller: bundleData.online.price.reseller,
        },
      } as DomainSearchResult);
    }

    // Add .co.ke with fixed price (499.00 KES) - always available
    results.push({
      domain: `${searchQuery}.co.ke`,
      status: 'free',
      price: {
        product: { price: 499.00, currency: 'KES' },
        reseller: { price: 499.00, currency: 'KES' },
      },
    } as DomainSearchResult);

    return results;
  }, [bundleData, searchQuery]);

  const bundleBasePrices = React.useMemo(
    () => getDomainResultsBasePrices(bundleResults),
    [bundleResults],
  );
  const bundleTotalKes = useBundleTotalKes(bundleBasePrices, currencyContext.convertPricesBatch);

  const handleGetDeal = () => {
    if (!domainsProductId || bundleTotalKes == null || bundleResults.length === 0) return;
    openForProduct({
      productId: domainsProductId,
      productName: "Domains",
      domainBundle: createDomainBundleCheckoutContext({
        domains: bundleResults,
        bundlePrice: bundleTotalKes,
        bundleCurrency: "KES",
        bundleLabel: formatDomainBundleLabel(bundleResults.map((d) => d.domain)),
      }),
    });
  };

  if (isLoadingBundle) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (bundleResults.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
            Bundle & save
          </Badge>
        </div>

        <div className="mb-3">
          <h3 className="text-lg font-bold text-card-foreground mb-2">
            {searchQuery}.<span className="text-purple-600 dark:text-purple-400">com</span> + .<span className="text-purple-600 dark:text-purple-400">co.ke</span> + .<span className="text-purple-600 dark:text-purple-400">info</span> + .<span className="text-purple-600 dark:text-purple-400">online</span>
          </h3>
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-card-foreground">
              {bundleTotalKes != null ? formatPrice(bundleTotalKes, 'KES') : '-'}/1st yr
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
            <span>Secure your brand across multiple top-level domains and maximize your online presence.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
            <span>Manage all your domains securely under one account with unified billing and support.</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={handleGetDeal}
            className="px-4"
            disabled={!domainsProductId || bundleTotalKes == null}
          >
            Get deal
          </Button>
        </div>
      </div>

    </>
  );
}

// Promotional Cards Skeleton
function PromotionalCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4">
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function PromotionalCards(props: PromotionalCardsProps) {
  // Early return if no valid search query
  if (!props.searchQuery || props.searchQuery.trim().length === 0) {
    return null;
  }

  // Sanitize the search query
  const sanitizedQuery = React.useMemo(() => {
    const trimmed = props.searchQuery.trim();
    if (!trimmed) return '';
    return sanitizeDomainName(trimmed);
  }, [props.searchQuery]);

  // Don't render if sanitization resulted in empty string
  if (!sanitizedQuery) {
    return null;
  }
  
  // PERFORMANCE: Use promotional results from main query (no separate API call)
  const promotionalData = props.promotionalResults || {
    ai: null,
    com: null,
    info: null,
    online: null,
  };
  
  // Show skeleton while loading
  if (props.isLoading) {
    return <PromotionalCardsSkeleton />;
  }

  // Filter out cards that shouldn't be shown (Kenyan TLDs are in KenyanTldCards above)
  const cardsToShow = [];

  // Only show Search TLD card when the search query contained a valid TLD (e.g. example.com, example.co.ke)
  if (promotionalData.queryTldParsed) {
    cardsToShow.push(
      <SearchTldCard
        key="search-tld"
        {...props}
        queryTldParsed={promotionalData.queryTldParsed}
        queryTldResult={promotionalData.queryTldResult ?? null}
        isLoadingTld={props.isLoading ?? false}
      />
    );
  }

  // Only show Bundle card if ALL domains are available
  const bundleCard = (
    <BundleCard 
      key="bundle"
      searchQuery={sanitizedQuery}
      bundleData={promotionalData}
      isLoadingBundle={props.isLoading ?? false}
    />
  );
  // Check if bundle should be shown (all domains must be available)
  const allBundleDomainsAvailable = 
    promotionalData.com?.status === 'free' &&
    promotionalData.info?.status === 'free' &&
    promotionalData.online?.status === 'free';
  if (allBundleDomainsAvailable) {
    cardsToShow.push(bundleCard);
  }

  // Don't render if no cards to show
  if (cardsToShow.length === 0) {
    return null;
  }

  // Adjust grid columns based on number of cards
  const gridCols = cardsToShow.length === 1 
    ? 'grid-cols-1' 
    : cardsToShow.length === 2 
    ? 'grid-cols-1 sm:grid-cols-2' 
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4 mb-6`}>
      {cardsToShow}
    </div>
  );
}

