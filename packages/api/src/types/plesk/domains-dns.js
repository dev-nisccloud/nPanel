/**
 * Comprehensive TypeScript types for Plesk DNS Records API response
 * Represents DNS records for domains in Plesk
 */
// Type guards for runtime type checking
export function isDomainsDnsResponse(obj) {
    return obj &&
        typeof obj === 'object' &&
        obj['?xml'] &&
        obj.packet &&
        obj.packet.dns &&
        obj.packet.dns.get_rec &&
        Array.isArray(obj.packet.dns.get_rec.result);
}
export function isDomainsDnsRecord(obj) {
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
};
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
};
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
};
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
};
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
};
// Common priority values for MX records
export const DOMAINS_DNS_MX_PRIORITY = {
    HIGH: 10,
    MEDIUM: 20,
    LOW: 30,
    VERY_LOW: 50
};
// Common weight values for SRV records
export const DOMAINS_DNS_SRV_WEIGHT = {
    DEFAULT: 0,
    LOW: 1,
    MEDIUM: 5,
    HIGH: 10
};
// TXT record types
export const DOMAINS_DNS_TXT_TYPES = {
    SPF: 'v=spf1',
    DKIM: 'v=DKIM1',
    DMARC: 'v=DMARC1',
    VERIFICATION: 'verification',
    ACME_CHALLENGE: '_acme-challenge',
    DOMAINKEY: '_domainkey',
    DOMAINKEY_DEFAULT: 'default._domainkey'
};
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
};
// Common SPF qualifiers
export const DOMAINS_DNS_SPF_QUALIFIERS = {
    PASS: '+',
    FAIL: '-',
    SOFT_FAIL: '~',
    NEUTRAL: '?'
};
// DMARC policy values
export const DOMAINS_DNS_DMARC_POLICY = {
    NONE: 'none',
    QUARANTINE: 'quarantine',
    REJECT: 'reject'
};
// DMARC subdomain policy values
export const DOMAINS_DNS_DMARC_SUBDOMAIN_POLICY = {
    NONE: 'none',
    QUARANTINE: 'quarantine',
    REJECT: 'reject'
};
// DMARC alignment modes
export const DOMAINS_DNS_DMARC_ALIGNMENT = {
    STRICT: 's',
    RELAXED: 'r'
};
// DMARC failure reporting options
export const DOMAINS_DNS_DMARC_FAILURE_OPTIONS = {
    '0': '0',
    '1': '1',
    'D': 'd',
    'S': 's'
};
// Common DKIM selectors
export const DOMAINS_DNS_DKIM_SELECTORS = {
    DEFAULT: 'default',
    K1: 'k1',
    K2: 'k2',
    MAIL: 'mail',
    GOOGLE: 'google',
    MICROSOFT: 'microsoft'
};
// DKIM key types
export const DOMAINS_DNS_DKIM_KEY_TYPES = {
    RSA: 'rsa',
    ED25519: 'ed25519'
};
// Common CAA record types
export const DOMAINS_DNS_CAA_TYPES = {
    ISSUE: 'issue',
    ISSUEWILD: 'issuewild',
    IODEF: 'iodef'
};
// Common CAA record flags
export const DOMAINS_DNS_CAA_FLAGS = {
    CRITICAL: 0,
    NON_CRITICAL: 128
};
// Common CAA record tags
export const DOMAINS_DNS_CAA_TAGS = {
    ISSUE: 'issue',
    ISSUEWILD: 'issuewild',
    IODEF: 'iodef'
};
// Common CAA issuers
export const DOMAINS_DNS_CAA_ISSUERS = {
    LETSENCRYPT: 'letsencrypt.org',
    DIGICERT: 'digicert.com',
    COMODO: 'comodo.com',
    GLOBALSIGN: 'globalsign.com',
    SYMANTEC: 'symantec.com'
};
// Utility functions for DNS record validation
export function isValidDnsRecordType(type) {
    return Object.values(DOMAINS_DNS_RECORD_TYPES).includes(type);
}
export function isValidSrvService(service) {
    return Object.values(DOMAINS_DNS_SRV_SERVICES).includes(service);
}
export function isValidSrvPort(port) {
    return Object.values(DOMAINS_DNS_SRV_PORTS).includes(port);
}
export function isValidMxPriority(priority) {
    return priority >= 0 && priority <= 65535;
}
export function isValidSrvWeight(weight) {
    return weight >= 0 && weight <= 65535;
}
export function isValidSrvPriority(priority) {
    return priority >= 0 && priority <= 65535;
}
export function isSpfRecord(value) {
    return typeof value === 'string' && value.startsWith('v=spf1');
}
export function isDkimRecord(value) {
    return typeof value === 'string' && value.startsWith('v=DKIM1');
}
export function isDmarcRecord(value) {
    return typeof value === 'string' && value.startsWith('v=DMARC1');
}
export function isAcmeChallengeRecord(host) {
    return typeof host === 'string' && host.startsWith('_acme-challenge.');
}
export function isDomainKeyRecord(host) {
    return typeof host === 'string' && host.includes('_domainkey.');
}
export function isDmarcHostRecord(host) {
    return typeof host === 'string' && host.startsWith('_dmarc.');
}
// Helper functions for parsing DNS records
export function parseSrvRecord(opt) {
    if (!opt)
        return null;
    const optStr = typeof opt === 'number' ? opt.toString() : opt;
    const parts = optStr.split(' ');
    if (parts.length !== 3)
        return null;
    const [p0, p1, p2] = parts;
    if (p0 === undefined || p1 === undefined || p2 === undefined)
        return null;
    const priority = parseInt(p0, 10);
    const weight = parseInt(p1, 10);
    const port = parseInt(p2, 10);
    if (isNaN(priority) || isNaN(weight) || isNaN(port))
        return null;
    return { priority, weight, port };
}
export function parseMxRecord(opt) {
    if (opt === undefined || opt === null)
        return 10;
    if (typeof opt === 'number')
        return opt;
    const priority = parseInt(opt.toString(), 10);
    return isNaN(priority) ? 10 : priority;
}
export function parseSpfRecord(value) {
    if (!value || !isSpfRecord(value))
        return { mechanisms: [], qualifiers: [] };
    const parts = value.split(' ').slice(1); // Remove 'v=spf1'
    const mechanisms = [];
    const qualifiers = [];
    parts.forEach(part => {
        if (part.startsWith('+') || part.startsWith('-') || part.startsWith('~') || part.startsWith('?')) {
            const first = part.charAt(0);
            qualifiers.push(first);
            mechanisms.push(part.slice(1));
        }
        else {
            qualifiers.push('+');
            mechanisms.push(part);
        }
    });
    return { mechanisms, qualifiers };
}
export function parseDmarcRecord(value) {
    if (!value || !isDmarcRecord(value))
        return {};
    const params = {};
    const parts = value.split(';').map(p => p.trim());
    parts.forEach(part => {
        const [key, val] = part.split('=').map(p => p.trim());
        if (key && val) {
            params[key] = val;
        }
    });
    return params;
}
export function parseDkimRecord(value) {
    if (!value || !isDkimRecord(value))
        return {};
    const params = {};
    const parts = value.split(';').map(p => p.trim());
    parts.forEach(part => {
        const [key, val] = part.split('=').map(p => p.trim());
        if (key && val) {
            params[key] = val;
        }
    });
    return params;
}
