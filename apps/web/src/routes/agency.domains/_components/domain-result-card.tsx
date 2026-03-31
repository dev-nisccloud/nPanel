"use client";

import * as React from "react";
import { CheckCircle, XCircle, ShoppingCart } from "lucide-react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { trpc } from "@/utils/trpc";

interface DomainResultCardProps {
  result: DomainSearchResult;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
}

const formatPrice = (price?: number, currency?: string) => {
  if (!price) return "N/A";

  // Currency symbols mapping
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
  // Format with thousand separators (e.g., 1,000.00)
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  
  return `${symbol} ${formattedNumber}`;
};

const formatPricingInfo = (calculated: any) => {
  if (!calculated) return null;

  const { marginType, marginValue, marginAmount } = calculated;

  if (marginType === "PERCENTAGE") {
    return `+${marginValue}% (+${formatPrice(marginAmount, calculated.currency)})`;
  } else if (marginType === "FIXED") {
    // marginValue is already a string, so we can use it directly after parsing
    const fixedValue = parseFloat(marginValue || '0');
    return `+${formatPrice(fixedValue, calculated.currency)}`;
  }

  return null;
};

const getStatusBadge = (status: string) => {
  // Convert status to a more user-friendly format
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }> = {
    'free': { label: 'Available', variant: 'default', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
    'taken': { label: 'Taken', variant: 'destructive', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
    'premium': { label: 'Premium', variant: 'destructive', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
    'reserved': { label: 'Reserved', variant: 'destructive', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
    'blocked': { label: 'Blocked', variant: 'destructive', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
    'invalid': { label: 'Invalid', variant: 'destructive', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
    'pending': { label: 'Pending', variant: 'destructive', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
    'unknown': { label: 'Unknown', variant: 'destructive', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
  };

  // Get the status config or default to showing the raw status
  const statusConfig = statusMap[status.toLowerCase()] || {
    label: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize first letter
    variant: 'destructive' as const,
    className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  };

  return (
    <Badge
      variant={statusConfig.variant}
      className={`${statusConfig.className} text-xs`}
    >
      {statusConfig.label}
    </Badge>
  );
};

export function DomainResultCard({ result, isDomainInCart, onAddToCart, onRemoveFromCart }: DomainResultCardProps) {
  const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
  const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, { enabled: true });
  const isInCart = isDomainInCart(result.domain);

  const handleCartAction = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      if (isInCart) {
        onRemoveFromCart(result.domain);
      } else {
        // Validate result before adding to cart
        if (result && result.domain) {
          onAddToCart(result);
        } else {
          console.error('Invalid domain result for cart:', result);
        }
      }
    } catch (error) {
      console.error('Error handling cart action:', error);
    }
  };

  // Extract price information for display
  const calculated = result.price?.calculated;
  const displayPrice = calculated
    ? ((calculated as any).convertedPrice ?? calculated.finalPrice)
    : result.price?.reseller?.price;
  const displayCurrency = calculated
    ? ((calculated as any).displayCurrency ?? calculated.currency)
    : result.price?.reseller?.currency;
  const originalPrice = calculated?.originalPrice ?? result.price?.reseller?.price;
  const originalCurrency = calculated?.currency ?? result.price?.reseller?.currency;

  return (
    <div className="flex flex-col p-3 bg-card border border-border rounded-lg hover:border-border/80 hover:shadow-sm transition-all">
      {/* Header: Domain name and status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-card-foreground truncate block">
            {result.domain}
          </span>
        </div>
        {getStatusBadge(result.status)}
      </div>

      {/* Price Section */}
      {result.status === 'free' && result.price && (
        <div className="mb-2">
          <div className="text-lg font-bold text-card-foreground">
            {formatPrice(displayPrice, displayCurrency)}
          </div>
          
          {/* Price Breakdown - Compact */}
          {calculated && (
            <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1 pt-1 border-t border-border">
              {/* Original Price */}
              {originalPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/70">Original Price:</span>
                  <span className="text-muted-foreground line-through">
                    {formatPrice(originalPrice, originalCurrency)}
                  </span>
                </div>
              )}

              {/* Margin Information */}
              {calculated.marginAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/70">Markup:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {formatPricingInfo(calculated)}
                  </span>
                </div>
              )}

              {/* Currency Conversion Info */}
              {(calculated as any).convertedPrice && (calculated as any).exchangeRate && (
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                  <span>Exchange Rate:</span>
                  <span className="text-[9px]">
                    1 {calculated.currency} = {((calculated as any).exchangeRate).toFixed(4)} {(calculated as any).displayCurrency}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reason */}
      {result.reason && (
        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {result.reason}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto pt-2">
        {result.status === 'free' ? (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e?.preventDefault();
                e?.stopPropagation();
                if (domainsProductId && result?.domain) openForProduct({ productId: domainsProductId, productName: "Domains", domain: result });
              }}
              className="text-xs h-7 px-4"
              disabled={!domainsProductId}
            >
              Buy Now
            </Button>
            <Button
              size="sm"
              variant={isInCart ? "destructive" : "outline"}
              onClick={handleCartAction}
              className="h-7 w-7 p-0"
              title={isInCart ? "Remove from cart" : "Add to cart"}
            >
              {isInCart ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="outline"
              disabled
              className="text-xs h-7 px-4"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Not Available
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
