/**
 * Client-safe domain billing-cycle helpers (no DB / env imports).
 * Keep this module free of @npanel/db so web SSR can import it.
 */
/** Domains (registration + transfer) are billed yearly when checkout omits a cycle. */
export declare const DOMAIN_DEFAULT_BILLING_CYCLE: "YEARLY";
export declare function resolveDomainBillingCycle(billingCycle: string | null | undefined): string;
/** Map registration duration (years) to a supported billing-cycle enum value. */
export declare function domainBillingCycleFromYears(years: number): string;
/**
 * Years to register/transfer at the provider.
 * Prefer explicit metadata.registrationPeriodYears (from multi-year checkout),
 * else derive from billing cycle.
 */
export declare function resolveDomainRegistrationPeriodYears(billingCycle: string | null | undefined, metadata?: unknown): number;
