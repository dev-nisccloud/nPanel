/**
 * KENIC-managed TLDs (Kenya).
 * Single source of truth for routing and validation.
 * @see https://registry.kenic.or.ke
 */
/**
 * KENIC TLDs we support (subset of registry.kenic.or.ke).
 * .go.ke is excluded: including it in an EPP domain:check causes the server to return 2400 (Command failed).
 */
export declare const KENIC_TLDS: readonly ["ke", "co.ke", "or.ke", "ne.ke", "me.ke", "mobi.ke", "info.ke", "sc.ke", "ac.ke"];
export type KenicTld = (typeof KENIC_TLDS)[number];
/**
 * Returns the list of KENIC TLDs. Use for routing, validation, or UI (e.g. domain search filters).
 */
export declare function getKenicTlds(): readonly string[];
/**
 * Extract the effective TLD from a domain name for KENIC (e.g. "example.co.ke" → "co.ke", "test.ke" → "ke").
 * Handles both two-part (example.ke) and three-part (example.co.ke) names.
 */
export declare function extractKenicTld(domain: string): string | null;
/**
 * True if the domain is under a KENIC TLD (e.g. example.ke, test.co.ke).
 */
export declare function isKenicDomain(domain: string): boolean;
/**
 * Validate that all given domains are under a KENIC TLD.
 * Returns { valid: true } or { valid: false, invalidDomains: string[] }.
 */
export declare function validateKenicDomains(domains: string[]): {
    valid: true;
} | {
    valid: false;
    invalidDomains: string[];
};
