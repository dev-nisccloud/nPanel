import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button.tsx";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";

export interface AddDomainToCartButtonsProps {
  domain: string;
  displayResult: DomainSearchResult;
  isAvailable: boolean;
  priceReady: boolean;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  primaryLabel?: string;
}

export function AddDomainToCartButtons({
  domain,
  displayResult,
  isAvailable,
  priceReady,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
  primaryLabel = "Add to cart",
}: AddDomainToCartButtonsProps) {
  const isInCart = isDomainInCart(domain);

  const handlePrimary = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isInCart) {
      onRemoveFromCart(domain);
      return;
    }
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
      variant={isInCart ? "secondary" : "default"}
      onClick={handlePrimary}
      className="text-xs h-8 px-3 cursor-pointer"
      disabled={!priceReady && !isInCart}
    >
      {isInCart ? "In cart" : primaryLabel}
    </Button>
  );
}
