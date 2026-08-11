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
    /** Plaintext EPP auth code set at create  store locally; CoCCA will not return it later. */
    authInfo: string;
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
/** CoCCA returns a one-way hash from domain:info  never treat those as displayable codes. */
export declare function isCoccaAuthInfoHash(value: string | null | undefined): boolean;
/**
 * Generate a plaintext EPP auth code, push it to KENIC via domain:update, and return it.
 * Callers must persist the returned value (CoCCA will not give it back later).
 */
export declare function setKenicDomainAuthCode(domainName: string, authCode?: string): Promise<string>;
/**
 * Enable or disable KENIC transfer lock (clientTransferProhibited).
 * Best-effort after successful registration/transfer  callers should not fail provision on lock errors.
 */
export declare function setKenicTransferLock(domainName: string, locked?: boolean): Promise<void>;
