import { addBillingCycleToDate } from "./nisc-order-invoice-line-items";
import { DOMAIN_DEFAULT_BILLING_CYCLE, domainBillingCycleFromYears, resolveDomainBillingCycle, resolveDomainRegistrationPeriodYears, } from "./nisc-domain-billing-cycle";
export { DOMAIN_DEFAULT_BILLING_CYCLE, domainBillingCycleFromYears, resolveDomainBillingCycle, resolveDomainRegistrationPeriodYears, };
/**
 * When a domain transfer subscription is created: start on the date the transfer
 * process began (request createdAt / order date), not provision-time "now".
 * Prefer createdAt over submittedToProviderAt  the processor stamps the latter
 * at provision time, which would incorrectly overwrite the customer's start date.
 *
 * DB is imported lazily so client-safe re-exports above never pull @npanel/env.
 */
export async function resolveDomainTransferSubscriptionStartDate(options) {
    const fallback = options.fallback ?? new Date();
    const requestId = options.domainTransferRequestId?.trim();
    if (requestId) {
        const { eq, db } = await import("@npanel/db");
        const { domainTransferRequest } = await import("@npanel/db/schema/domain-transfer-requests");
        const [row] = await db
            .select({
            createdAt: domainTransferRequest.createdAt,
            submittedToProviderAt: domainTransferRequest.submittedToProviderAt,
        })
            .from(domainTransferRequest)
            .where(eq(domainTransferRequest.id, requestId))
            .limit(1);
        if (row?.createdAt)
            return row.createdAt;
        if (row?.submittedToProviderAt)
            return row.submittedToProviderAt;
    }
    if (options.orderCreatedAt)
        return options.orderCreatedAt;
    return fallback;
}
export function computeSubscriptionExpiryFromBillingCycle(subscriptionDate, billingCycle) {
    return addBillingCycleToDate(subscriptionDate, billingCycle);
}
/**
 * Prefill expiry + next renewal for new subscriptions.
 * - Prefer an explicit registry/provider expiry when provided.
 * - Otherwise derive from billing cycle (null-safe when cycle missing/unknown).
 * - nextRenewalDate mirrors expiryDate (renewal due when the period ends).
 */
export function resolveSubscriptionPeriodDates(subscriptionDate, billingCycle, options) {
    const override = options?.expiryOverride ?? null;
    const expiry = override ??
        computeSubscriptionExpiryFromBillingCycle(subscriptionDate, billingCycle);
    if (!expiry) {
        return { expiryDate: null, nextRenewalDate: null };
    }
    return { expiryDate: expiry, nextRenewalDate: expiry };
}
