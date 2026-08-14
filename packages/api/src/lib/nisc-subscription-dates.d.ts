import { DOMAIN_DEFAULT_BILLING_CYCLE, domainBillingCycleFromYears, resolveDomainBillingCycle, resolveDomainRegistrationPeriodYears } from "./nisc-domain-billing-cycle";
export { DOMAIN_DEFAULT_BILLING_CYCLE, domainBillingCycleFromYears, resolveDomainBillingCycle, resolveDomainRegistrationPeriodYears, };
/**
 * When a domain transfer subscription is created: start on the date the transfer
 * process began (request createdAt / order date), not provision-time "now".
 * Prefer createdAt over submittedToProviderAt  the processor stamps the latter
 * at provision time, which would incorrectly overwrite the customer's start date.
 *
 * DB is imported lazily so client-safe re-exports above never pull @npanel/env.
 */
export declare function resolveDomainTransferSubscriptionStartDate(options: {
    domainTransferRequestId?: string | null;
    orderCreatedAt?: Date | null;
    fallback?: Date;
}): Promise<Date>;
export declare function computeSubscriptionExpiryFromBillingCycle(subscriptionDate: Date, billingCycle: string | null | undefined): Date | null;
/**
 * Prefill expiry + next renewal for new subscriptions.
 * - Prefer an explicit registry/provider expiry when provided.
 * - Otherwise derive from billing cycle (null-safe when cycle missing/unknown).
 * - nextRenewalDate mirrors expiryDate (renewal due when the period ends).
 */
export declare function resolveSubscriptionPeriodDates(subscriptionDate: Date, billingCycle: string | null | undefined, options?: {
    expiryOverride?: Date | null;
}): {
    expiryDate: Date | null;
    nextRenewalDate: Date | null;
};
