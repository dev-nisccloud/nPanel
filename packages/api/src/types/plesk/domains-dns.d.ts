/**
 * Comprehensive TypeScript types for Plesk DNS Records API response
 * Represents DNS records for domains in Plesk
 */
export interface XmlDeclaration {
    '@_version': string;
    '@_encoding': string;
}
export interface DnsRecordData {
    'site-id': number;
    type: string;
    host: string;
    value: string;
    opt: string | number;
    ttl?: number;
}
export interface DnsRecordResult {
    status: string;
    id: number;
    data: DnsRecordData;
}
export interface DnsGetRec {
    result: DnsRecordResult[];
}
export interface Dns {
    get_rec: DnsGetRec;
}
export interface Packet {
    dns: Dns;
    '@_version': string;
}
export interface DomainsDnsResponse {
    '?xml': XmlDeclaration;
    packet: Packet;
}
export interface DomainsDnsApiResponse {
    raw: string;
    parsed: DomainsDnsResponse;
}
export type DomainsDnsRecord = DnsRecordResult;
export type DomainsDnsRecordData = DnsRecordData;
export type DomainsDnsRecordResult = DnsRecordResult;
export declare function isDomainsDnsResponse(obj: any): obj is DomainsDnsResponse;
export declare function isDomainsDnsRecord(obj: any): obj is DomainsDnsRecord;
export declare const DOMAINS_DNS_STATUS: {
    readonly OK: "ok";
    readonly ERROR: "error";
};
export declare const DOMAINS_DNS_RECORD_TYPES: {
    readonly A: "A";
    readonly AAAA: "AAAA";
    readonly CNAME: "CNAME";
    readonly MX: "MX";
    readonly NS: "NS";
    readonly PTR: "PTR";
    readonly SOA: "SOA";
    readonly SRV: "SRV";
    readonly TXT: "TXT";
    readonly CAA: "CAA";
    readonly DNAME: "DNAME";
    readonly DS: "DS";
    readonly HINFO: "HINFO";
    readonly LOC: "LOC";
    readonly NAPTR: "NAPTR";
    readonly RP: "RP";
    readonly SSHFP: "SSHFP";
    readonly TLSA: "TLSA";
};
export declare const DOMAINS_DNS_HOST_PATTERNS: {
    readonly ROOT_DOMAIN: "";
    readonly WWW: "www";
    readonly MAIL: "mail";
    readonly WEBMAIL: "webmail";
    readonly FTP: "ftp";
    readonly IPV4: "ipv4";
    readonly IPV6: "ipv6";
    readonly CNAME_WWW: "www";
    readonly CNAME_FTP: "ftp";
    readonly CNAME_MAIL: "mail";
};
export declare const DOMAINS_DNS_SRV_SERVICES: {
    readonly IMAPS: "_imaps._tcp";
    readonly POP3S: "_pop3s._tcp";
    readonly SMTPS: "_smtps._tcp";
    readonly IMAP: "_imap._tcp";
    readonly POP3: "_pop3._tcp";
    readonly SMTP: "_smtp._tcp";
    readonly LDAP: "_ldap._tcp";
    readonly LDAPS: "_ldaps._tcp";
    readonly HTTP: "_http._tcp";
    readonly HTTPS: "_https._tcp";
    readonly XMPP_CLIENT: "_xmpp-client._tcp";
    readonly XMPP_SERVER: "_xmpp-server._tcp";
    readonly XMPP_SERVER_S2S: "_xmpp-server._tcp";
};
export declare const DOMAINS_DNS_SRV_PORTS: {
    readonly IMAP: 143;
    readonly IMAPS: 993;
    readonly POP3: 110;
    readonly POP3S: 995;
    readonly SMTP: 25;
    readonly SMTPS: 465;
    readonly SUBMISSION: 587;
    readonly LDAP: 389;
    readonly LDAPS: 636;
    readonly HTTP: 80;
    readonly HTTPS: 443;
    readonly XMPP_CLIENT: 5222;
    readonly XMPP_SERVER: 5269;
};
export declare const DOMAINS_DNS_MX_PRIORITY: {
    readonly HIGH: 10;
    readonly MEDIUM: 20;
    readonly LOW: 30;
    readonly VERY_LOW: 50;
};
export declare const DOMAINS_DNS_SRV_WEIGHT: {
    readonly DEFAULT: 0;
    readonly LOW: 1;
    readonly MEDIUM: 5;
    readonly HIGH: 10;
};
export declare const DOMAINS_DNS_TXT_TYPES: {
    readonly SPF: "v=spf1";
    readonly DKIM: "v=DKIM1";
    readonly DMARC: "v=DMARC1";
    readonly VERIFICATION: "verification";
    readonly ACME_CHALLENGE: "_acme-challenge";
    readonly DOMAINKEY: "_domainkey";
    readonly DOMAINKEY_DEFAULT: "default._domainkey";
};
export declare const DOMAINS_DNS_SPF_MECHANISMS: {
    readonly ALL: "all";
    readonly A: "a";
    readonly MX: "mx";
    readonly IP4: "ip4";
    readonly IP6: "ip6";
    readonly INCLUDE: "include";
    readonly REDIRECT: "redirect";
    readonly EXISTS: "exists";
    readonly EXP: "exp";
};
export declare const DOMAINS_DNS_SPF_QUALIFIERS: {
    readonly PASS: "+";
    readonly FAIL: "-";
    readonly SOFT_FAIL: "~";
    readonly NEUTRAL: "?";
};
export declare const DOMAINS_DNS_DMARC_POLICY: {
    readonly NONE: "none";
    readonly QUARANTINE: "quarantine";
    readonly REJECT: "reject";
};
export declare const DOMAINS_DNS_DMARC_SUBDOMAIN_POLICY: {
    readonly NONE: "none";
    readonly QUARANTINE: "quarantine";
    readonly REJECT: "reject";
};
export declare const DOMAINS_DNS_DMARC_ALIGNMENT: {
    readonly STRICT: "s";
    readonly RELAXED: "r";
};
export declare const DOMAINS_DNS_DMARC_FAILURE_OPTIONS: {
    readonly '0': "0";
    readonly '1': "1";
    readonly D: "d";
    readonly S: "s";
};
export declare const DOMAINS_DNS_DKIM_SELECTORS: {
    readonly DEFAULT: "default";
    readonly K1: "k1";
    readonly K2: "k2";
    readonly MAIL: "mail";
    readonly GOOGLE: "google";
    readonly MICROSOFT: "microsoft";
};
export declare const DOMAINS_DNS_DKIM_KEY_TYPES: {
    readonly RSA: "rsa";
    readonly ED25519: "ed25519";
};
export declare const DOMAINS_DNS_CAA_TYPES: {
    readonly ISSUE: "issue";
    readonly ISSUEWILD: "issuewild";
    readonly IODEF: "iodef";
};
export declare const DOMAINS_DNS_CAA_FLAGS: {
    readonly CRITICAL: 0;
    readonly NON_CRITICAL: 128;
};
export declare const DOMAINS_DNS_CAA_TAGS: {
    readonly ISSUE: "issue";
    readonly ISSUEWILD: "issuewild";
    readonly IODEF: "iodef";
};
export declare const DOMAINS_DNS_CAA_ISSUERS: {
    readonly LETSENCRYPT: "letsencrypt.org";
    readonly DIGICERT: "digicert.com";
    readonly COMODO: "comodo.com";
    readonly GLOBALSIGN: "globalsign.com";
    readonly SYMANTEC: "symantec.com";
};
export declare function isValidDnsRecordType(type: string): boolean;
export declare function isValidSrvService(service: string): boolean;
export declare function isValidSrvPort(port: number): boolean;
export declare function isValidMxPriority(priority: number): boolean;
export declare function isValidSrvWeight(weight: number): boolean;
export declare function isValidSrvPriority(priority: number): boolean;
export declare function isSpfRecord(value: string | undefined): boolean;
export declare function isDkimRecord(value: string | undefined): boolean;
export declare function isDmarcRecord(value: string | undefined): boolean;
export declare function isAcmeChallengeRecord(host: string | undefined): boolean;
export declare function isDomainKeyRecord(host: string | undefined): boolean;
export declare function isDmarcHostRecord(host: string | undefined): boolean;
export declare function parseSrvRecord(opt: string | number | undefined): {
    priority: number;
    weight: number;
    port: number;
} | null;
export declare function parseMxRecord(opt: string | number | undefined): number;
export declare function parseSpfRecord(value: string | undefined): {
    mechanisms: string[];
    qualifiers: string[];
};
export declare function parseDmarcRecord(value: string | undefined): Record<string, string>;
export declare function parseDkimRecord(value: string | undefined): Record<string, string>;
export interface DnsRecordCreateRequest {
    type: string;
    host: string;
    value: string;
    opt?: string | number;
    ttl?: number;
}
export interface DnsRecordDeleteRequest {
    id: number;
}
export interface DnsRecordCreateResponse {
    id: number;
    type: string;
    host: string;
    value: string;
    opt?: string | number;
    ttl?: number;
}
export interface DnsRecordDeleteResponse {
    id: number;
    message: string;
}
export interface DnsRecordCreateApiResponse {
    status: 'success';
    record: DnsRecordCreateResponse;
    message: string;
    raw?: string;
    parsed?: unknown;
}
export interface DnsRecordDeleteApiResponse {
    status: 'success';
    message: string;
    recordId: number;
    raw?: string;
    parsed?: unknown;
}
