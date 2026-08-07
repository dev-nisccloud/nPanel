/**
 * When a domain transfer subscription is created: start on transfer request date (or order date), not "now" at provision time.
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
