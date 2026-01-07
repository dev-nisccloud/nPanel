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
import { trpc } from "@/utils/trpc";
import { BuyNowDialog } from "./buy-now-dialog";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import { useCurrency } from "./currency-context";

interface PromotionalCardsProps {
  searchQuery: string;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  isDomainInCart: (domain: string) => boolean;
  isLoading?: boolean;
}

const formatPrice = (price?: number, currency?: string) => {
  if (!price) return "N/A";

  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'KES': 'KSh',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
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

// Shared hook for promotional cards data - batches all extensions in one API call
function usePromotionalCardsData(searchQuery: string) {
  // Sanitize the search query before using it
  const sanitizedQuery = React.useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return '';
    return sanitizeDomainName(trimmed);
  }, [searchQuery]);
  
  // Single batched query for all promotional card extensions (AI, Bundle)
  // Only enabled when we have a valid sanitized query
  const { data: promotionalData, isLoading } = trpc.openProvider.domains.checkAvailability.useQuery(
    {
      name: sanitizedQuery,
      extensions: ['ai', 'com', 'info', 'online'], // Batch all extensions in one call
      with_price: true,
      with_whois: false,
    },
    {
      enabled: sanitizedQuery.length > 0, // Only search when we have a valid sanitized query
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    }
  );

  // Process and separate results by extension
  const processedData = React.useMemo(() => {
    if (!promotionalData?.data?.results) {
      return {
        ai: null,
        com: null,
        info: null,
        online: null,
      } as { ai: any; com: any; info: any; online: any };
    }

    const results: { ai: any; com: any; info: any; online: any } = {
      ai: null,
      com: null,
      info: null,
      online: null,
    };

    promotionalData.data.results.forEach((result: any) => {
      const extension = result.domain.split('.').pop()?.toLowerCase();
      if (extension && results.hasOwnProperty(extension)) {
        results[extension as keyof typeof results] = result;
      }
    });

    return results;
  }, [promotionalData]);

  return {
    data: processedData,
    isLoading,
  };
}

// AI Card Component
function AICard({ 
  searchQuery, 
  onAddToCart, 
  onRemoveFromCart, 
  isDomainInCart,
  aiData,
  isLoadingAI 
}: Omit<PromotionalCardsProps, 'searchQuery'> & { 
  searchQuery: string;
  aiData: any;
  isLoadingAI: boolean;
}) {
  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const currencyContext = useCurrency();
  const pricingHook = useDomainPricing(currencyContext);
  
  // searchQuery is already sanitized when passed from PromotionalCards
  const aiDomain = `${searchQuery}.ai`;
  const isInCart = isDomainInCart(aiDomain);

  // Process AI domain result - only show if available
  const aiResult = React.useMemo(() => {
    if (!aiData) return null;
    
    // Only show if domain is free/available
    if (aiData.status !== 'free' || !aiData.price?.reseller) return null;

    return {
      domain: aiDomain,
      status: aiData.status,
      price: {
        product: aiData.price.product,
        reseller: aiData.price.reseller,
      },
      reason: "Perfect for AI-powered applications and innovative tech projects.",
    } as DomainSearchResult;
  }, [aiData, aiDomain]);

  // Calculate pricing with markup
  const [pricedAIResult, setPricedAIResult] = React.useState<DomainSearchResult | null>(null);
  
  React.useEffect(() => {
    if (aiResult && pricingHook) {
      pricingHook.calculatePricesBatch([aiResult]).then(([priced]) => {
        setPricedAIResult(priced);
      });
    }
  }, [aiResult, pricingHook]);

  const displayResult = pricedAIResult || aiResult;
  const calculated = displayResult?.price?.calculated;
  const displayPrice = calculated
    ? ((calculated as any).convertedPrice ?? calculated.finalPrice)
    : displayResult?.price?.reseller?.price;
  const displayCurrency = calculated
    ? ((calculated as any).displayCurrency ?? calculated.currency)
    : displayResult?.price?.reseller?.currency || 'KES';
  const originalPrice = calculated?.originalPrice ?? displayResult?.price?.reseller?.price;

  const handleCartAction = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      if (displayResult && displayResult.domain) {
        if (isInCart) {
          onRemoveFromCart(aiDomain);
        } else {
          onAddToCart(displayResult);
        }
      } else {
        console.error('Invalid displayResult for cart action:', displayResult);
      }
    } catch (error) {
      console.error('Error handling cart action:', error);
    }
  };

  if (isLoadingAI) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (!displayResult || displayResult.status !== 'free') {
    return null;
  }

  const discountPercent = originalPrice && displayPrice && originalPrice > displayPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            AI Domain
          </Badge>
        </div>

        <div className="mb-3">
          <h3 className="text-lg font-bold text-card-foreground mb-2">
            {aiDomain}
          </h3>
          
          {discountPercent > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                Save {discountPercent}%
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 flex items-center gap-1">
                <Gift className="h-3 w-3" />
                Free email
              </Badge>
            </div>
          )}

          <div className="flex items-baseline gap-2">
            {originalPrice && originalPrice > displayPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice, displayCurrency)}
              </span>
            )}
            <span className="text-2xl font-bold text-card-foreground">
              {formatPrice(displayPrice, displayCurrency)}/1st yr
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
            <span>.ai domains are perfect for AI-powered applications and cutting-edge technology projects.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
            <span>Establish your brand in the artificial intelligence space with this premium extension.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={(e) => {
              e?.preventDefault();
              e?.stopPropagation();
              try {
                if (displayResult && displayResult.domain) {
                  setBuyNowOpen(true);
                } else {
                  console.error('Invalid displayResult for buy now:', displayResult);
                }
              } catch (error) {
                console.error('Error opening buy now dialog:', error);
              }
            }}
            className="flex-1"
          >
            Buy Now
          </Button>
          <Button
            size="sm"
            variant={isInCart ? "destructive" : "outline"}
            onClick={handleCartAction}
            className="h-9 w-9 p-0"
            title={isInCart ? "Remove from cart" : "Add to cart"}
          >
            {isInCart ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {displayResult && displayResult.domain && (
        <BuyNowDialog
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          domain={displayResult}
        />
      )}
    </>
  );
}

