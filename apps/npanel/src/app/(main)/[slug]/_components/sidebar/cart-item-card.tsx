"use client";

import * as React from "react";
import { Trash2, Calendar, Globe, Server, Wrench, DollarSign, Clock } from "lucide-react";
import { Icons } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore, type CartItem, type DomainCartItem } from "@/stores/cart-store";

interface CartItemCardProps {
  item: CartItem;
  onRemove: (itemId: string) => void;
}

// Helper function to get service icon based on type
const getServiceIcon = (type: string) => {
  switch (type) {
    case 'domain':
      return <Globe className="h-5 w-5 text-blue-600" />;
    case 'hosting':
      return <Server className="h-5 w-5 text-green-600" />;
    case 'service':
      return <Wrench className="h-5 w-5 text-purple-600" />;
    default:
      return <Globe className="h-5 w-5 text-gray-600" />;
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
      
      // Use the same logic as cart store for currency-aware pricing
      if (domainItem.addedInCurrency && domainItem.price?.calculated?.convertedPrice) {
        // Use the converted price and currency that was active when added
        return { 
          price: domainItem.price.calculated.convertedPrice, 
          currency: domainItem.addedInCurrency 
        };
      } else if (domainItem.price?.calculated?.finalPrice) {
        // Use calculated price
        return { 
          price: domainItem.price.calculated.finalPrice, 
          currency: domainItem.price.calculated.currency || 'USD' 
        };
      } else {
        // Fallback to reseller or product price
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

// Helper function to get service details
const getServiceDetails = (item: CartItem) => {
  switch (item.type) {
    case 'domain':
      const domainItem = item as DomainCartItem;
      const details = [
        { label: 'Status', value: domainItem.status || 'Available' },
        { label: 'Type', value: 'Domain Registration' },
      ];
      
      // Add currency information if available
      if (domainItem.addedInCurrency) {
        details.push({ label: 'Currency', value: domainItem.addedInCurrency });
      }
      
      return details;
    case 'hosting':
      return [
        { label: 'Plan', value: (item as any).plan || 'Standard Plan' },
        { label: 'Type', value: 'Web Hosting' },
      ];
    case 'service':
      return [
        { label: 'Service', value: (item as any).name || 'Custom Service' },
        { label: 'Type', value: 'Professional Service' },
      ];
    default:
      return [];
  }
};

export function CartItemCard({ item, onRemove }: CartItemCardProps) {
  const serviceName = getServiceName(item);
  const servicePrice = getServicePrice(item);
  const serviceDetails = getServiceDetails(item);
  const addedDate = new Date(item.addedAt).toLocaleDateString();

  return (
    <>
      {/* Desktop/Tablet View */}
      <Card className="hidden md:block group hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
        <CardContent className="p-4">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Service Icon */}
              <div className="flex-shrink-0 p-2 bg-muted/50 rounded-lg">
                {getServiceIcon(item.type)}
              </div>
              
              {/* Service Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {getServiceTypeLabel(item.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Added {addedDate}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 truncate" title={serviceName}>
                  {serviceName}
                </h3>
                
                {/* Service Details */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {serviceDetails.map((detail, index) => (
                    <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span className="font-medium">{detail.label}:</span>
                      <span>{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Remove Button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(item.id)}
              className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator className="my-3" />
          
          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="font-semibold text-lg text-gray-900">
                {formatPrice(servicePrice.price, servicePrice.currency)}
              </span>
            </div>
            
            {/* Service-specific badges */}
            <div className="flex items-center gap-2">
              {item.type === 'domain' && (
                <Badge variant="outline" className="text-xs">
                  Annual
                </Badge>
              )}
              {item.type === 'hosting' && (
                <Badge variant="outline" className="text-xs">
                  Monthly
                </Badge>
              )}
              {item.type === 'service' && (
                <Badge variant="outline" className="text-xs">
                  One-time
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile View - Compact Layout */}
      <Card className="md:hidden group hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left Side - Icon and Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Service Icon */}
              <div className="flex-shrink-0 p-1.5 bg-muted/50 rounded-md">
                {getServiceIcon(item.type)}
              </div>
              
              {/* Service Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {getServiceTypeLabel(item.type)}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-sm text-gray-900 truncate" title={serviceName}>
                  {serviceName}
                </h3>
                
                {/* Service Details - Compact */}
                <div className="text-xs text-muted-foreground mt-1">
                  {serviceDetails.length > 0 && (
                    <span>{serviceDetails[0]?.value}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Side - Price and Remove */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Price */}
              <div className="text-right">
                <div className="font-semibold text-sm text-gray-900">
                  {formatPrice(servicePrice.price, servicePrice.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.type === 'domain' && 'Annual'}
                  {item.type === 'hosting' && 'Monthly'}
                  {item.type === 'service' && 'One-time'}
                </div>
              </div>
              
              {/* Remove Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onRemove(item.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
