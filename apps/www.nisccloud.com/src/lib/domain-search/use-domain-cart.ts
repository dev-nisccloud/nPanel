import * as React from "react";
import {
  formatDomainBundleLabel,
} from "@npanel/cart-store";
import { usePricing } from "./pricing-context.tsx";
import type { DomainSearchResult } from "./types.ts";
import {
  buildDomainBundleCartUrl,
  buildDomainRegistrationCartUrl,
  goToStorefrontCart,
} from "@/lib/storefront-cart-url.ts";

export function useDomainCart() {
  const { selectedCurrency } = usePricing();

  const handleAddToCart = React.useCallback(
    (result: DomainSearchResult) => {
      goToStorefrontCart(buildDomainRegistrationCartUrl(result));
    },
    [],
  );

  const handleRemoveFromCart = React.useCallback((_domain: string) => {
    // No-op: cart is URL-driven on the storefront checkout page.
  }, []);

  const handleAddDomainBundle = React.useCallback(
    (params: {
      domains: DomainSearchResult[];
      bundlePrice: number;
      bundleCurrency?: string;
      bundleLabel?: string;
    }) => {
      const label =
        params.bundleLabel ??
        formatDomainBundleLabel(params.domains.map((d) => d.domain));
      goToStorefrontCart(
        buildDomainBundleCartUrl({
          bundleLabel: label,
          bundlePrice: params.bundlePrice,
          currency: params.bundleCurrency ?? selectedCurrency,
        }),
      );
    },
    [selectedCurrency],
  );

  const handleRemoveDomainBundle = React.useCallback((_domainNames: string[]) => {
    // No-op: cart is URL-driven on the storefront checkout page.
  }, []);

  return {
    isDomainInCart: () => false,
    isDomainBundleInCart: () => false,
    handleAddToCart,
    handleRemoveFromCart,
    handleAddDomainBundle,
    handleRemoveDomainBundle,
  };
}
