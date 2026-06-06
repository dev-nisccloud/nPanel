/**
 * When a domain transfer subscription is created: start on transfer request date (or order date), not "now" at provision time.
 */
export declare function resolveDomainTransferSubscriptionStartDate(options: {
    domainTransferRequestId?: string | null;
    orderCreatedAt?: Date | null;
    fallback?: Date;
}): Promise<Date>;
export declare function computeSubscriptionExpiryFromBillingCycle(subscriptionDate: Date, billingCycle: string | null | undefined): Date | null;
