"use client";

import * as React from "react";
import { ShoppingCart, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { CheckoutDialog } from "./checkout-dialog";

export function CartSummary() {
  const { 
    items, 
    getItemCount, 
    getTotalsByCurrency,
    getCurrenciesInCart,
  } = useCartStore();
  
  const totalItems = getItemCount();
  const totalsByCurrency = getTotalsByCurrency();
  const currenciesInCart = getCurrenciesInCart();
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  // Format price with currency support
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="p-6 space-y-4">
      {/* Summary Header */}
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Order Summary</span>
      </div>

      <Separator />

      {/* Totals by Currency */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Items</span>
          <span className="text-sm font-medium">{totalItems}</span>
        </div>
        
        {currenciesInCart.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              {currenciesInCart.map(currency => {
                const subtotal = totalsByCurrency[currency];
                const vatRate = 0.16; // 16% VAT
                const vat = subtotal * vatRate;
                const total = subtotal + vat;

                return (
                  <div key={currency} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sub Total ({currency})</span>
                      <span className="text-sm font-medium">
                        {formatPrice(subtotal, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">VAT (16%)</span>
                      <span className="text-sm font-medium">
                        {formatPrice(vat, currency)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Total to be paid</span>
                      <span className="text-base font-semibold">
                        {formatPrice(total, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Checkout Button */}
      <Button 
        className="w-full h-11 font-medium" 
        onClick={handleCheckout}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Proceed to Checkout
      </Button>

      {/* Checkout Dialog */}
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
