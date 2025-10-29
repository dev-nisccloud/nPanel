/**
 * Comprehensive TypeScript types for Plesk DNS Records API response
 * Represents DNS records for domains in Plesk
 */

// XML declaration types
export interface XmlDeclaration {
  '@_version': string;
  '@_encoding': string;
}

// DNS record data
export interface DnsRecordData {
  'site-id': number;
  type: string;
  host: string;
  value: string;
  opt: string | number;
}

// DNS record result
export interface DnsRecordResult {
  status: string;
  id: number;
  data: DnsRecordData;
}

// DNS get records response
export interface DnsGetRec {
  result: DnsRecordResult[];
}

// DNS section
export interface Dns {
  get_rec: DnsGetRec;
}

// Main packet structure
export interface Packet {
  dns: Dns;
  '@_version': string;
}

// Root response structure
export interface DomainsDnsResponse {
  '?xml': XmlDeclaration;
  packet: Packet;
}

// Raw API response wrapper
export interface DomainsDnsApiResponse {
  raw: string;
  parsed: DomainsDnsResponse;
}

// Individual DNS record type (extracted from the result array)
export type DomainsDnsRecord = DnsRecordResult;

// Helper types for easier access
export type DomainsDnsRecordData = DnsRecordData;
export type DomainsDnsRecordResult = DnsRecordResult;

// Type guards for runtime type checking
export function isDomainsDnsResponse(obj: any): obj is DomainsDnsResponse {
  return obj && 
    typeof obj === 'object' && 
    obj['?xml'] && 
    obj.packet && 
    obj.packet.dns &&
    obj.packet.dns.get_rec &&
    Array.isArray(obj.packet.dns.get_rec.result);
}

export function isDomainsDnsRecord(obj: any): obj is DomainsDnsRecord {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.status === 'string' &&
    typeof obj.id === 'number' &&
    obj.data &&
    typeof obj.data['site-id'] === 'number' &&
    typeof obj.data.type === 'string' &&
    typeof obj.data.host === 'string' &&
    typeof obj.data.value === 'string' &&
    (typeof obj.data.opt === 'string' || typeof obj.data.opt === 'number');
}

// Constants for common values
export const DOMAINS_DNS_STATUS = {
  OK: 'ok',
  ERROR: 'error'
} as const;

// DNS Record Types
export const DOMAINS_DNS_RECORD_TYPES = {
  A: 'A',
  AAAA: 'AAAA',
  CNAME: 'CNAME',
  MX: 'MX',
  NS: 'NS',
  PTR: 'PTR',
  SOA: 'SOA',
  SRV: 'SRV',
  TXT: 'TXT',
  CAA: 'CAA',
  DNAME: 'DNAME',
  DS: 'DS',
  HINFO: 'HINFO',
  LOC: 'LOC',
  NAPTR: 'NAPTR',
  RP: 'RP',
  SSHFP: 'SSHFP',
  TLSA: 'TLSA'
} as const;

// Common host patterns
export const DOMAINS_DNS_HOST_PATTERNS = {
  ROOT_DOMAIN: '', // Empty for root domain
  WWW: 'www',
  MAIL: 'mail',
  WEBMAIL: 'webmail',
  FTP: 'ftp',
  IPV4: 'ipv4',
  IPV6: 'ipv6',
  CNAME_WWW: 'www',
  CNAME_FTP: 'ftp',
  CNAME_MAIL: 'mail'
} as const;

// Common service types for SRV records
export const DOMAINS_DNS_SRV_SERVICES = {
  IMAPS: '_imaps._tcp',
  POP3S: '_pop3s._tcp',
  SMTPS: '_smtps._tcp',
  IMAP: '_imap._tcp',
  POP3: '_pop3._tcp',
  SMTP: '_smtp._tcp',
  LDAP: '_ldap._tcp',
  LDAPS: '_ldaps._tcp',
  HTTP: '_http._tcp',
  HTTPS: '_https._tcp',
  XMPP_CLIENT: '_xmpp-client._tcp',
  XMPP_SERVER: '_xmpp-server._tcp',
  XMPP_SERVER_S2S: '_xmpp-server._tcp'
} as const;

