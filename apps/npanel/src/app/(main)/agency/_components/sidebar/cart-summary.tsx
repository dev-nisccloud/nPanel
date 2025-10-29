"use client";

import * as React from "react";
import { ShoppingCart, DollarSign, Package, Calendar, CreditCard, Shield, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";

export function CartSummary() {
  const { 
    items, 
    getTotal, 
    getItemCount, 
    getItemCountByType, 
    getTotalsByCurrency,
    getCurrenciesInCart,
    clearCart 
  } = useCartStore();
  
  const totalPrice = getTotal();
  const totalItems = getItemCount();
  const domainCount = getItemCountByType('domain');
  const hostingCount = getItemCountByType('hosting');
  const serviceCount = getItemCountByType('service');
  
  // Get currency-aware totals
  const totalsByCurrency = getTotalsByCurrency();
  const currenciesInCart = getCurrenciesInCart();

  // Format price with currency support
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const handleCheckout = () => {
    // TODO: Implement checkout logic
    console.log('Proceeding to checkout with items:', items);
    // For now, just show an alert
    alert('Checkout functionality will be implemented soon!');
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop/Tablet View - Full Summary */}
      <Card className="hidden md:block sticky top-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Order Summary
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Item Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Items</span>
            </div>
            <Badge variant="secondary" className="text-sm">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Badge>
          </div>

          {/* Service Breakdown */}
          {(domainCount > 0 || hostingCount > 0 || serviceCount > 0) && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Services</div>
              <div className="space-y-1">
                {domainCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Domains</span>
                    <span className="text-muted-foreground">{domainCount}</span>
                  </div>
                )}
                {hostingCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Hosting Plans</span>
                    <span className="text-muted-foreground">{hostingCount}</span>
                  </div>
                )}
                {serviceCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Services</span>
                    <span className="text-muted-foreground">{serviceCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Currency-Aware Total Prices */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold">Total</span>
            </div>
            <div className="space-y-1">
              {currenciesInCart.map(currency => (
                <div key={currency} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{currency}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(totalsByCurrency[currency], currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>SSL Encrypted</span>
            </div>
          </div>

          <Separator />

          {/* Checkout Button */}
          <Button 
            className="w-full h-12 text-lg font-semibold" 
            onClick={handleCheckout}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Proceed to Checkout
            <span className="ml-2 text-base">
              {currenciesInCart.length === 1 
                ? formatPrice(totalsByCurrency[currenciesInCart[0]], currenciesInCart[0])
                : `${currenciesInCart.length} currencies`
              }
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Mobile View - Minimal Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-gray-800 p-4 z-50">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side - Price Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{totalItems} items</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-gray-900">
                {currenciesInCart.length === 1 
                  ? formatPrice(totalsByCurrency[currenciesInCart[0]], currenciesInCart[0])
                  : `${currenciesInCart.length} currencies`
                }
              </span>
            </div>
          </div>

          {/* Right Side - Checkout Button */}
          <Button 
            className="h-10 px-6 font-semibold flex-shrink-0" 
            onClick={handleCheckout}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Checkout
          </Button>
        </div>
      </div>
    </>
  );
}
