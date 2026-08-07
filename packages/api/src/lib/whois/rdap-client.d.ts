/**
 * RDAP client for domain WHOIS lookups.
 *
 * Uses the IANA bootstrap registry (https://data.iana.org/rdap/dns.json) to
 * resolve the correct RDAP server per TLD, then fetches and normalises the
 * response into a single consistent shape.
 *
 * Types are derived from real responses collected from:
 *   - Verisign  (.com / .net)   gTLD, ICANN-compliant, registrant GDPR-redacted
 *   - Nominet   (.co.uk / .uk)  ccTLD, redacted array + richer nameserver objects
 *   - KENIC     (.ke / .co.ke)  ccTLD via https://rdap.kenic.or.ke/
 *
 * KENIC quirks:
 *   • Bootstrap maps only "ke"; all sub-TLDs (.co.ke, .or.ke …) share the same server
 *   • Registrar entity in the domain response has NO vcardArray  the full vcard
 *     lives at the entity href. We detect this and do a second fetch to enrich the
 *     registrar with address, phone, and email. Only fires for same-origin entity URLs
 *     to avoid cross-registry requests on gTLDs.
 *   • Domain link uses rel:"related" instead of rel:"self"
 *   • Extra event actions: "reregistration", "transfer", "registrar expiration"
 */
export interface WhoisDsData {
    keyTag: number;
    algorithm: number;
    digestType: number;
    /** Hex digest  normalised to lowercase */
    digest: string;
}
export interface WhoisRegistrar {
    name: string | null;
    /** Registry handle (KENIC: "NCL3", gTLD: "292") */
    handle: string | null;
    /** IANA numeric registrar ID (gTLDs only) */
    ianaId: string | null;
    /** Registrar website or RDAP entity URL */
    url: string | null;
    email: string | null;
    phone: string | null;
    street: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    abuseEmail: string | null;
    abusePhone: string | null;
}
export interface WhoisContact {
    name: string | null;
    organization: string | null;
    email: string | null;
    phone: string | null;
    street: string | null;
    city: string | null;
    country: string | null;
}
export interface WhoisDomainEvent {
    action: string;
    date: string;
    /** Actor name when present (e.g. registrar on transfer/reregistration) */
    actor: string | null;
}
export interface WhoisResult {
    domain: string;
    handle: string | null;
    unicodeName: string | null;
    source: "rdap";
    registrationDate: string | null;
    expiryDate: string | null;
    updatedDate: string | null;
    /** Transfer date  present in KENIC responses */
    transferDate: string | null;
    status: string[];
    registrar: WhoisRegistrar | null;
    /** Often null/GDPR-redacted for gTLDs */
    registrant: WhoisContact | null;
    adminContact: WhoisContact | null;
    techContact: WhoisContact | null;
    nameservers: string[];
    dnssec: "signedDelegation" | "unsigned" | null;
    dsData: WhoisDsData[];
    /** Full raw event log from the RDAP response, newest-first */
    events: WhoisDomainEvent[];
    rdapUrl: string | null;
    error: string | null;
}
export declare function resolveRdapBaseUrl(tld: string): Promise<string | null>;
export declare function rdapLookup(domain: string): Promise<WhoisResult>;
