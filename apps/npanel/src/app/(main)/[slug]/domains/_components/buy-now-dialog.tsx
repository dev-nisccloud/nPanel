"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: DomainSearchResult | null;
}

const formatPrice = (price?: number, currency?: string) => {
  // Safely handle undefined, null, NaN, or invalid prices
  if (price === undefined || price === null || isNaN(price) || !isFinite(price)) {
    return "N/A";
  }

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
  
  try {
    // Safely format number with error handling for SSR/compatibility
    const formattedNumber = typeof Intl !== 'undefined' && Intl.NumberFormat
      ? new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(price)
      : price.toFixed(2);
    
    return `${symbol} ${formattedNumber}`;
  } catch (error) {
    // Fallback to simple formatting if Intl fails
    console.error('Error formatting price:', error);
    return `${symbol} ${price.toFixed(2)}`;
  }
};

export function BuyNowDialog({ open, onOpenChange, domain }: BuyNowDialogProps) {
  const [duration, setDuration] = React.useState(1);
  const [couponCode, setCouponCode] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);

  // Safely calculate pricing with proper null/undefined checks
  const calculated = domain?.price?.calculated;
  
  // Safely extract display price with fallbacks
  let displayPrice = 0;
  if (calculated) {
    displayPrice = (calculated as any)?.convertedPrice ?? calculated?.finalPrice ?? 0;
  } else {
    displayPrice = domain?.price?.reseller?.price ?? 0;
  }
  
  // Ensure displayPrice is a valid number
  displayPrice = typeof displayPrice === 'number' && isFinite(displayPrice) ? displayPrice : 0;
  
  const displayCurrency = calculated
    ? ((calculated as any)?.displayCurrency ?? calculated?.currency ?? 'USD')
    : (domain?.price?.reseller?.currency ?? 'USD');
  
  // Safely extract original price
  let originalPrice = 0;
  if (calculated?.originalPrice !== undefined && calculated?.originalPrice !== null) {
    originalPrice = calculated.originalPrice;
  } else {
    originalPrice = domain?.price?.reseller?.price ?? 0;
  }
  
  // Ensure originalPrice is a valid number
  originalPrice = typeof originalPrice === 'number' && isFinite(originalPrice) ? originalPrice : 0;
  
  const originalCurrency = calculated?.currency ?? domain?.price?.reseller?.currency ?? 'USD';

  // Calculate totals with safe number operations
  const basePrice = Math.max(0, displayPrice * duration);
  const originalBasePrice = Math.max(0, originalPrice * duration);
  
  // Calculate tax (16% VAT - adjust as needed)
  const taxRate = 0.16;
  const taxes = Math.max(0, basePrice * taxRate);
  
  // Apply coupon discount (placeholder - 0% for now)
  const couponDiscount = 0;
  
  const subtotal = basePrice;
  const total = Math.max(0, subtotal + taxes - couponDiscount);

  const handlePayment = () => {
    // TODO: Implement payment flow
    try {
      if (!domain || !domain.domain) {
        console.error('Cannot proceed to payment: invalid domain', domain);
        return;
      }
      console.log("Proceeding to payment", { domain: domain.domain, duration, couponCode, total });
    } catch (error) {
      console.error('Error in payment handler:', error);
    }
  };

  // Early return with additional validation
  if (!domain || !domain.domain) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buy {domain.domain} domain</DialogTitle>
          <DialogDescription>
            Review the details and proceed to checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Domain Name and Duration */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium truncate">{domain.domain}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This domain is by default registered for 1 year. Edit the duration below.</p>
                    </TooltipContent>
                  </Tooltip>
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
                {originalBasePrice > basePrice && (
                  <div className="text-sm text-muted-foreground line-through">
                    {formatPrice(originalBasePrice, originalCurrency)}
                  </div>
                )}
                <div className="font-semibold text-lg">
                  {formatPrice(basePrice, displayCurrency)}
                </div>
              </div>
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
            <span>{formatPrice(taxes, displayCurrency)}</span>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total, displayCurrency)}</span>
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

