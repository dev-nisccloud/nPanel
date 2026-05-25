"use client";

import * as React from "react";
import { Trash2, Globe, Server, Wrench, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore, type CartItem, type DomainCartItem, type HivelocityCartItem } from "@/stores/cart-store";
import { getHivelocityPeriodLabel, type HivelocityPeriod } from "@/lib/hivelocity-checkout";

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
    case "hivelocity":
      return <Layers className="h-4 w-4" />;
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
    case "hivelocity":
      return "Hivelocity";
    default:
      return 'Service';
  }
};

// Helper function to format price
const formatPrice = (price?: number, currency?: string) => {
  if (price === undefined || price === null || Number.isNaN(price)) return 'Price not available';
  if (price === 0) return "Free";
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
    case "hivelocity":
      return (item as any).billingCycle || "Monthly";
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
    case "hivelocity":
      return (item as HivelocityCartItem).planName;
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
    case "hivelocity":
      return { price: (item as HivelocityCartItem).totalPrice, currency: (item as HivelocityCartItem).currency };
    default:
      return { price: undefined, currency: undefined };
  }
};

export function CartItemCard({ item, onRemove, hideRemoveButton = false }: CartItemCardProps) {
  const serviceName = getServiceName(item);
  const servicePrice = getServicePrice(item);
  const billingCycle = getBillingCycleLabel(item);
  const serviceType = getServiceTypeLabel(item.type);
  const { removeHivelocityAddon } = useCartStore();

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

              {item.type === "hivelocity" ? (
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {(item as HivelocityCartItem).planType ? (item as HivelocityCartItem).planType : null}
                  </div>
                  <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Hostname</span>
                      <span className="font-medium text-foreground break-all">{(item as HivelocityCartItem).hostname}</span>
                    </div>
                    {(item as HivelocityCartItem).hivelocityPeriod ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Billing period</span>
                        <span className="font-medium text-foreground">
                          {getHivelocityPeriodLabel((item as HivelocityCartItem).hivelocityPeriod as HivelocityPeriod)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {(() => {
                    const hv = item as HivelocityCartItem;
                    const lines =
                      hv.invoiceLines?.length
                        ? hv.invoiceLines
                        : [
                            { id: "base", kind: "base" as const, name: hv.planName, amountExVat: hv.basePrice },
                            ...(hv.os
                              ? [{ id: `os-${hv.os.id}`, kind: "os" as const, name: `OS — ${hv.os.name}`, amountExVat: hv.os.price }]
                              : []),
                            ...hv.addons.map((a) => ({
                              id: `addon-${a.id}`,
                              kind: "addon" as const,
                              name: a.name,
                              amountExVat: a.price,
                            })),
                          ];
                    return (
                      <div className="rounded-md border bg-background/60">
                        <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b">
                          Invoice lines
                        </div>
                        <div className="px-3 py-2 space-y-2">
                          {lines.map((line) => (
                            <div key={line.id} className="flex items-start justify-between gap-2 text-xs">
                              <span className="text-foreground line-clamp-2">{line.name}</span>
                              <span className="font-semibold shrink-0">
                                {line.amountExVat > 0
                                  ? formatPrice(line.amountExVat, hv.currency)
                                  : "Free"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {(item as HivelocityCartItem).addons?.length ? (
                    <div className="rounded-md border bg-background/60">
                      <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b">
                        Removable add-ons
                      </div>
                      <div className="px-3 py-2 space-y-2">
                        {(item as HivelocityCartItem).addons.map((a) => (
                          <div key={a.id} className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-foreground line-clamp-1">{a.name}</div>
                              {a.group ? (
                                <div className="text-[11px] text-muted-foreground line-clamp-1">{a.group}</div>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {!hideRemoveButton ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeHivelocityAddon(item.id, a.id)}
                                  aria-label={`Remove ${a.name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
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
          <span className="text-sm text-muted-foreground">
            {item.type === "hivelocity" ? "Subtotal (ex VAT)" : "Price"}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-primary">
              {formatPrice(
                item.type === "hivelocity"
                  ? (item as HivelocityCartItem).subtotalExVat ?? (item as HivelocityCartItem).totalPrice
                  : servicePrice.price,
                servicePrice.currency,
              )}
            </span>
            {servicePrice.currency && (
              <span className="text-xs text-muted-foreground">
                {servicePrice.currency}
              </span>
            )}
          </div>
        </div>
        {item.type === "hivelocity" && (item as HivelocityCartItem).vatAmount != null ? (
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total incl. VAT</span>
            <span className="font-semibold text-foreground">
              {formatPrice(
                ((item as HivelocityCartItem).subtotalExVat ?? 0) + ((item as HivelocityCartItem).vatAmount ?? 0),
                (item as HivelocityCartItem).currency,
              )}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
