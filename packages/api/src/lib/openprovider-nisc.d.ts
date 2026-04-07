export type EnsureOpenProviderResult = {
    subscriptionId?: string;
    pendingVerification: boolean;
};
export declare function ensureOpenProviderAndRegisterDomain(params: {
    ownerId: string;
    createdBy: string;
    domainName: string;
    orderId: string;
    orderItemId: string;
    productId: string;
    productPlanId?: string | null;
    description?: string | null;
    userId: string | null;
    teamId: string | null;
    billingCycle: string | null;
    itemPrice: string;
    currency: string;
}): Promise<EnsureOpenProviderResult>;
/** Result of ensureOpenProviderAndTransferDomain. */
export type EnsureOpenProviderTransferResult = {
    subscriptionId?: string;
    pendingVerification: boolean;
    /** Raw API response from transferDomain (for processor_api_raw_response logging). */
    rawResponse?: unknown;
};
/**
 * Ensure OpenProvider customer + verification, then initiate domain transfer.
 * authCode must be provided (from order item metadata).
 */
export declare function ensureOpenProviderAndTransferDomain(params: {
    ownerId: string;
    createdBy: string;
    domainName: string;
    authCode: string;
    orderId: string;
    orderItemId: string;
    productId: string;
    productPlanId?: string | null;
    description?: string | null;
    userId: string | null;
    teamId: string | null;
    billingCycle: string | null;
    itemPrice: string;
    currency: string;
    nameServers?: Array<{
        name: string;
        ip?: string;
    }>;
    period?: number;
}): Promise<EnsureOpenProviderTransferResult>;