// .co.ke Card Component
function CoKeCard({ 
  searchQuery, 
  onAddToCart, 
  onRemoveFromCart, 
  isDomainInCart 
}: Omit<PromotionalCardsProps, 'searchQuery'> & { searchQuery: string }) {
  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const currencyContext = useCurrency();
  const pricingHook = useDomainPricing(currencyContext);

  // searchQuery is already sanitized when passed from PromotionalCards
  const coKeDomain = `${searchQuery}.co.ke`;
  const isInCart = isDomainInCart(coKeDomain);

  // Hardcoded price for .co.ke (499.00 KES)
  const hardcodedPrice = 499.00;
  const currency = 'KES';

  // Create domain result for .co.ke
  const coKeResult: DomainSearchResult = React.useMemo(() => ({
    domain: coKeDomain,
    status: 'free',
    price: {
      product: { price: hardcodedPrice, currency },
      reseller: { price: hardcodedPrice, currency },
    },
    reason: "Establish your brand in the Kenyan market with a trusted local domain extension.",
  }), [coKeDomain]);

  // Calculate pricing with markup (if pricing hook is available)
  const [pricedCoKeResult, setPricedCoKeResult] = React.useState<DomainSearchResult | null>(null);
  
  React.useEffect(() => {
    if (coKeResult && pricingHook) {
      pricingHook.calculatePricesBatch([coKeResult]).then(([priced]) => {
        setPricedCoKeResult(priced);
      });
    } else {
      setPricedCoKeResult(coKeResult);
    }
  }, [coKeResult, pricingHook]);

  const displayResult = pricedCoKeResult || coKeResult;
  const calculated = displayResult?.price?.calculated;
  const displayPrice = calculated
    ? ((calculated as any).convertedPrice ?? calculated.finalPrice)
    : hardcodedPrice;
  const displayCurrency = calculated
    ? ((calculated as any).displayCurrency ?? calculated.currency)
    : currency;

  const handleCartAction = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      if (displayResult && displayResult.domain) {
        if (isInCart) {
          onRemoveFromCart(coKeDomain);
        } else {
          onAddToCart(displayResult);
        }
      } else {
        console.error('Invalid displayResult for cart action:', displayResult);
      }
    } catch (error) {
      console.error('Error handling cart action:', error);
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            Local Domain
          </Badge>
        </div>

        <div className="mb-3">
          <h3 className="text-lg font-bold text-card-foreground mb-2">
            {coKeDomain}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-card-foreground">
              {formatPrice(displayPrice, displayCurrency)}/1st yr
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
            <span>Build trust and credibility in the Kenyan market with a local domain extension.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
            <span>Connect with Kenyan customers and establish a strong local online presence.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={(e) => {
              e?.preventDefault();
              e?.stopPropagation();
              try {
                if (displayResult && displayResult.domain) {
                  setBuyNowOpen(true);
                } else {
                  console.error('Invalid displayResult for buy now:', displayResult);
                }
              } catch (error) {
                console.error('Error opening buy now dialog:', error);
              }
            }}
            className="flex-1"
          >
            Buy Now
          </Button>
          <Button
            size="sm"
            variant={isInCart ? "destructive" : "outline"}
            onClick={handleCartAction}
            className="h-9 w-9 p-0"
            title={isInCart ? "Remove from cart" : "Add to cart"}
          >
            {isInCart ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {displayResult && displayResult.domain && (
        <BuyNowDialog
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          domain={displayResult}
        />
      )}
    </>
  );
}

