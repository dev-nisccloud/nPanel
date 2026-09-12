import { create } from "zustand";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

export type GlobalBuyNowMode = "product" | "cart" | "transfer";

/** Checkout context when purchasing multiple domains as one bundle. */
export interface DomainBundleCheckoutContext {
	bundleId: string;
	bundlePrice: number;
	bundleCurrency: string;
	bundleLabel: string;
	domains: DomainSearchResult[];
}

/** Paid catalog upgrade of an existing nisc client subscription. */
export interface ProductUpgradeContext {
	subscriptionId: string;
	/** Catalog plan the subscription is currently on, when known. */
	currentPlanId?: string | null;
	/** Only show catalog plans with a higher sortOrder than this. */
	minSortOrder: number;
	primaryDomain?: string | null;
}

export interface ProductContext {
	productId: string;
	productName: string;
	/** When buying a single domain, pass the search result for pricing/name */
	domain?: DomainSearchResult | null;
	/** When buying a domain bundle, pass bundle pricing and all domains in the bundle */
	domainBundle?: DomainBundleCheckoutContext | null;
	teamId?: string;
	/** When set, checkout is an upgrade of this subscription (higher catalog plans only). */
	upgrade?: ProductUpgradeContext;
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