// Common ports for SRV records
export const DOMAINS_DNS_SRV_PORTS = {
  IMAP: 143,
  IMAPS: 993,
  POP3: 110,
  POP3S: 995,
  SMTP: 25,
  SMTPS: 465,
  SUBMISSION: 587,
  LDAP: 389,
  LDAPS: 636,
  HTTP: 80,
  HTTPS: 443,
  XMPP_CLIENT: 5222,
  XMPP_SERVER: 5269
} as const;

// Common priority values for MX records
export const DOMAINS_DNS_MX_PRIORITY = {
  HIGH: 10,
  MEDIUM: 20,
  LOW: 30,
  VERY_LOW: 50
} as const;

// Common weight values for SRV records
export const DOMAINS_DNS_SRV_WEIGHT = {
  DEFAULT: 0,
  LOW: 1,
  MEDIUM: 5,
  HIGH: 10
} as const;

// TXT record types
export const DOMAINS_DNS_TXT_TYPES = {
  SPF: 'v=spf1',
  DKIM: 'v=DKIM1',
  DMARC: 'v=DMARC1',
  VERIFICATION: 'verification',
  ACME_CHALLENGE: '_acme-challenge',
  DOMAINKEY: '_domainkey',
  DOMAINKEY_DEFAULT: 'default._domainkey'
} as const;

// Common SPF mechanisms
export const DOMAINS_DNS_SPF_MECHANISMS = {
  ALL: 'all',
  A: 'a',
  MX: 'mx',
  IP4: 'ip4',
  IP6: 'ip6',
  INCLUDE: 'include',
  REDIRECT: 'redirect',
  EXISTS: 'exists',
  EXP: 'exp'
} as const;

// Common SPF qualifiers
export const DOMAINS_DNS_SPF_QUALIFIERS = {
  PASS: '+',
  FAIL: '-',
  SOFT_FAIL: '~',
  NEUTRAL: '?'
} as const;

// DMARC policy values
export const DOMAINS_DNS_DMARC_POLICY = {
  NONE: 'none',
  QUARANTINE: 'quarantine',
  REJECT: 'reject'
} as const;

// DMARC subdomain policy values
export const DOMAINS_DNS_DMARC_SUBDOMAIN_POLICY = {
  NONE: 'none',
  QUARANTINE: 'quarantine',
  REJECT: 'reject'
} as const;

// DMARC alignment modes
export const DOMAINS_DNS_DMARC_ALIGNMENT = {
  STRICT: 's',
  RELAXED: 'r'
} as const;

// DMARC failure reporting options
export const DOMAINS_DNS_DMARC_FAILURE_OPTIONS = {
  '0': '0',
  '1': '1',
  'D': 'd',
  'S': 's'
} as const;

// Common DKIM selectors
export const DOMAINS_DNS_DKIM_SELECTORS = {
  DEFAULT: 'default',
  K1: 'k1',
  K2: 'k2',
  MAIL: 'mail',
  GOOGLE: 'google',
  MICROSOFT: 'microsoft'
} as const;

// DKIM key types
export const DOMAINS_DNS_DKIM_KEY_TYPES = {
  RSA: 'rsa',
  ED25519: 'ed25519'
} as const;

// Common CAA record types
export const DOMAINS_DNS_CAA_TYPES = {
  ISSUE: 'issue',
  ISSUEWILD: 'issuewild',
  IODEF: 'iodef'
} as const;

// Common CAA record flags
export const DOMAINS_DNS_CAA_FLAGS = {
  CRITICAL: 0,
  NON_CRITICAL: 128
} as const;

// Common CAA record tags
export const DOMAINS_DNS_CAA_TAGS = {
  ISSUE: 'issue',
  ISSUEWILD: 'issuewild',
  IODEF: 'iodef'
} as const;

// Common CAA issuers
export const DOMAINS_DNS_CAA_ISSUERS = {
  LETSENCRYPT: 'letsencrypt.org',
  DIGICERT: 'digicert.com',
  COMODO: 'comodo.com',
  GLOBALSIGN: 'globalsign.com',
  SYMANTEC: 'symantec.com'
} as const;

