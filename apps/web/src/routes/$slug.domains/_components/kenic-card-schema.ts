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

/** Set for fast lookup (is this TLD KENIC?). */
const KENIC_TLD_SET = new Set(KENIC_SUPPORTED_TLDS);

/**
 * Parse a full domain (e.g. "example.com", "example.co.ke") into name and TLD.
 * Returns null if input doesn't look like a full domain (no dot or invalid).
 */
export function parseFullDomain(input: string): { name: string; tld: string } | null {
	const s = input.trim().toLowerCase().replace(/\s+/g, "");
	const parts = s.split(".");
	if (parts.length < 2 || parts.some((p) => !p.length)) return null;
	// Two-part: example.com → name=example, tld=com
	if (parts.length === 2) {
		return { name: parts[0]!, tld: parts[1]! };
	}
	// Three+ parts: check for Kenyan second-level (e.g. co.ke)
	const last = parts.at(-1) ?? "";
	const secondLast = parts.at(-2) ?? "";
	if (last === "ke" && secondLast) {
		const twoPartTld = `${secondLast}.${last}`;
		if (KENIC_TLD_SET.has(twoPartTld as KenicTldSlug)) {
			return { name: parts.slice(0, -2).join("."), tld: twoPartTld };
		}
	}
	if (last === "ke") {
		return { name: parts.slice(0, -1).join("."), tld: "ke" };
	}
	// Generic: last part is TLD (e.g. example.foo.com → name=example.foo, tld=com)
	return { name: parts.slice(0, -1).join("."), tld: last };
}

/** True if TLD is managed by KENIC. */
export function isKenicTld(tld: string): boolean {
	return KENIC_TLD_SET.has(tld.toLowerCase() as KenicTldSlug);
}

/**
 * If the query ends with a Kenyan TLD (e.g. .co.ke, .ke), strip it and return the name part.
 * Use when sanitizing for OpenProvider so we only send the name (e.g. "fineyakwoyo" not "fineyakwoyo.co.ke").
 * Check longer TLDs first so ".co.ke" is matched before ".ke".
 */
export function stripKenyanTldFromQuery(query: string): string {
	const lower = query.trim().toLowerCase();
	const sorted = [...KENIC_SUPPORTED_TLDS].sort((a, b) => b.length - a.length);
	for (const tld of sorted) {
		if (lower.endsWith("." + tld)) return lower.slice(0, -(tld.length + 1));
	}
	return lower;
}

/** Convert a single normalized domain-check item to KenicCardItem (e.g. for exact match). */
export function normalizedItemToKenicCard(item: {
	domain: string;
	available: boolean;
	reason?: string;
	currency?: string;
	createFee?: { amount: number; currency: string };
	renewFee?: { amount: number; currency: string };
	transferFee?: { amount: number; currency: string };
}): KenicCardItem {
	const domain = item.domain.toLowerCase();
	const parts = domain.split(".");
	const last = parts.at(-1) ?? "";
	const secondLast = parts.at(-2) ?? "";
	const tldDisplay =
		last === "ke" && secondLast && KENIC_TLD_SET.has(`${secondLast}.ke` as KenicTldSlug)
			? `.${secondLast}.ke`
			: last === "ke"
				? ".ke"
				: `.${last}`;
	return {
		domain: item.domain,
		tld: tldDisplay,
		available: item.available,
		reason: item.reason,
		currency: item.currency ?? "KES",
		createPrice: item.createFee?.amount,
		renewPrice: item.renewFee?.amount,
		transferPrice: item.transferFee?.amount,
	};
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
