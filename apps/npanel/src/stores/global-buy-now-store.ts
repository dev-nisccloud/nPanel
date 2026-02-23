import { create } from "zustand";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

export type GlobalBuyNowMode = "product" | "cart";

export interface ProductContext {
  productId: string;
  productName: string;
  /** When buying a domain, pass the search result for pricing/name */
  domain?: DomainSearchResult | null;
}

interface GlobalBuyNowState {
  open: boolean;
  mode: GlobalBuyNowMode;
  /** Set when mode is "product" */
  productContext: ProductContext | null;
  openForProduct: (ctx: ProductContext) => void;
  openForCart: () => void;
  close: () => void;
}

export const useGlobalBuyNowStore = create<GlobalBuyNowState>((set) => ({
  open: false,
  mode: "product",
  productContext: null,
  openForProduct: (ctx) =>
    set({ open: true, mode: "product", productContext: ctx }),
  openForCart: () =>
    set({ open: true, mode: "cart", productContext: null }),
  close: () =>
    set({ open: false, mode: "product", productContext: null }),
}));