// Utility functions for DNS record validation
export function isValidDnsRecordType(type: string): boolean {
  return Object.values(DOMAINS_DNS_RECORD_TYPES).includes(type as any);
}

export function isValidSrvService(service: string): boolean {
  return Object.values(DOMAINS_DNS_SRV_SERVICES).includes(service as any);
}

export function isValidSrvPort(port: number): boolean {
  return Object.values(DOMAINS_DNS_SRV_PORTS).includes(port as any);
}

export function isValidMxPriority(priority: number): boolean {
  return priority >= 0 && priority <= 65535;
}

export function isValidSrvWeight(weight: number): boolean {
  return weight >= 0 && weight <= 65535;
}

export function isValidSrvPriority(priority: number): boolean {
  return priority >= 0 && priority <= 65535;
}

export function isSpfRecord(value: string): boolean {
  return value.startsWith('v=spf1');
}

export function isDkimRecord(value: string): boolean {
  return value.startsWith('v=DKIM1');
}

export function isDmarcRecord(value: string): boolean {
  return value.startsWith('v=DMARC1');
}

export function isAcmeChallengeRecord(host: string): boolean {
  return host.startsWith('_acme-challenge.');
}

export function isDomainKeyRecord(host: string): boolean {
  return host.includes('_domainkey.');
}

export function isDmarcHostRecord(host: string): boolean {
  return host.startsWith('_dmarc.');
}

// Helper functions for parsing DNS records
export function parseSrvRecord(opt: string): { priority: number; weight: number; port: number } | null {
  const parts = opt.split(' ');
  if (parts.length !== 3) return null;
  
  const priority = parseInt(parts[0], 10);
  const weight = parseInt(parts[1], 10);
  const port = parseInt(parts[2], 10);
  
  if (isNaN(priority) || isNaN(weight) || isNaN(port)) return null;
  
  return { priority, weight, port };
}

export function parseMxRecord(opt: string | number): number {
  if (typeof opt === 'number') return opt;
  const priority = parseInt(opt.toString(), 10);
  return isNaN(priority) ? 10 : priority;
}

export function parseSpfRecord(value: string): { mechanisms: string[]; qualifiers: string[] } {
  if (!isSpfRecord(value)) return { mechanisms: [], qualifiers: [] };
  
  const parts = value.split(' ').slice(1); // Remove 'v=spf1'
  const mechanisms: string[] = [];
  const qualifiers: string[] = [];
  
  parts.forEach(part => {
    if (part.startsWith('+') || part.startsWith('-') || part.startsWith('~') || part.startsWith('?')) {
      qualifiers.push(part[0]);
      mechanisms.push(part.substring(1));
    } else {
      qualifiers.push('+');
      mechanisms.push(part);
    }
  });
  
  return { mechanisms, qualifiers };
}

export function parseDmarcRecord(value: string): Record<string, string> {
  if (!isDmarcRecord(value)) return {};
  
  const params: Record<string, string> = {};
  const parts = value.split(';').map(p => p.trim());
  
  parts.forEach(part => {
    const [key, val] = part.split('=').map(p => p.trim());
    if (key && val) {
      params[key] = val;
    }
  });
  
  return params;
}

export function parseDkimRecord(value: string): Record<string, string> {
  if (!isDkimRecord(value)) return {};
  
  const params: Record<string, string> = {};
  const parts = value.split(';').map(p => p.trim());
  
  parts.forEach(part => {
    const [key, val] = part.split('=').map(p => p.trim());
    if (key && val) {
      params[key] = val;
    }
  });
  
  return params;
}

// DNS CRUD Request/Response Types
export interface DnsRecordCreateRequest {
  type: string; // Required - DNS record type (A, AAAA, CNAME, MX, etc.)
  host: string; // Required - Host name (e.g., "www", "mail", or empty for root)
  value: string; // Required - Record value
  opt?: string | number; // Optional - Additional options (priority for MX, weight/port for SRV, etc.)
  ttl?: number; // Optional - Time to live (defaults to server default)
}

export interface DnsRecordDeleteRequest {
  id: number; // Required - DNS record ID to delete
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