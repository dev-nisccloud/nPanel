/**
 * KENIC EPP single-domain availability check.
 * Used by domain-transfer when RDAP is unavailable or unreliable for .ke TLDs.
 */
/**
 * Check availability AND registration fee for a single KENIC domain in one EPP
 * connection by using the fee extension (`buildDomainCheckWithFeeXml`).
 *
 * KENIC registry quirk: when a domain is available the registry sometimes does
 * not populate fee:chkData, so `createFee` may come back null even on success.
 * Callers should fall back to a known-registered domain of the same TLD in that
 * case (see `getKenicPricingFromFallbacks` in kenic-pricing.ts).
 *
 * Returns null on EPP error (no credentials, timeout, parse failure).
 */
export declare function checkKenicAvailabilityAndFee(domain: string): Promise<{
    available: boolean;
    createFee: {
        amount: number;
        currency: string;
    } | null;
} | null>;
/**
 * Check if a single KENIC domain is available (true) or taken (false).
 * Returns null on EPP error (e.g. no credentials, timeout, parse error).
 */
export declare function checkKenicAvailability(domain: string): Promise<{
    available: boolean;
} | null>;
