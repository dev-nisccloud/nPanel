/**
 * Domain detail lookup for the Zeepo AI Agent.
 *
 * Given a FQDN, resolves full domain detail from the appropriate backend:
 *  - gTLDs   → OpenProvider REST API (searchDomains with pattern)
 *  - .ke TLDs → KENIC EPP (domain:info) for live data, DB fallback
 *
 * Authorization:
 *  - Agency users can look up any domain that appears in their portfolio.
 *  - Customer users may only look up domains belonging to their team's
 *    nisc_client_subscription records.
 *
 * Optional sections (fetched only when the caller sets the flag):
 *  - nameservers  – always included by default for overview; this flag adds
 *                   the full server list when not already part of overview
 *  - dns          – Plesk DNS records; only returned when a Plesk webspace
 *                   for the domain exists (hasHosting must be true)
 */
export interface DomainDetailDnsRecord {
    type: string;
    host: string;
    value: string;
    ttl?: number;
}
export interface DomainDetailResult {
    _tool: "get_domain_detail";
    domain: string;
    found: boolean;
    /** "openprovider" | "kenic" | "subscription" (customer DB only, no OP id) */
    source?: "openprovider" | "kenic" | "subscription";
    status?: string;
    expiryDate?: string | null;
    registrationDate?: string | null;
    renewalDate?: string | null;
    autoRenewal?: boolean;
    registrantHandle?: string;
    registrantName?: string;
    registrantEmail?: string;
    adminHandle?: string;
    techHandle?: string;
    isLocked?: boolean;
    isDnssecEnabled?: boolean;
    hasHosting: boolean;
    hostingPlanName?: string | null;
    nameservers?: string[];
    dnsRecords?: DomainDetailDnsRecord[];
    dnsNote?: string;
    /** Set when the domain was found but the caller is not authorised to view it. */
    accessDenied?: boolean;
    error?: string;
    checkedAt: string;
}
export declare function agentGetDomainDetail(params: {
    domain: string;
    isAgency: boolean;
    teamId: string | null;
    includeNameservers: boolean;
    includeDns: boolean;
}): Promise<DomainDetailResult>;
