/**
 * KENIC EPP integration for Nisc domain orders (.ke, .co.ke, etc.).
 * Ensures KENIC contact (registrant) exists, then registers the domain via EPP.
 */
export type RegisterKenicDomainResult = {
    success: true;
    domain: string;
    exDate?: string | null;
    /** Plaintext EPP auth code set at create — store locally; CoCCA will not return it later. */
    authInfo: string;
};
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
/** CoCCA returns a one-way hash from domain:info — never treat those as displayable codes. */
export declare function isCoccaAuthInfoHash(value: string | null | undefined): boolean;
/**
 * Generate a plaintext EPP auth code, push it to KENIC via domain:update, and return it.
 * Callers must persist the returned value (CoCCA will not give it back later).
 */
export declare function setKenicDomainAuthCode(domainName: string, authCode?: string): Promise<string>;
