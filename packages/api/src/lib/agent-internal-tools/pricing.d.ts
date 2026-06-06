/**
 * Retail pricing helper for agent-internal tools.
 *
 * Mirrors exactly what the domain search UI does client-side in
 * `apps/web/src/hooks/use-domain-pricing.ts`:
 *   1. Apply the platform-default TLD margin (from DB) to the reseller/wholesale price.
 *   2. Convert the result to the user's target currency via cached exchange rates.
 *
 * Both the DB lookup and the exchange-rate HTTP fetch are memoised at the
 * process level with short TTLs so the agent can call this per-domain without
 * hammering external services.
 */
export interface RetailPrice {
    /** Final display amount, rounded up to a whole number (matches agency /domains). */
    amount: number;
    /** ISO 4217 code for the display currency. */
    currency: string;
    /** Human-readable formatted string, e.g. "KSh 1,450" or "$ 13". */
    formatted: string;
}
/**
 * Apply the platform-default TLD margin to a reseller price, then convert
 * it to `targetCurrency`. Returns null only when conversion is impossible
 * (no rates available and currencies differ).
 */
export declare function toRetailPrice(resellerAmount: number, resellerCurrency: string, targetCurrency: string): Promise<RetailPrice | null>;
/** Fallback display currency when team has no baseCurrency set. */
export declare const DEFAULT_DISPLAY_CURRENCY = "KES";