// Bundle Card Component
function BundleCard({ 
  searchQuery, 
  onAddToCart, 
  onRemoveFromCart, 
  isDomainInCart,
  bundleData,
  isLoadingBundle 
}: Omit<PromotionalCardsProps, 'searchQuery'> & { 
  searchQuery: string;
  bundleData: { com: any; info: any; online: any };
  isLoadingBundle: boolean;
}) {
  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const currencyContext = useCurrency();
  const pricingHook = useDomainPricing(currencyContext);

  // searchQuery is already sanitized when passed from PromotionalCards
  const bundleTlds = ['com', 'co.ke', 'info', 'online'];
  const bundleDomains = bundleTlds.map(tld => `${searchQuery}.${tld}`);

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

  // Calculate pricing with markup and convert to KES
  const [pricedBundleResults, setPricedBundleResults] = React.useState<DomainSearchResult[]>([]);
  
  React.useEffect(() => {
    if (bundleResults.length > 0 && pricingHook) {
      pricingHook.calculatePricesBatch(bundleResults).then((priced) => {
        setPricedBundleResults(priced);
      });
    }
  }, [bundleResults, pricingHook]);

  // Calculate total bundle price in KES (ensure all prices are in KES)
  const bundleTotal = React.useMemo(() => {
    return pricedBundleResults.reduce((sum, result) => {
      const calculated = result.price?.calculated;
      // Use convertedPrice if available (should be in KES), otherwise use finalPrice
      const price = calculated
        ? ((calculated as any).convertedPrice ?? calculated.finalPrice)
        : result.price?.reseller?.price || 0;
      // All prices should already be in KES after pricing hook conversion
      return sum + price;
    }, 0);
  }, [pricedBundleResults]);

  // Calculate original total for discount calculation (also in KES)
  const originalTotal = React.useMemo(() => {
    return pricedBundleResults.reduce((sum, result) => {
      const calculated = result.price?.calculated;
      // Use originalPrice and convert if needed, or use reseller price
      const price = calculated?.originalPrice ?? result.price?.reseller?.price ?? 0;
      // If original currency is not KES and we have conversion info, we'd need to convert
      // For now, assume pricing hook handles this or prices are already comparable
      return sum + price;
    }, 0);
  }, [pricedBundleResults]);

  const discountPercent = originalTotal > bundleTotal
    ? Math.round(((originalTotal - bundleTotal) / originalTotal) * 100)
    : 0;

  const allInCart = bundleDomains.every(domain => isDomainInCart(domain));
  const anyInCart = bundleDomains.some(domain => isDomainInCart(domain));

  const handleCartAction = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      if (allInCart) {
        bundleDomains.forEach(domain => onRemoveFromCart(domain));
      } else {
        pricedBundleResults.forEach(result => {
          if (result && result.domain && !isDomainInCart(result.domain)) {
            onAddToCart(result);
          }
        });
      }
    } catch (error) {
      console.error('Error handling bundle cart action:', error);
    }
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

  if (pricedBundleResults.length === 0) {
    return null;
  }

  const bundleDisplay = bundleDomains.map(d => d.split('.')[0] === searchQuery ? d.split('.').slice(1).join('.') : d.split('.').pop()).join(' + .');

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
          
          {discountPercent > 0 && (
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 mb-2">
              Save {discountPercent}%
            </Badge>
          )}

          <div className="flex items-baseline gap-2">
            {originalTotal > bundleTotal && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalTotal, 'KES')}
              </span>
            )}
            <span className="text-2xl font-bold text-card-foreground">
              {formatPrice(bundleTotal, 'KES')}/1st yr
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

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e?.preventDefault();
              e?.stopPropagation();
              try {
                if (pricedBundleResults && pricedBundleResults.length > 0) {
                  setBuyNowOpen(true);
                } else {
                  console.error('Invalid bundle results for buy now:', pricedBundleResults);
                }
              } catch (error) {
                console.error('Error opening bundle buy now dialog:', error);
              }
            }}
            className="flex-1 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            Buy Now
          </Button>
          <Button
            size="sm"
            variant={allInCart ? "destructive" : "outline"}
            onClick={handleCartAction}
            className="h-9 w-9 p-0"
            title={allInCart ? "Remove from cart" : "Add to cart"}
          >
            {allInCart ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Bundle Buy Now Dialog - will need custom implementation */}
      {buyNowOpen && pricedBundleResults && pricedBundleResults.length > 0 && (
        <BundleBuyNowDialog
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          domains={pricedBundleResults}
        />
      )}
    </>
  );
}

