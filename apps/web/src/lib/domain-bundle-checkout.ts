import type { DomainSearchResult } from "@/hooks/use-domain-search";
import type { DomainBundleCheckoutContext } from "@/stores/global-buy-now-store";
import {
  createBundleId,
  formatDomainBundleLabel,
} from "@npanel/cart-store";

/** All bundle prices are converted to KES, summed, then a single 15% margin is applied. */
export const BUNDLE_TARGET_CURRENCY = "KES";
export const BUNDLE_GLOBAL_MARGIN_MULTIPLIER = 1.15;

export type BundleBasePrice = { amount: number; currency: string };

export { formatDomainBundleLabel };

/** Reseller/base price for a domain search result (no per-domain margin). */
export function getDomainResultBasePrice(result: DomainSearchResult): BundleBasePrice | null {
	const reseller = result.price?.reseller;
	if (reseller?.price == null || typeof reseller.price !== "number" || Number.isNaN(reseller.price)) {
		return null;
	}
	return { amount: reseller.price, currency: reseller.currency ?? BUNDLE_TARGET_CURRENCY };
}

export function getDomainResultsBasePrices(results: DomainSearchResult[]): BundleBasePrice[] {
	return results
		.map(getDomainResultBasePrice)
		.filter((p): p is BundleBasePrice => p != null);
}

export function applyBundleGlobalMargin(totalBaseKes: number): number {
	return Math.ceil(totalBaseKes * BUNDLE_GLOBAL_MARGIN_MULTIPLIER);
}

export async function calculateBundleTotalKes(
	basePrices: BundleBasePrice[],
	convertPricesBatch: (
		prices: BundleBasePrice[],
		targetCurrency: string,
	) => Promise<Array<{ convertedAmount?: number }>>,
): Promise<number | null> {
	if (basePrices.length === 0) return null;
	try {
		const converted = await convertPricesBatch(basePrices, BUNDLE_TARGET_CURRENCY);
		if (!converted?.length) return null;
		const totalBaseKes = converted.reduce((sum, c) => sum + (c.convertedAmount ?? 0), 0);
		if (totalBaseKes <= 0) return null;
		return applyBundleGlobalMargin(totalBaseKes);
	} catch {
		return null;
	}
}

export function createDomainBundleCheckoutContext(params: {
	domains: DomainSearchResult[];
	bundlePrice: number;
	bundleCurrency?: string;
	bundleLabel?: string;
}): DomainBundleCheckoutContext {
	const domainNames = params.domains.map((d) => d.domain).filter(Boolean);
	return {
		bundleId: createBundleId(),
		bundlePrice: params.bundlePrice,
		bundleCurrency: params.bundleCurrency ?? "KES",
		bundleLabel: params.bundleLabel ?? formatDomainBundleLabel(domainNames),
		domains: params.domains,
	};
}
