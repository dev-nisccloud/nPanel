/**
 * Independent schema for Kenyan TLD card UI data.
 * Transforms KENIC EPP domain check normalized response into a stable shape for the agency domain cards.
 * No dependency on OpenProvider or DomainSearchResult; used only for .ke TLDs.
 */

export const KENIC_SUPPORTED_TLDS = [
	"ke",
	"co.ke",
	"or.ke",
	"ne.ke",
	"me.ke",
	"mobi.ke",
	"info.ke",
	"sc.ke",
	"ac.ke",
] as const;

export type KenicTldSlug = (typeof KENIC_SUPPORTED_TLDS)[number];

/** One TLD card row from KENIC normalized response. */
export interface KenicCardItem {
	/** Full domain, e.g. "nisccloud.ke" */
	domain: string;
	/** Display TLD with dot, e.g. ".ke" */
	tld: string;
	/** Whether the domain is available for registration */
	available: boolean;
	/** Reason when not available (e.g. "The domain exists") */
	reason?: string;
	/** Currency code, e.g. "KES" */
	currency: string;
	/** Create/registration fee (1 year) - display as-is, no conversion */
	createPrice?: number;
	/** Renewal fee - display as-is */
	renewPrice?: number;
	/** Transfer fee - display as-is */
	transferPrice?: number;
}

/**
 * Build list of domains to check from search query.
 * Example: "nisccloud" → ["nisccloud.ke", "nisccloud.co.ke", ...]
 */
export function buildKenicDomainsFromQuery(searchQuery: string): string[] {
	const name = searchQuery.trim().toLowerCase().replace(/\s+/g, "");
	if (!name) return [];
	return KENIC_SUPPORTED_TLDS.map((tld) => `${name}.${tld}`);
}

/**
 * Transform KENIC normalized check result into KenicCardItem[].
 * Preserves order by TLD list; missing or failed entries are still included with available: false.
 */
export function normalizeToKenicCards(
	searchQuery: string,
	normalized: Array<{
		domain: string;
		available: boolean;
		reason?: string;
		currency?: string;
		createFee?: { amount: number; currency: string };
		renewFee?: { amount: number; currency: string };
		transferFee?: { amount: number; currency: string };
	}>
): KenicCardItem[] {
	const name = searchQuery.trim().toLowerCase().replace(/\s+/g, "");
	if (!name) return [];

	const byDomain = new Map(
		normalized.map((item) => [
			item.domain.toLowerCase(),
			{
				available: item.available,
				reason: item.reason,
				currency: item.currency ?? "KES",
				createPrice: item.createFee?.amount,
				renewPrice: item.renewFee?.amount,
				transferPrice: item.transferFee?.amount,
			},
		])
	);

	return KENIC_SUPPORTED_TLDS.map((tldSlug) => {
		const domain = `${name}.${tldSlug}`;
		const tldDisplay = tldSlug === "ke" ? ".ke" : `.${tldSlug}`;
		const data = byDomain.get(domain);
		if (data) {
			return {
				domain,
				tld: tldDisplay,
				available: data.available,
				reason: data.reason,
				currency: data.currency,
				createPrice: data.createPrice,
				renewPrice: data.renewPrice,
				transferPrice: data.transferPrice,
			};
		}
		return {
			domain,
			tld: tldDisplay,
			available: false,
			currency: "KES",
			reason: "Check failed or not returned",
		};
	});
}
