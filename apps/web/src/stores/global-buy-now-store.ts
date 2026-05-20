import { create } from "zustand";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

export type GlobalBuyNowMode = "product" | "cart" | "transfer";

export interface ProductContext {
  productId: string;
  productName: string;
  /** When buying a domain, pass the search result for pricing/name */
  domain?: DomainSearchResult | null;
}

/** Context for domain transfer checkout: pay then createFromPayment with domain_transfer item (fire-and-forget). */
export interface TransferContext {
  domain: string;
  authCode: string;
  price: number;
  currency: string;
  productId: string;
  productName?: string;
  /** Created via domainTransfer.createCheckoutRequest before payment */
  domainTransferRequestId: string;
  provider: "kenic" | "openprovider";
  /** For customer/team checkout */
  teamId?: string;
}

interface GlobalBuyNowState {
  open: boolean;
  mode: GlobalBuyNowMode;
  /** Set when mode is "product" */
  productContext: ProductContext | null;
  /** Set when mode is "transfer" */
  transferContext: TransferContext | null;
  openForProduct: (ctx: ProductContext) => void;
  openForCart: () => void;
  openForTransfer: (ctx: TransferContext) => void;
  close: () => void;
}

export const useGlobalBuyNowStore = create<GlobalBuyNowState>((set) => ({
  open: false,
  mode: "product",
  productContext: null,
  transferContext: null,
  openForProduct: (ctx) =>
    set({ open: true, mode: "product", productContext: ctx, transferContext: null }),
  openForCart: () =>
    set({ open: true, mode: "cart", productContext: null, transferContext: null }),
  openForTransfer: (ctx) =>
    set({ open: true, mode: "transfer", productContext: null, transferContext: ctx }),
  close: () =>
    set({ open: false, mode: "product", productContext: null, transferContext: null }),
}));
