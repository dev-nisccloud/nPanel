/**
 * RDAP (Registration Data Access Protocol) client for domain status lookup.
 * Uses IANA bootstrap (https://data.iana.org/rdap/dns.json) to find the RDAP
 * server for a TLD, then queries for domain status. Used to determine if a
 * domain is available, locked (transfer prohibited), or ready for transfer.
 * @see https://www.rfc-editor.org/rfc/rfc7482
 * @see https://www.iana.org/assignments/rdap-json-values/rdap-json-values.xhtml
 */
/** Result of an RDAP domain lookup. */
export interface RdapDomainResult {
    /** Domain exists in the registry (not available for registration). */
    exists: boolean;
    /** Domain has client or server transfer prohibited status. */
    locked: boolean;
    /** Raw status values from RDAP (e.g. "client transfer prohibited"). */
    statuses: string[];
    /** RDAP server was found and responded (even with 404). */
    rdapAvailable: boolean;
}
/**
 * Look up domain status via RDAP. Returns exists, locked, and statuses.
 * If the TLD has no RDAP server or the request fails, rdapAvailable is false.
 */
export declare function rdapLookup(domain: string): Promise<RdapDomainResult>;
