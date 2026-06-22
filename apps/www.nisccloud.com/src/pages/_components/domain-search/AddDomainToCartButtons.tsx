import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button.tsx";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";

export interface AddDomainToCartButtonsProps {
  domain: string;
  displayResult: DomainSearchResult;
  isAvailable: boolean;
  priceReady: boolean;
  isDomainInCart?: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart?: (domain: string) => void;
  primaryLabel?: string;
}

export function AddDomainToCartButtons({
  displayResult,
  isAvailable,
  priceReady,
  onAddToCart,
  primaryLabel = "Buy now",
}: AddDomainToCartButtonsProps) {
  const handlePrimary = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isAvailable && priceReady) onAddToCart(displayResult);
  };

  if (!isAvailable) {
    return (
      <Button size="sm" variant="outline" disabled className="text-xs h-8 px-3">
        Not available
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="default"
      onClick={handlePrimary}
      className="text-xs h-8 px-3 cursor-pointer"
      disabled={!priceReady}
    >
      {primaryLabel}
    </Button>
  );
}
