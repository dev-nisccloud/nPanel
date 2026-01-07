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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCartStore } from "@/stores/cart-store";
import { CartItemCard } from "./cart-item-card";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, getItemCount, getTotalsByCurrency, getCurrenciesInCart } = useCartStore();
  const [couponCode, setCouponCode] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);

  const totalItems = getItemCount();
  const totalsByCurrency = getTotalsByCurrency();
  const currenciesInCart = getCurrenciesInCart();

  // For simplicity, we'll use the first currency if multiple exist
  // In a real scenario, you might want to handle multiple currencies differently
  const primaryCurrency = currenciesInCart[0] || 'USD';
  const subtotal = totalsByCurrency[primaryCurrency] || 0;
  
  // Calculate tax (16% VAT)
  const taxRate = 0.16;
  const taxes = subtotal * taxRate;
  
  // Apply coupon discount (placeholder - 0% for now)
  const couponDiscount = 0;
  
  const total = subtotal + taxes - couponDiscount;

  const handlePayment = () => {
    // TODO: Implement payment flow
    console.log("Proceeding to payment", { items, couponCode, total });
  };

  // Get creative title based on item count
  const getTitle = () => {
    if (totalItems === 1) {
      return `Complete your purchase`;
    } else if (totalItems <= 3) {
      return `Proceed to purchase ${totalItems} items`;
    } else {
      return `Review ${totalItems} items in your cart`;
    }
  };

  if (totalItems === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Review the details and proceed to checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cart Items with Scroll Area */}
          <div className="bg-muted/50 rounded-lg p-4">
            <ScrollArea className="h-[200px] w-full">
              <div className="space-y-3 pr-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onRemove={() => {
                      // Don't allow removal in checkout dialog
                    }}
                    hideRemoveButton={true}
                  />
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
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
            <span>{formatPrice(taxes, primaryCurrency)}</span>
          </div>

          {/* Sub Total */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sub Total</span>
            <span>{formatPrice(subtotal, primaryCurrency)}</span>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total, primaryCurrency)}</span>
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

