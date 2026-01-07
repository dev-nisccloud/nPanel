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

export function BuyNowDialog({ open, onOpenChange, domain }: BuyNowDialogProps) {
  const [duration, setDuration] = React.useState(1);
  const [couponCode, setCouponCode] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);

  // Calculate pricing
  const calculated = domain?.price?.calculated;
  const displayPrice = calculated
    ? ((calculated as any).convertedPrice ?? calculated.finalPrice)
    : domain?.price?.reseller?.price ?? 0;
  const displayCurrency = calculated
    ? ((calculated as any).displayCurrency ?? calculated.currency)
    : domain?.price?.reseller?.currency ?? 'USD';
  const originalPrice = calculated?.originalPrice ?? domain?.price?.reseller?.price ?? 0;
  const originalCurrency = calculated?.currency ?? domain?.price?.reseller?.currency ?? 'USD';

  // Calculate totals
  const basePrice = displayPrice * duration;
  const originalBasePrice = originalPrice * duration;
  
  // Calculate tax (16% VAT - adjust as needed)
  const taxRate = 0.16;
  const taxes = basePrice * taxRate;
  
  // Apply coupon discount (placeholder - 0% for now)
  const couponDiscount = 0;
  
  const subtotal = basePrice;
  const total = subtotal + taxes - couponDiscount;

  const handlePayment = () => {
    // TODO: Implement payment flow
    console.log("Proceeding to payment", { domain: domain?.domain, duration, couponCode, total });
  };

  if (!domain) return null;

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

