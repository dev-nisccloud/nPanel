import type { OpenProviderConfig, OpenProviderAuthRequest, OpenProviderAuthResponse, OpenProviderTldRequest, OpenProviderTldResponse, OpenProviderDomainCheckRequest, OpenProviderDomainCheckResponse, OpenProviderCustomerRequest, OpenProviderCustomerResponse, OpenProviderCustomerSearchRequest, OpenProviderCustomerSearchResponse, OpenProviderDomainRegistrationRequest, OpenProviderDomainRegistrationResponse, OpenProviderDomainTransferRequest, OpenProviderDomainTransferResponse, OpenProviderDomainSearchRequest, OpenProviderDomainSearchResponse, OpenProviderDomainUpdateRequest, OpenProviderDomainUpdateResponse, OpenProviderDomainRenewalRequest, OpenProviderDomainRenewalResponse, OpenProviderAuthCodeResponse, OpenProviderAuthCodeResetRequest, OpenProviderAuthCodeResetResponse, OpenProviderDnsZoneRequest, OpenProviderDnsZoneResponse, OpenProviderDnsZoneSearchRequest, OpenProviderDnsZoneSearchResponse, OpenProviderDnsZoneUpdateRequest, OpenProviderDnsZoneUpdateResponse, OpenProviderDomainPricingRequest, OpenProviderDomainPricingResponse, OpenProviderAdditionalDataRequest, OpenProviderAdditionalDataResponse, OpenProviderCustomerAdditionalDataRequest, OpenProviderCustomerAdditionalDataResponse } from '../types/openprovider';
export declare class OpenProviderApiError extends Error {
    code: number;
    description: string;
    originalError?: Error | undefined;
    /** Full API response body when error is from OpenProvider API (status >= 400 or code !== 0). */
    readonly rawResponse?: unknown;
    constructor(code: number, description: string, originalError?: Error | undefined, rawResponse?: unknown);
}
/**
 * Extract a rich human-readable error description from an OpenProvider API response body.
 * Inspects registry, data, message, and warnings fields - the same extraction used for HTTP >= 400
 * responses - so callers that receive non-zero codes on HTTP 200 responses get the same detail.
 */
export declare function buildOpenProviderApiError(responseData: unknown, fallbackDesc?: string, httpStatusCode?: number): OpenProviderApiError;
export declare class OpenProviderClient {
    private token;
    private baseUrl;
    constructor(config: OpenProviderConfig);
    /**
     * Set authentication token
     */
    setToken(token: string): void;
    /**
     * Check if client is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Make HTTP request using undici
     */
    private makeRequest;
    /**
     * Authenticate with OpenProvider API
     */
    authenticate(credentials: OpenProviderAuthRequest): Promise<OpenProviderAuthResponse>;
    /**
     * Get TLDs with pricing and configuration
     */
    getTlds(params?: OpenProviderTldRequest): Promise<OpenProviderTldResponse>;
    /**
     * Check domain availability and pricing
     */
    checkDomains(params: OpenProviderDomainCheckRequest): Promise<OpenProviderDomainCheckResponse>;
    /**
     * Create a new customer handle
     */
    createCustomer(params: OpenProviderCustomerRequest): Promise<OpenProviderCustomerResponse>;
    /**
     * Search existing customer handles
     */
    searchCustomers(params?: OpenProviderCustomerSearchRequest): Promise<OpenProviderCustomerSearchResponse>;
    /**
     * Update an existing customer handle
     */
    updateCustomer(handle: string, params: Partial<OpenProviderCustomerRequest>): Promise<OpenProviderCustomerResponse>;
    getCustomer(handle: string): Promise<{
        code: number;
        desc: string;
        data: Record<string, unknown>;
    }>;
    /**
     * Start email verification for gTLD
     */
    startEmailVerification(params: {
        email: string;
        handle: string;
        language?: string;
    }): Promise<{
        code: number;
        desc: string;
        data: {
            id: string;
        };
    }>;
    /**
     * Check email verification status
     */
    checkEmailVerificationStatus(params: {
        domain?: string;
        handle?: string;
        email?: string;
        status?: string;
        is_suspended?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<any>;
    /**
     * Register a domain
     */
    registerDomain(params: OpenProviderDomainRegistrationRequest): Promise<OpenProviderDomainRegistrationResponse>;
    /**
     * Transfer a domain
     */
    transferDomain(params: OpenProviderDomainTransferRequest): Promise<OpenProviderDomainTransferResponse>;
    /**
     * Search domains
     */
    searchDomains(params?: OpenProviderDomainSearchRequest): Promise<OpenProviderDomainSearchResponse>;
    /**
     * Update domain attributes
     */
    updateDomain(id: number, params: OpenProviderDomainUpdateRequest): Promise<OpenProviderDomainUpdateResponse>;
    /**
     * Renew a domain
     */
    renewDomain(id: number, params: OpenProviderDomainRenewalRequest): Promise<OpenProviderDomainRenewalResponse>;
    /**
     * Get domain auth code
     */
    getDomainAuthCode(id: number, params?: {
        auth_code_type?: string;
    }): Promise<OpenProviderAuthCodeResponse>;
    /**
     * Reset domain auth code
     */
    resetDomainAuthCode(id: number, params: OpenProviderAuthCodeResetRequest): Promise<OpenProviderAuthCodeResetResponse>;
    /**
     * Delete a domain
     */
    deleteDomain(id: number, params?: {
        domain?: {
            name: string;
            extension: string;
        };
    }): Promise<{
        code: number;
        desc: string;
    }>;
    /**
     * Restore a domain
     */
    restoreDomain(id: number, params?: any): Promise<{
        code: number;
        desc: string;
    }>;
    /**
     * Get domain pricing
     */
    getDomainPricing(params: OpenProviderDomainPricingRequest): Promise<OpenProviderDomainPricingResponse>;
    /**
     * Get additional data requirements for domain
     */
    getAdditionalData(params: OpenProviderAdditionalDataRequest): Promise<OpenProviderAdditionalDataResponse>;
    /**
     * Get additional data requirements for customer
     */
    getCustomerAdditionalData(params: OpenProviderCustomerAdditionalDataRequest): Promise<OpenProviderCustomerAdditionalDataResponse>;
    /**
     * Create DNS zone
     */
    createDnsZone(params: OpenProviderDnsZoneRequest): Promise<OpenProviderDnsZoneResponse>;
    /**
     * List DNS zones
     */
    listDnsZones(params?: OpenProviderDnsZoneSearchRequest): Promise<OpenProviderDnsZoneSearchResponse>;
    /**
     * Get specific DNS zone.
     * Per OpenProvider docs (8xx = DNS module), code 872 = "Zone specified is not found."
     * When the API returns HTTP 5xx/4xx with code 872, we return a normal response shape
     * so callers can treat "zone not found" as a valid state instead of an exception.
     */
    getDnsZone(name: string, params?: {
        with_records?: boolean;
        with_history?: boolean;
        with_dnskey?: boolean;
    }): Promise<OpenProviderDnsZoneResponse>;
    /**
     * Update DNS zone
     */
    updateDnsZone(name: string, params: OpenProviderDnsZoneUpdateRequest): Promise<OpenProviderDnsZoneUpdateResponse>;
    /**
     * Delete DNS zone
     */
    deleteDnsZone(name: string): Promise<{
        code: number;
        desc: string;
    }>;
    /**
     * Clear authentication token
     */
    clearAuth(): void;
}
export declare function createOpenProviderClient(): OpenProviderClient;
export declare function clearOpenProviderClient(): void;
