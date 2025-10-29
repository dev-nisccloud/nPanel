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
  return `${symbol} ${price.toFixed(2)}`;
};

const formatPricingInfo = (calculated: any) => {
  if (!calculated) return null;
  
  const { marginType, marginValue, marginAmount, originalPrice, finalPrice } = calculated;
  
  if (marginType === "PERCENTAGE") {
    return `+${marginValue}% ($${marginAmount.toFixed(2)})`;
  } else if (marginType === "FIXED") {
    return `+$${marginValue}`;
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
          <div className="space-y-1">
            {/* Main Price Display */}
            <div className="text-base font-medium text-gray-700">
              {result.price.calculated ? (
                <>
                  {/* Show converted price if available, otherwise show calculated price */}
                  {(result.price.calculated as any).convertedPrice ? (
                    formatPrice((result.price.calculated as any).convertedPrice, (result.price.calculated as any).displayCurrency)
                  ) : (
                    formatPrice(result.price.calculated.finalPrice, result.price.calculated.currency)
                  )}
                </>
              ) : (
                formatPrice(result.price.reseller?.price, result.price.reseller?.currency)
              )}
            </div>
            
            {/* Price Breakdown */}
            {result.price.calculated && (
              <div className="text-xs text-gray-500 space-y-1">
                {/* Original Price */}
                <div className="text-gray-400">
                  Base: {formatPrice(result.price.calculated.originalPrice, result.price.calculated.currency)}
                </div>
                
                {/* Margin Information */}
                {result.price.calculated.marginAmount > 0 && (
                  <div className="text-green-600 font-medium">
                    {formatPricingInfo(result.price.calculated)}
                  </div>
                )}
                
                {/* Currency Conversion Info */}
                {(result.price.calculated as any).convertedPrice && (result.price.calculated as any).exchangeRate && (
                  <div className="text-blue-600">
                    Rate: 1 {result.price.calculated.currency} = {(result.price.calculated as any).exchangeRate.toFixed(4)} {(result.price.calculated as any).displayCurrency}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {result.reason && (
          <div className="text-sm text-gray-500">
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
