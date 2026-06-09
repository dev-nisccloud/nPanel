import * as React from "react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { formatPrice } from "@/lib/domain-search/format-price.ts";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { AddDomainToCartButtons } from "./AddDomainToCartButtons.tsx";

export interface DomainResultRowProps {
  domain: string;
  isAvailable: boolean;
  displayPrice?: number;
  displayCurrency?: string;
  reason?: string | null;
  displayResult: DomainSearchResult;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
}

export function DomainResultRow({
  domain,
  isAvailable,
  displayPrice,
  displayCurrency,
  reason,
  displayResult,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
}: DomainResultRowProps) {
  const priceReady =
    isAvailable &&
    displayPrice != null &&
    !Number.isNaN(displayPrice) &&
    Boolean(displayCurrency);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-sm text-foreground truncate" title={domain}>
            {domain}
          </span>
          <Badge
            className={
              isAvailable
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs shrink-0"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs shrink-0"
            }
          >
            {isAvailable ? "Available" : "Taken"}
          </Badge>
        </div>
        {reason != null && reason !== "" && (
          <div className="text-[11px] text-muted-foreground line-clamp-2" title={reason}>
            {reason}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {priceReady && (
          <div className="text-right">
            <span className="font-bold text-sm text-primary">
              {formatPrice(displayPrice!, displayCurrency!)}
            </span>
            <span className="text-sm text-foreground"> /1st yr</span>
          </div>
        )}
        <AddDomainToCartButtons
          domain={domain}
          displayResult={displayResult}
          isAvailable={isAvailable}
          priceReady={priceReady}
          isDomainInCart={isDomainInCart}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
        />
      </div>
    </div>
  );
}

export function DomainResultList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const items = React.Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < items.length - 1 && <div className="border-b border-border" aria-hidden />}
        </React.Fragment>
      ))}
    </div>
  );
}
