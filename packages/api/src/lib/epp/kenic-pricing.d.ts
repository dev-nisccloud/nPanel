/**
 * KENIC EPP domain check with fee   returns create and transfer pricing only.
 * Used for transfer flow (and registration) where we show price and "we'll check availability".
 */
export interface KenicPricingResult {
    createFee: {
        amount: number;
        currency: string;
    } | null;
    transferFee: {
        amount: number;
        currency: string;
    } | null;
}
/**
 * Get KENIC create and transfer fees for a TLD using only the known-registered
 * fallback domains - no random-placeholder attempts. This is faster than
 * `getKenicPricingForTld` and suitable for agent-internal tools where latency
 * matters (at most 3 EPP connections instead of up to 15 + fallbacks).
 *
 * Returns null when the TLD has no known fallback domains or all fail.
 */
export declare function getKenicPricingFromFallbacks(extension: string): Promise<KenicPricingResult | null>;
/**
 * Get KENIC create and transfer fees for a TLD by running a check on a domain.
 * Tries random placeholders first; if the registry returns "available" with no fee info (common),
 * falls back to known-registered domains for that TLD so we get real-time transfer/create pricing.
 */
export declare function getKenicPricingForTld(extension: string): Promise<KenicPricingResult | null>;
/**
 * Get KENIC create and transfer fees for one domain (no availability check).
 * Uses EPP domain check with fee extension; returns pricing only.
 */
export declare function getKenicPricing(domain: string): Promise<KenicPricingResult | null>;
