/**
 * KENIC-managed TLDs (Kenya).
 * Single source of truth for routing and validation.
 * @see https://registry.kenic.or.ke
 */

/**
 * KENIC TLDs we support (subset of registry.kenic.or.ke).
 * .go.ke is excluded: including it in an EPP domain:check causes the server to return 2400 (Command failed).
 */
export const KENIC_TLDS = [
	"ke",       // .ke
	"co.ke",    // .co.ke
	"or.ke",    // .or.ke
	"ne.ke",    // .ne.ke
	"me.ke",    // .me.ke
	"mobi.ke",  // .mobi.ke
	"info.ke",  // .info.ke
	"sc.ke",    // .sc.ke
	"ac.ke",    // .ac.ke
] as const;

export type KenicTld = (typeof KENIC_TLDS)[number];

/** Set for fast lookup (lowercase). */
const KENIC_TLD_SET = new Set(KENIC_TLDS.map((t) => t.toLowerCase()));

/**
 * Returns the list of KENIC TLDs. Use for routing, validation, or UI (e.g. domain search filters).
 */
export function getKenicTlds(): readonly string[] {
	return KENIC_TLDS;
}

/**
 * Extract the effective TLD from a domain name for KENIC (e.g. "example.co.ke" → "co.ke", "test.ke" → "ke").
 * Handles both two-part (example.ke) and three-part (example.co.ke) names.
 */
export function extractKenicTld(domain: string): string | null {
	const lower = domain.toLowerCase().trim();
	const parts = lower.split(".");
	if (parts.length < 2) return null;
	// Try two-part TLD first (e.g. co.ke)
	if (parts.length >= 3) {
		const twoPart = `${parts.at(-2)}.${parts.at(-1)}`;
		if (KENIC_TLD_SET.has(twoPart)) return twoPart;
	}
	const onePart = parts.at(-1) ?? "";
	if (KENIC_TLD_SET.has(onePart)) return onePart;
	return null;
}

/**
 * True if the domain is under a KENIC TLD (e.g. example.ke, test.co.ke).
 */
export function isKenicDomain(domain: string): boolean {
	return extractKenicTld(domain) !== null;
}

/**
 * Validate that all given domains are under a KENIC TLD.
 * Returns { valid: true } or { valid: false, invalidDomains: string[] }.
 */
export function validateKenicDomains(domains: string[]): { valid: true } | { valid: false; invalidDomains: string[] } {
	const invalid = domains.filter((d) => !isKenicDomain(d));
	if (invalid.length === 0) return { valid: true };
	return { valid: false, invalidDomains: invalid };
}
