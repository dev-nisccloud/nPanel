export type EnsureKenicIntegrationResult = {
    contactId: string;
};
/**
 * Ensure the owner has a KENIC EPP contact (registrant). Creates CustomerIntegration
 * with platformCustomerId = contact id if not present; creates the contact via EPP if needed.
 */
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
export declare function ensureKenicIntegration(ownerId: string | null, createdBy: string, options?: {
    logContext?: {
        niscOrderId: string;
        orderItemId: string;
    };
    manualDetails?: ManualRegistrantDetails;
}): Promise<EnsureKenicIntegrationResult>;
export type RegisterKenicDomainResult = {
    success: true;
    domain: string;
    exDate?: string | null;
};
/**
 * Register a domain with KENIC via EPP. Contact must already exist (call ensureKenicIntegration first).
 */
export declare function registerKenicDomain(params: {
    domainName: string;
    registrantContactId: string;
    period?: number;
    orderId?: string;
    orderItemId?: string;
    nameServers?: Array<{
        name: string;
        ip?: string;
    }>;
}): Promise<RegisterKenicDomainResult>;
