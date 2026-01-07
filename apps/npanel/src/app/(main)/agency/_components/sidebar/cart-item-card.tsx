"use client";

import * as React from "react";
import { Trash2, Globe, Server, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore, type CartItem, type DomainCartItem } from "@/stores/cart-store";

interface CartItemCardProps {
  item: CartItem;
  onRemove: (itemId: string) => void;
  hideRemoveButton?: boolean;
}

// Helper function to get service icon based on type
const getServiceIcon = (type: string) => {
  switch (type) {
    case 'domain':
      return <Globe className="h-4 w-4" />;
    case 'hosting':
      return <Server className="h-4 w-4" />;
    case 'service':
      return <Wrench className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
};

// Helper function to get service type label
const getServiceTypeLabel = (type: string) => {
  switch (type) {
    case 'domain':
      return 'Domain';
    case 'hosting':
      return 'Hosting';
    case 'service':
      return 'Service';
    default:
      return 'Service';
  }
};

// Helper function to format price
const formatPrice = (price?: number, currency?: string) => {
  if (!price) return 'Price not available';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(price);
};

// Helper function to get billing cycle label
const getBillingCycleLabel = (item: CartItem): string => {
  switch (item.type) {
    case 'domain':
      return 'Annual';
    case 'hosting':
      // Check if billingCycle exists in the item (it might be added when item is created)
      const hostingItem = item as any;
      if (hostingItem.billingCycle) {
        const cycleMap: Record<string, string> = {
          'MONTHLY': 'Monthly',
          'YEARLY': 'Yearly',
          'BIENNIALLY': 'Biennial',
          'CUSTOM': 'Custom'
        };
        return cycleMap[hostingItem.billingCycle] || 'Monthly';
      }
      return 'Monthly';
    case 'service':
      const serviceItem = item as any;
      if (serviceItem.billingCycle) {
        const cycleMap: Record<string, string> = {
          'MONTHLY': 'Monthly',
          'YEARLY': 'Yearly',
          'BIENNIALLY': 'Biennial',
          'CUSTOM': 'Custom'
        };
        return cycleMap[serviceItem.billingCycle] || 'One-time';
      }
      return 'One-time';
    default:
      return 'One-time';
  }
};

// Helper function to get service name
const getServiceName = (item: CartItem) => {
  switch (item.type) {
    case 'domain':
      return (item as DomainCartItem).domain;
    case 'hosting':
      return (item as any).plan || 'Hosting Plan';
    case 'service':
      return (item as any).name || 'Service';
    default:
      return 'Unknown Service';
  }
};

// Helper function to get service price (currency-aware)
const getServicePrice = (item: CartItem) => {
  switch (item.type) {
    case 'domain':
      const domainItem = item as DomainCartItem;
      
      if (domainItem.addedInCurrency && domainItem.price?.calculated?.convertedPrice) {
        return { 
          price: domainItem.price.calculated.convertedPrice, 
          currency: domainItem.addedInCurrency 
        };
      } else if (domainItem.price?.calculated?.finalPrice) {
        return { 
          price: domainItem.price.calculated.finalPrice, 
          currency: domainItem.price.calculated.currency || 'USD' 
        };
      } else {
        const price = domainItem.price?.reseller?.price || domainItem.price?.product?.price;
        const currency = domainItem.price?.reseller?.currency || domainItem.price?.product?.currency || 'USD';
        return { price, currency };
      }
    case 'hosting':
      return { price: (item as any).price, currency: (item as any).currency };
    case 'service':
      return { price: (item as any).price, currency: (item as any).currency };
    default:
      return { price: undefined, currency: undefined };
  }
};

export function CartItemCard({ item, onRemove, hideRemoveButton = false }: CartItemCardProps) {
  const serviceName = getServiceName(item);
  const servicePrice = getServicePrice(item);
  const billingCycle = getBillingCycleLabel(item);
  const serviceType = getServiceTypeLabel(item.type);

  return (
    <div className="group border rounded-lg bg-card hover:shadow-sm transition-shadow">
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0 p-2 rounded-md bg-muted">
              {getServiceIcon(item.type)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs font-medium">
                  {serviceType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {billingCycle}
                </Badge>
              </div>
              
              <h3 className="font-medium text-sm leading-tight truncate" title={serviceName}>
                {serviceName}
              </h3>
            </div>
          </div>
          
          {/* Remove Button */}
          {!hideRemoveButton && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(item.id)}
              className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Separator className="my-3" />
        
        {/* Price Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">
              {formatPrice(servicePrice.price, servicePrice.currency)}
            </span>
            {servicePrice.currency && (
              <span className="text-xs text-muted-foreground">
                {servicePrice.currency}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
