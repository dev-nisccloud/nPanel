export type ManualRegistrantDetails = {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    country: string;
    postalCode?: string | null;
    phone: string;
    state?: string | null;
};
export type EnsureOpenProviderResult = {
    subscriptionId?: string;
    pendingVerification: boolean;
    /** Non-fatal post-provision issues (e.g. transfer lock failed). */
    warnings?: string[];
};
export declare function ensureOpenProviderAndRegisterDomain(params: {
    ownerId: string | null;
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
    nameServers?: Array<{
        name: string;
        ip?: string;
    }>;
    manualDetails?: ManualRegistrantDetails;
    /** Explicit registration years from checkout (takes precedence over billingCycle). */
    period?: number;
    metadata?: unknown;
}): Promise<EnsureOpenProviderResult>;
/** Result of ensureOpenProviderAndTransferDomain. */
export type EnsureOpenProviderTransferResult = {
    subscriptionId?: string;
    pendingVerification: boolean;
    /** Raw API response from transferDomain (for processor_api_raw_response logging). */
    rawResponse?: unknown;
    /** Non-fatal post-provision issues (e.g. transfer lock failed). */
    warnings?: string[];
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
    metadata?: unknown;
    manualDetails?: ManualRegistrantDetails;
    domainTransferRequestId?: string | null;
    orderCreatedAt?: Date | null;
}): Promise<EnsureOpenProviderTransferResult>;
