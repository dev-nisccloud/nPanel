"use client";

import * as React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DomainSearchResult } from "./domain-search";

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
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
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
    'free': { label: 'Available', variant: 'default', className: 'bg-green-100 text-green-800' },
    'taken': { label: 'Taken', variant: 'destructive', className: 'bg-red-100 text-red-800' },
    'premium': { label: 'Premium', variant: 'destructive', className: 'bg-red-100 text-red-800' },
    'reserved': { label: 'Reserved', variant: 'destructive', className: 'bg-red-100 text-red-800' },
    'blocked': { label: 'Blocked', variant: 'destructive', className: 'bg-red-100 text-red-800' },
    'invalid': { label: 'Invalid', variant: 'destructive', className: 'bg-red-100 text-red-800' },
    'pending': { label: 'Pending', variant: 'destructive', className: 'bg-red-100 text-red-800' },
    'unknown': { label: 'Unknown', variant: 'destructive', className: 'bg-red-100 text-red-800' },
  };

  // Get the status config or default to showing the raw status
  const statusConfig = statusMap[status.toLowerCase()] || {
    label: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize first letter
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800'
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
  const isInCart = isDomainInCart(result.domain);

  const handleCartAction = () => {
    if (isInCart) {
      onRemoveFromCart(result.domain);
    } else {
      onAddToCart(result);
    }
  };

  // Extract price information for display
  // Show final price with markup applied (if available), otherwise show original price
  const calculated = result.price?.calculated;
  const displayPrice = calculated
    ? ((calculated as any).convertedPrice ?? calculated.finalPrice)
    : result.price?.reseller?.price;
  const displayCurrency = calculated
    ? ((calculated as any).displayCurrency ?? calculated.currency)
    : result.price?.reseller?.currency;

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-lg text-gray-900 truncate">
            {result.domain}
          </span>
          {getStatusBadge(result.status)}
        </div>
        {result.status === 'free' && result.price && (
          <div className="space-y-2">
            {/* Main Price Display - Only show final price (with markup applied if available) */}
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(displayPrice, displayCurrency)}
            </div>
          </div>
        )}
        {result.reason && (
          <div className="text-sm text-gray-500 mt-2">
            {result.reason}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        {result.status === 'free' ? (
          <Button
            size="sm"
            variant={isInCart ? "destructive" : "default"}
            onClick={handleCartAction}
            className="flex-shrink-0"
          >
            {isInCart ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Remove from Cart
              </>
            ) : (
              <>
                <Icons.Cart className="h-4 w-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled
            className="flex-shrink-0"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Not Available
          </Button>
        )}
      </div>
    </div>
  );
}
