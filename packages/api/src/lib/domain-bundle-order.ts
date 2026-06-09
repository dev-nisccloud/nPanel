/**
 * Domain bundle order helpers: metadata shape, invoice grouping, provisioning identity.
 * Checkout creates N order items (one per domain) linked by bundleId; invoice collapses to one line.
 */

export type DomainBundleOrderMetadata = {
	bundleId: string;
	bundleLabel: string;
	bundlePrice: number;
	domains: string[];
	/** True on the single line item that carries the bundle price for order totals / invoice. */
	isBundleLeadItem: boolean;
};

export const DOMAIN_BUNDLE_METADATA_KEY = "domainBundle" as const;

export function parseDomainBundleMetadata(
	metadata: unknown,
): DomainBundleOrderMetadata | null {
	if (!metadata || typeof metadata !== "object") return null;
	const raw = (metadata as Record<string, unknown>)[DOMAIN_BUNDLE_METADATA_KEY];
	if (!raw || typeof raw !== "object") return null;
	const obj = raw as Record<string, unknown>;
	const bundleId = typeof obj.bundleId === "string" ? obj.bundleId.trim() : "";
	const bundleLabel = typeof obj.bundleLabel === "string" ? obj.bundleLabel.trim() : "";
	const bundlePrice =
		typeof obj.bundlePrice === "number" && Number.isFinite(obj.bundlePrice)
			? obj.bundlePrice
			: typeof obj.bundlePrice === "string"
				? Number.parseFloat(obj.bundlePrice)
				: NaN;
	const domains = Array.isArray(obj.domains)
		? obj.domains.filter((d): d is string => typeof d === "string" && d.trim().length > 0)
		: [];
	const isBundleLeadItem = obj.isBundleLeadItem === true;
	if (!bundleId || !Number.isFinite(bundlePrice) || domains.length === 0) return null;
	return {
		bundleId,
		bundleLabel: bundleLabel || domains.join(" + "),
		bundlePrice,
		domains,
		isBundleLeadItem,
	};
}

export function isDomainBundleOrderItem(metadata: unknown): boolean {
	return parseDomainBundleMetadata(metadata) != null;
}

export function isDomainBundleLeadItem(metadata: unknown): boolean {
	const bundle = parseDomainBundleMetadata(metadata);
	return bundle?.isBundleLeadItem === true;
}

export type OrderItemForBundleInvoice = {
	itemPrice: string;
	itemSubtotal: string;
	primaryDomain: string | null | undefined;
	description: string | null | undefined;
	metadata: unknown;
	product: { name: string; serviceType?: string | null };
	productPlan: { name: string } | null;
	billingCycle: string | null | undefined;
};

export type DomainBundleInvoiceGroup = {
	bundleId: string;
	bundleLabel: string;
	bundlePrice: number;
	domains: string[];
	leadItem: OrderItemForBundleInvoice;
};

/** Groups bundle order items by bundleId for a single invoice line per bundle. */
export function groupDomainBundleItemsForInvoice<T extends OrderItemForBundleInvoice>(
	items: T[],
): { bundleGroups: DomainBundleInvoiceGroup[]; nonBundleItems: T[] } {
	const bundleGroups = new Map<string, DomainBundleInvoiceGroup>();
	const nonBundleItems: T[] = [];

	for (const item of items) {
		const bundle = parseDomainBundleMetadata(item.metadata);
		if (!bundle) {
			nonBundleItems.push(item);
			continue;
		}
		const existing = bundleGroups.get(bundle.bundleId);
		if (!existing) {
			bundleGroups.set(bundle.bundleId, {
				bundleId: bundle.bundleId,
				bundleLabel: bundle.bundleLabel,
				bundlePrice: bundle.bundlePrice,
				domains: bundle.domains,
				leadItem: item,
			});
			continue;
		}
		if (bundle.isBundleLeadItem) {
			existing.leadItem = item;
			existing.bundlePrice = bundle.bundlePrice;
		}
	}

	return { bundleGroups: Array.from(bundleGroups.values()), nonBundleItems };
}

export function buildDomainBundleInvoiceLineName(domains: string[]): string {
	const list = domains.join(", ");
	return list ? `Domains Bundle (${list}) - Registration` : "Domains Bundle - Registration";
}

export function buildDomainBundleInvoiceLineDescription(
	domains: string[],
	subscriptionPeriod: string,
): string {
	const domainList = domains.join(", ");
	return domainList ? `${domainList}\n${subscriptionPeriod}` : subscriptionPeriod;
}

export function orderItemsIncludeDomainBundle(items: Array<{ metadata: unknown }>): boolean {
	return items.some((i) => isDomainBundleOrderItem(i.metadata));
}
