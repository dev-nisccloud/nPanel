/**
 * EPP XML command builders for KENIC (RFC 5730, 5731).
 * Object and extension URIs match the live greeting from registry.kenic.or.ke.
 */
/**
 * Build EPP <login> command (RFC 5730).
 * Use the same objURI and extURI as in the server greeting so the server enables those services.
 */
export declare function buildLoginXml(clId: string, pw: string, options?: {
    objURIs?: string[];
    extURIs?: string[];
}): string;
/**
 * Build EPP <logout> command (RFC 5730).
 */
export declare function buildLogoutXml(): string;
/**
 * Build EPP domain:check command (RFC 5731).
 * @param domains - Full domain names (e.g. ["example.ke", "test.ke"]).
 */
export declare function buildDomainCheckXml(domains: string[]): string;
/**
 * Options for domain check with fee extension (RFC 8748).
 * When set, the check command includes <extension><fee:check> so the server can return pricing.
 */
export interface DomainCheckFeeOptions {
    /** Currency code (e.g. "USD", "KES"). Omit to use server default. */
    currency?: string;
    /** Registration period in years for create/renew/transfer fee query. Default 1. */
    periodYears?: number;
    /** Launch phase (RFC 8334), e.g. "sunrise", "landrush", "open", "claims". Omit for current phase. */
    phase?: string;
    /** Launch subphase (RFC 8334), e.g. "landrush", "open". Use with phase. */
    subphase?: string;
    /** If true, include fee:command name="restore" to get redemption/restore fee in response. */
    includeRestoreFee?: boolean;
}
/**
 * Build EPP domain:check command with fee extension (RFC 8748).
 * Server may return fee:chkData in the response extension with create/renew/transfer fees per domain.
 */
export declare function buildDomainCheckWithFeeXml(domains: string[], options?: DomainCheckFeeOptions): string;
export interface ContactCreatePostalInfo {
    name: string;
    org?: string;
    street: string | string[];
    city: string;
    sp?: string;
    pc: string;
    cc: string;
}
export interface ContactCreateParams {
    /** Contact id (server may allow server-assigned if omitted; KENIC typically requires it). */
    id: string;
    /** At least one of int (international) or loc (local). */
    postalInfo: ContactCreatePostalInfo | [ContactCreatePostalInfo, ContactCreatePostalInfo];
    /** E.164 format, e.g. +254.123456789 */
    voice: string;
    fax?: string;
    email: string;
    authInfo?: string;
    /** Which fields to disclose in WHOIS; flag 0 = hide, 1 = show. */
    disclose?: {
        flag: 0 | 1;
        elements?: ("name" | "org" | "addr" | "voice" | "fax" | "email")[];
    };
}
/**
 * Build EPP contact:create command (RFC 3733).
 */
export declare function buildContactCreateXml(params: ContactCreateParams): string;
export interface DomainCreateParams {
    /** Full domain name (e.g. example.co.ke). */
    name: string;
    /** Registration period in years. Default 1. */
    period?: number;
    /** Nameservers: hostObj = host names, or hostAttr = name + ips. */
    ns?: {
        type: "hostObj";
        hosts: string[];
    } | {
        type: "hostAttr";
        hosts: Array<{
            name: string;
            addrs?: string[];
        }>;
    };
    /** Registrant contact id (required). */
    registrant: string;
    /** Admin contact id(s). */
    adminContacts?: string[];
    /** Tech contact id(s). */
    techContacts?: string[];
    /** Domain authInfo (password) for transfer lock. */
    authInfo?: string;
}
/**
 * Build EPP domain:create command (RFC 5731).
 */
export declare function buildDomainCreateXml(params: DomainCreateParams): string;
export interface DomainTransferParams {
    /** Full domain name (e.g. example.co.ke). */
    name: string;
    /** Auth code from losing registrar (required for transfer). */
    authCode: string;
    /** Optional roid from domain info at losing registrar. */
    roid?: string;
    /** Period to add on transfer (years). Optional; often 1. */
    period?: number;
}
/**
 * Build EPP domain:transfer command with op="request" (RFC 5731).
 */
export declare function buildDomainTransferXml(params: DomainTransferParams): string;
/**
 * Build EPP domain:info command (RFC 5731).
 */
export declare function buildDomainInfoXml(domain: string, authInfo?: string): string;
/**
 * Build EPP contact:info command (RFC 5733).
 */
export declare function buildContactInfoXml(id: string, authInfo?: string): string;
/**
 * Build EPP domain:update command (RFC 5731) for nameservers.
 */
export declare function buildDomainUpdateXml(params: {
    domain: string;
    addNs?: string[];
    remNs?: string[];
    authInfo?: string;
    addStatus?: string[];
    remStatus?: string[];
}): string;
/**
 * Build EPP host:check command (RFC 5732).
 */
export declare function buildHostCheckXml(hosts: string[]): string;
/**
 * Build EPP host:create command (RFC 5732).
 */
export declare function buildHostCreateXml(host: string, ips?: {
    v4?: string[];
    v6?: string[];
}): string;
/**
 * Build CoCCA finance:info command (non-RFC extension).
 * KENIC advertises https://finance.coccaregistry.org in its EPP greeting.
 * @see https://faq.cocca.org.nz/  response entries are TLD|CURRENCY|BALANCE
 */
export declare function buildFinanceInfoXml(): string;
