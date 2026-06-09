import * as React from "react";
import { toast } from "sonner";
import {
  useCartStore,
  createDomainBundleCartItem,
  formatDomainBundleLabel,
} from "@npanel/cart-store";
import { usePricing } from "./pricing-context.tsx";
import type { DomainSearchResult } from "./types.ts";

const selectCartDomainNames = (state: ReturnType<typeof useCartStore.getState>) => {
  const domainNames: string[] = [];
  for (const item of state.items) {
    if (item.type === "domain" && item.domain) {
      domainNames.push(item.domain);
    }
    if (item.type === "domain_bundle") {
      for (const entry of item.domains) {
        if (entry.domain) domainNames.push(entry.domain);
      }
    }
  }
  return domainNames.sort().join(",");
};

export function useDomainCart() {
  const { selectedCurrency } = usePricing();
  const addDomain = useCartStore((state) => state.addDomain);
  const addDomainBundle = useCartStore((state) => state.addDomainBundle);
  const removeDomainByName = useCartStore((state) => state.removeDomainByName);
  const removeDomainBundleByDomains = useCartStore((state) => state.removeDomainBundleByDomains);
  const isDomainBundleInCart = useCartStore((state) => state.isDomainBundleInCart);
  const cartDomainNamesHash = useCartStore(selectCartDomainNames);

  const cartDomainSet = React.useMemo(() => {
    if (!cartDomainNamesHash) return new Set<string>();
    return new Set(cartDomainNamesHash.split(",").filter(Boolean));
  }, [cartDomainNamesHash]);

  const isDomainInCart = React.useCallback(
    (domainName: string) => cartDomainSet.has(domainName),
    [cartDomainSet],
  );

  const handleAddToCart = React.useCallback(
    (result: DomainSearchResult) => {
      if (isDomainInCart(result.domain)) return;
      addDomain({
        domain: result.domain,
        status: result.status,
        price: result.price,
        addedInCurrency: selectedCurrency,
      });
      toast.success(`${result.domain} added to cart`);
    },
    [addDomain, isDomainInCart, selectedCurrency],
  );

  const handleRemoveFromCart = React.useCallback(
    (domain: string) => {
      removeDomainByName(domain);
      toast.success(`${domain} removed from cart`);
    },
    [removeDomainByName],
  );

  const handleAddDomainBundle = React.useCallback(
    (params: {
      domains: DomainSearchResult[];
      bundlePrice: number;
      bundleCurrency?: string;
      bundleLabel?: string;
    }) => {
      const domainNames = params.domains.map((d) => d.domain).filter(Boolean);
      if (isDomainBundleInCart(domainNames)) {
        toast.message("This bundle is already in your cart");
        return;
      }
      addDomainBundle(
        createDomainBundleCartItem({
          domains: params.domains.map((result) => ({
            domain: result.domain,
            status: result.status,
            reason: result.reason,
            price: result.price,
          })),
          bundlePrice: params.bundlePrice,
          bundleCurrency: params.bundleCurrency,
          bundleLabel: params.bundleLabel,
          addedInCurrency: selectedCurrency,
        }),
      );
      toast.success("Domain bundle added to cart");
    },
    [addDomainBundle, isDomainBundleInCart, selectedCurrency],
  );

  const handleRemoveDomainBundle = React.useCallback(
    (domainNames: string[]) => {
      removeDomainBundleByDomains(domainNames);
      toast.success("Domain bundle removed from cart");
    },
    [removeDomainBundleByDomains],
  );

  return {
    isDomainInCart,
    isDomainBundleInCart,
    handleAddToCart,
    handleRemoveFromCart,
    handleAddDomainBundle,
    handleRemoveDomainBundle,
  };
}
