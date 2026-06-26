import * as React from "react";
import { toast } from "sonner";
import {
  formatDomainBundleLabel,
} from "@npanel/cart-store";
import { usePricing } from "./pricing-context.tsx";
import type { DomainSearchResult } from "./types.ts";
import {
  buildDomainBundleCartParams,
  buildDomainRegistrationCartParams,
  navigateToStorefrontCart,
} from "@/lib/storefront-cart-url.ts";

export function useDomainCart() {
  const { selectedCurrency } = usePricing();

  const handleAddToCart = React.useCallback(async (result: DomainSearchResult) => {
    try {
      await navigateToStorefrontCart(buildDomainRegistrationCartParams(result));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open checkout.");
    }
  }, []);

  const handleRemoveFromCart = React.useCallback((_domain: string) => {
    // No-op: cart is handoff-driven on the storefront checkout page.
  }, []);

  const handleAddDomainBundle = React.useCallback(
    async (params: {
      domains: DomainSearchResult[];
      bundlePrice: number;
      bundleCurrency?: string;
      bundleLabel?: string;
    }) => {
      const label =
        params.bundleLabel ??
        formatDomainBundleLabel(params.domains.map((d) => d.domain));
      try {
        await navigateToStorefrontCart(
          buildDomainBundleCartParams({
            domains: params.domains.map((d) => d.domain),
            bundleLabel: label,
            currency: params.bundleCurrency ?? selectedCurrency,
          }),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not open checkout.");
      }
    },
    [selectedCurrency],
  );

  const handleRemoveDomainBundle = React.useCallback((_domainNames: string[]) => {
    // No-op: cart is handoff-driven on the storefront checkout page.
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