// Bundle Buy Now Dialog Component
function BundleBuyNowDialog({
  open,
  onOpenChange,
  domains,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domains: DomainSearchResult[];
}) {
  const [duration, setDuration] = React.useState(1);
  const [couponCode, setCouponCode] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);

  // Calculate totals for all domains (all should be in KES after pricing hook)
  const domainTotals = domains.map(domain => {
    const calculated = domain.price?.calculated;
    const displayPrice = calculated
      ? ((calculated as any).convertedPrice ?? calculated.finalPrice)
      : domain.price?.reseller?.price ?? 0;
    
    return {
      domain: domain.domain,
      price: displayPrice,
    };
  });

  // Calculate original total for renewal info (in original currency, will display in KES)
  const originalTotalPerYear = domains.reduce((sum, domain) => {
    const calculated = domain.price?.calculated;
    // Use originalPrice if available, otherwise reseller price
    const price = calculated?.originalPrice ?? domain.price?.reseller?.price ?? 0;
    return sum + price;
  }, 0);

  const subtotal = domainTotals.reduce((sum, item) => sum + item.price, 0) * duration;
  const taxRate = 0.16;
  const taxes = subtotal * taxRate;
  const couponDiscount = 0;
  const total = subtotal + taxes - couponDiscount;

  const handlePayment = () => {
    console.log("Proceeding to payment for bundle", { domains, duration, couponCode, total });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buy {domains.map(d => d.domain).join(' + ')}</DialogTitle>
          <DialogDescription>
            Review the details and proceed to checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bundle Domains */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium truncate">
                    {domains.map((d, i) => (
                      <React.Fragment key={d.domain}>
                        {d.domain}
                        {i < domains.length - 1 && <span className="text-muted-foreground mx-1">+</span>}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
                <Select
                  value={duration.toString()}
                  onValueChange={(value) => setDuration(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {duration} {duration === 1 ? 'year' : 'years'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="2">2 years</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="4">4 years</SelectItem>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="10">10 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-right flex-shrink-0">
                {originalTotalPerYear * duration > subtotal && (
                  <div className="text-sm text-muted-foreground line-through">
                    {formatPrice(originalTotalPerYear * duration, 'KES')}
                  </div>
                )}
                <div className="font-semibold text-lg">
                  {formatPrice(subtotal, 'KES')}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Domains renew at {formatPrice(originalTotalPerYear, 'KES')}/year on {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>FREE domain privacy protection included</span>
            </div>
          </div>

          {/* Coupon Code */}
          <div className="space-y-2">
            {!showCouponInput ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Coupon code</span>
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => setShowCouponInput(true)}
                >
                  Add
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCouponInput(false);
                    setCouponCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Taxes & Fees */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Taxes & fees</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>16% VAT tax has been applied according to Kenyan regulations.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span>{formatPrice(taxes, 'KES')}</span>
          </div>

          {/* Sub Total */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sub Total</span>
            <span>{formatPrice(subtotal, 'KES')}</span>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total, 'KES')}</span>
            </div>
          </div>

          {/* Legal Text */}
          <p className="text-xs text-muted-foreground">
            By checking out, you agree with our{" "}
            <a href="/terms" className="text-primary underline hover:text-primary/80">
              Terms of Service
            </a>{" "}
            and confirm that you have read our{" "}
            <a href="/privacy" className="text-primary underline hover:text-primary/80">
              Privacy Policy
            </a>
            . You can cancel recurring payments at any time.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-primary"
          >
            Cancel
          </Button>
          <Button onClick={handlePayment} className="bg-primary text-primary-foreground">
            Choose payment method
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  
  // Use shared batched data hook - single API call for all promotional extensions
  const { data: promotionalData, isLoading: isLoadingPromotional } = usePromotionalCardsData(sanitizedQuery);
  
  // Show skeleton while loading (either main search or promotional data)
  if (props.isLoading || isLoadingPromotional) {
    return <PromotionalCardsSkeleton />;
  }

  // Filter out cards that shouldn't be shown
  const cardsToShow = [];

  // Always show .co.ke card (hardcoded, always available)
  cardsToShow.push(
    <CoKeCard key="coke" {...props} searchQuery={sanitizedQuery} />
  );

  // Only show AI card if domain is available
  const aiCard = (
    <AICard 
      key="ai"
      {...props} 
      searchQuery={sanitizedQuery}
      aiData={promotionalData.ai}
      isLoadingAI={isLoadingPromotional}
    />
  );
  // Check if AI card should be shown (it will return null if not available)
  if (promotionalData.ai && promotionalData.ai.status === 'free') {
    cardsToShow.push(aiCard);
  }

  // Only show Bundle card if ALL domains are available
  const bundleCard = (
    <BundleCard 
      key="bundle"
      {...props} 
      searchQuery={sanitizedQuery}
      bundleData={promotionalData}
      isLoadingBundle={isLoadingPromotional}
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

