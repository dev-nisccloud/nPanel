/**
 * Comprehensive TypeScript types for Plesk Email Accounts API response
 * Represents email accounts for domains in Plesk
 */
// Type guards for runtime type checking
export function isDomainEmailsResponse(obj) {
    return obj &&
        typeof obj === 'object' &&
        obj['?xml'] &&
        obj.packet &&
        obj.packet.mail &&
        obj.packet.mail.get_info &&
        Array.isArray(obj.packet.mail.get_info.result);
}
export function isDomainEmail(obj) {
    return obj &&
        typeof obj === 'object' &&
        typeof obj.status === 'string' &&
        obj.mailname &&
        typeof obj.mailname.id === 'number' &&
        typeof obj.mailname.name === 'string' &&
        obj.mailname.mailbox &&
        typeof obj.mailname.mailbox.enabled === 'boolean' &&
        typeof obj.mailname.mailbox.quota === 'number' &&
        typeof obj.mailname.mailbox.usage === 'number' &&
        obj.mailname.forwarding &&
        typeof obj.mailname.forwarding.enabled === 'boolean' &&
        obj.mailname.autoresponder &&
        typeof obj.mailname.autoresponder.enabled === 'boolean' &&
        obj.mailname.password &&
        typeof obj.mailname.password.value === 'string' &&
        typeof obj.mailname.password.type === 'string' &&
        typeof obj.mailname.antivir === 'string' &&
        typeof obj.mailname.description === 'string';
}
// Constants for common values
export const DOMAIN_EMAILS_STATUS = {
    OK: 'ok',
    ERROR: 'error'
};
// Antivirus settings
export const DOMAIN_EMAILS_ANTIVIR = {
    OFF: 'off',
    INOUT: 'inout',
    IN: 'in',
    OUT: 'out'
};
// Password types
export const DOMAIN_EMAILS_PASSWORD_TYPES = {
    SYM: 'sym',
    PLAIN: 'plain',
    CRYPT: 'crypt',
    MD5: 'md5',
    SHA256: 'sha256',
    SHA512: 'sha512'
};
// Content types for autoresponder
export const DOMAIN_EMAILS_CONTENT_TYPES = {
    TEXT_PLAIN: 'text/plain',
    TEXT_HTML: 'text/html',
    TEXT_RICH: 'text/rich'
};
// Character sets
export const DOMAIN_EMAILS_CHARSETS = {
    UTF8: 'UTF-8',
    ASCII: 'ASCII',
    ISO_8859_1: 'ISO-8859-1',
    WINDOWS_1252: 'Windows-1252'
};
// Common email prefixes
export const DOMAIN_EMAILS_PREFIXES = {
    ADMIN: 'admin',
    SUPPORT: 'support',
    INFO: 'info',
    CONTACT: 'contact',
    SALES: 'sales',
    MARKETING: 'marketing',
    HR: 'hr',
    LEGAL: 'legal',
    PRESS: 'press',
    CAREERS: 'careers',
    FEEDBACK: 'feedback',
    ENQUIRIES: 'enquiries',
    ABUSE: 'abuse',
    POSTMASTER: 'postmaster',
    HOSTMASTER: 'hostmaster',
    WEBMASTER: 'webmaster',
    NO_REPLY: 'no-reply',
    NOREPLY: 'noreply',
    DONOTREPLY: 'donotreply',
    DO_NOT_REPLY: 'do-not-reply',
    ACCOUNTS: 'accounts',
    BILLING: 'billing',
    PAYMENTS: 'payments',
    INVOICES: 'invoices',
    ORDERS: 'orders',
    CUSTOMER_SERVICE: 'customer-service',
    CUSTOMER_SUPPORT: 'customer-support',
    TECHNICAL_SUPPORT: 'technical-support',
    HELP: 'help',
    ASSISTANCE: 'assistance',
    PARTNERS: 'partners',
    AFFILIATES: 'affiliates',
    DEVELOPERS: 'developers',
    DEVS: 'devs',
    API: 'api',
    INTEGRATIONS: 'integrations',
    SECURITY: 'security',
    COMPLIANCE: 'compliance',
    PRIVACY: 'privacy',
    TERMS: 'terms',
    NEWS: 'news',
    UPDATES: 'updates',
    NOTIFICATIONS: 'notifications',
    ALERTS: 'alerts',
    SYSTEM: 'system',
    AUTOMATED: 'automated',
    BOT: 'bot',
    ROBOT: 'robot',
    SERVICE: 'service',
    SERVICES: 'services',
    TEAM: 'team',
    STAFF: 'staff',
    EMPLOYEES: 'employees',
    MANAGEMENT: 'management',
    EXECUTIVE: 'executive',
    LEADERSHIP: 'leadership',
    BOARD: 'board',
    DIRECTORS: 'directors',
    FOUNDERS: 'founders',
    CO_FOUNDERS: 'co-founders',
    CEO: 'ceo',
    CTO: 'cto',
    CFO: 'cfo',
    COO: 'coo',
    CMO: 'cmo',
    VP: 'vp',
    VICE_PRESIDENT: 'vice-president',
    PRESIDENT: 'president',
    CHAIRMAN: 'chairman',
    CHAIRWOMAN: 'chairwoman',
    CHAIR: 'chair',
    OWNER: 'owner',
    FOUNDER: 'founder',
    CO_FOUNDER: 'co-founder',
    PARTNER: 'partner',
    ASSOCIATE: 'associate',
    ASSOCIATES: 'associates',
    SENIOR: 'senior',
    JUNIOR: 'junior',
    LEAD: 'lead',
    PRINCIPAL: 'principal',
    ARCHITECT: 'architect',
    ENGINEER: 'engineer',
    ENGINEERS: 'engineers',
    DEVELOPER: 'developer',
    PROGRAMMER: 'programmer',
    PROGRAMMERS: 'programmers',
    DESIGNER: 'designer',
    DESIGNERS: 'designers',
    MANAGER: 'manager',
    MANAGERS: 'managers',
    DIRECTOR: 'director',
    COORDINATOR: 'coordinator',
    COORDINATORS: 'coordinators',
    SPECIALIST: 'specialist',
    SPECIALISTS: 'specialists',
    ANALYST: 'analyst',
    ANALYSTS: 'analysts',
    CONSULTANT: 'consultant',
    CONSULTANTS: 'consultants',
    ADVISOR: 'advisor',
    ADVISORS: 'advisors',
    ADVISER: 'adviser',
    ADVISERS: 'advisers',
    EXPERT: 'expert',
    EXPERTS: 'experts',
    PROFESSIONAL: 'professional',
    PROFESSIONALS: 'professionals',
    EXECUTIVES: 'executives',
    OFFICER: 'officer',
    OFFICERS: 'officers',
    REPRESENTATIVE: 'representative',
    REPRESENTATIVES: 'representatives',
    AGENT: 'agent',
    AGENTS: 'agents',
    ASSISTANT: 'assistant',
    ASSISTANTS: 'assistants',
    FACILITATOR: 'facilitator',
    FACILITATORS: 'facilitators',
    MEDIATOR: 'mediator',
    MEDIATORS: 'mediators',
    NEGOTIATOR: 'negotiator',
    NEGOTIATORS: 'negotiators',
    BROKER: 'broker',
    BROKERS: 'brokers',
    DEALER: 'dealer',
    DEALERS: 'dealers',
    DISTRIBUTOR: 'distributor',
    DISTRIBUTORS: 'distributors',
    RESELLER: 'reseller',
    RESELLERS: 'resellers',
    VENDOR: 'vendor',
    VENDORS: 'vendors',
    SUPPLIER: 'supplier',
    SUPPLIERS: 'suppliers',
    PROVIDER: 'provider',
    PROVIDERS: 'providers',
    CONTRACTOR: 'contractor',
    CONTRACTORS: 'contractors',
    FREELANCER: 'freelancer',
    FREELANCERS: 'freelancers',
    MENTOR: 'mentor',
    MENTORS: 'mentors',
    COACH: 'coach',
    COACHES: 'coaches',
    TRAINER: 'trainer',
    TRAINERS: 'trainers',
    INSTRUCTOR: 'instructor',
    INSTRUCTORS: 'instructors',
    TEACHER: 'teacher',
    TEACHERS: 'teachers',
    PROFESSOR: 'professor',
    PROFESSORS: 'professors',
    LECTURER: 'lecturer',
    LECTURERS: 'lecturers',
    RESEARCHER: 'researcher',
    RESEARCHERS: 'researchers',
    SCIENTIST: 'scientist',
    SCIENTISTS: 'scientists',
    SCHOLAR: 'scholar',
    SCHOLARS: 'scholars',
    ACADEMIC: 'academic',
    ACADEMICS: 'academics',
    STUDENT: 'student',
    STUDENTS: 'students',
    GRADUATE: 'graduate',
    GRADUATES: 'graduates',
    ALUMNI: 'alumni',
    ALUMNUS: 'alumnus',
    ALUMNA: 'alumna',
    ALUMNAE: 'alumnae',
    MEMBER: 'member',
    MEMBERS: 'members',
    MEMBERSHIP: 'membership',
    SUBSCRIBER: 'subscriber',
    SUBSCRIBERS: 'subscribers',
    SUBSCRIPTION: 'subscription',
    SUBSCRIPTIONS: 'subscriptions',
    CUSTOMER: 'customer',
    CUSTOMERS: 'customers',
    CLIENT: 'client',
    CLIENTS: 'clients',
    USER: 'user',
    USERS: 'users',
    ACCOUNT: 'account',
    PROFILE: 'profile',
    PROFILES: 'profiles',
    GUEST: 'guest',
    GUESTS: 'guests',
    VISITOR: 'visitor',
    VISITORS: 'visitors',
    AUDIENCE: 'audience',
    AUDIENCES: 'audiences',
    COMMUNITY: 'community',
    COMMUNITIES: 'communities',
    GROUP: 'group',
    GROUPS: 'groups',
    TEAMS: 'teams',
    SQUAD: 'squad',
    SQUADS: 'squads',
    CREW: 'crew',
    CREWS: 'crews',
    GANG: 'gang',
    GANGS: 'gangs',
    CLUB: 'club',
    CLUBS: 'clubs',
    SOCIETY: 'society',
    SOCIETIES: 'societies',
    ORGANIZATION: 'organization',
    ORGANIZATIONS: 'organizations',
    ORGANISATION: 'organisation',
    ORGANISATIONS: 'organisations',
    COMPANY: 'company',
    COMPANIES: 'companies',
    CORPORATION: 'corporation',
    CORPORATIONS: 'corporations',
    BUSINESS: 'business',
    BUSINESSES: 'businesses',
    ENTERPRISE: 'enterprise',
    ENTERPRISES: 'enterprises',
    FIRM: 'firm',
    FIRMS: 'firms',
    AGENCY: 'agency',
    AGENCIES: 'agencies',
    BUREAU: 'bureau',
    BUREAUS: 'bureaus',
    BUREAUX: 'bureaux',
    OFFICE: 'office',
    OFFICES: 'offices',
    BRANCH: 'branch',
    BRANCHES: 'branches',
    DIVISION: 'division',
    DIVISIONS: 'divisions',
    DEPARTMENT: 'department',
    DEPARTMENTS: 'departments',
    SECTION: 'section',
    SECTIONS: 'sections',
    UNIT: 'unit',
    UNITS: 'units'
};
// Utility functions for email validation
export function isValidEmailStatus(status) {
    return Object.values(DOMAIN_EMAILS_STATUS).includes(status);
}
export function isValidAntivirSetting(antivir) {
    return Object.values(DOMAIN_EMAILS_ANTIVIR).includes(antivir);
}
export function isValidPasswordType(type) {
    return Object.values(DOMAIN_EMAILS_PASSWORD_TYPES).includes(type);
}
export function isValidContentType(contentType) {
    return Object.values(DOMAIN_EMAILS_CONTENT_TYPES).includes(contentType);
}
export function isValidCharset(charset) {
    return Object.values(DOMAIN_EMAILS_CHARSETS).includes(charset);
}
export function isValidEmailPrefix(prefix) {
    return Object.values(DOMAIN_EMAILS_PREFIXES).includes(prefix);
}
// Helper functions for parsing email data
export function getEmailId(email) {
    return email.mailname.id;
}
export function getEmailName(email) {
    return email.mailname.name;
}
export function getEmailStatus(email) {
    return email.status;
}
export function isMailboxEnabled(email) {
    return email.mailname.mailbox.enabled;
}
export function getMailboxQuota(email) {
    return email.mailname.mailbox.quota;
}
export function getMailboxUsage(email) {
    return email.mailname.mailbox.usage;
}
export function isMailboxUnlimited(email) {
    return email.mailname.mailbox.quota === -1;
}
export function getMailboxUsagePercentage(email) {
    if (isMailboxUnlimited(email))
        return 0;
    return (email.mailname.mailbox.usage / email.mailname.mailbox.quota) * 100;
}
export function isForwardingEnabled(email) {
    return email.mailname.forwarding.enabled;
}
export function getForwardingAddresses(email) {
    if (!isForwardingEnabled(email))
        return [];
    const address = email.mailname.forwarding.address;
    return Array.isArray(address) ? address : address ? [address] : [];
}
export function isAutoresponderEnabled(email) {
    return email.mailname.autoresponder.enabled;
}
export function getAutoresponderSubject(email) {
    return email.mailname.autoresponder.subject || null;
}
export function getAutoresponderText(email) {
    return email.mailname.autoresponder.text || null;
}
export function getAutoresponderEndDate(email) {
    return email.mailname.autoresponder.end_date || null;
}
export function getPasswordType(email) {
    return email.mailname.password.type;
}
export function getAntivirSetting(email) {
    return email.mailname.antivir;
}
export function getDescription(email) {
    return email.mailname.description;
}
export function getUserGuid(email) {
    return email.mailname['user-guid'] || null;
}
export function getAliases(email) {
    const alias = email.mailname.alias;
    return Array.isArray(alias) ? alias : alias ? [alias] : [];
}
export function hasUserGuid(email) {
    return !!email.mailname['user-guid'];
}
export function hasAliases(email) {
    return !!email.mailname.alias;
}
export function isSystemEmail(email) {
    const systemPrefixes = [
        'postmaster', 'hostmaster', 'webmaster', 'abuse', 'admin',
        'no-reply', 'noreply', 'donotreply', 'do-not-reply'
    ];
    return systemPrefixes.includes(email.mailname.name.toLowerCase());
}
export function isPersonalEmail(email) {
    return hasUserGuid(email) && !isSystemEmail(email);
}
export function isForwardingEmail(email) {
    return isForwardingEnabled(email) && !isMailboxEnabled(email);
}
export function isAliasEmail(email) {
    return hasAliases(email) && !isMailboxEnabled(email);
}
// Helper functions for filtering emails
export function filterEmailsByStatus(emails, status) {
    return emails.filter(email => email.status === status);
}
export function filterEmailsByMailboxEnabled(emails) {
    return emails.filter(email => isMailboxEnabled(email));
}
export function filterEmailsByForwardingEnabled(emails) {
    return emails.filter(email => isForwardingEnabled(email));
}
export function filterEmailsByAutoresponderEnabled(emails) {
    return emails.filter(email => isAutoresponderEnabled(email));
}
export function filterEmailsBySystemEmails(emails) {
    return emails.filter(email => isSystemEmail(email));
}
export function filterEmailsByPersonalEmails(emails) {
    return emails.filter(email => isPersonalEmail(email));
}
export function filterEmailsByPrefix(emails, prefix) {
    return emails.filter(email => email.mailname.name.toLowerCase().startsWith(prefix.toLowerCase()));
}
export function filterEmailsByAntivirSetting(emails, antivir) {
    return emails.filter(email => email.mailname.antivir === antivir);
}
export function filterEmailsByUnlimitedQuota(emails) {
    return emails.filter(email => isMailboxUnlimited(email));
}
export function filterEmailsByLimitedQuota(emails) {
    return emails.filter(email => !isMailboxUnlimited(email));
}
// Helper functions for sorting emails
export function sortEmailsByName(emails, ascending = true) {
    return emails.sort((a, b) => {
        const nameA = getEmailName(a).toLowerCase();
        const nameB = getEmailName(b).toLowerCase();
        return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
}
export function sortEmailsById(emails, ascending = true) {
    return emails.sort((a, b) => {
        return ascending ? getEmailId(a) - getEmailId(b) : getEmailId(b) - getEmailId(a);
    });
}
export function sortEmailsByUsage(emails, ascending = true) {
    return emails.sort((a, b) => {
        return ascending ? getMailboxUsage(a) - getMailboxUsage(b) : getMailboxUsage(b) - getMailboxUsage(a);
    });
}
export function sortEmailsByQuota(emails, ascending = true) {
    return emails.sort((a, b) => {
        return ascending ? getMailboxQuota(a) - getMailboxQuota(b) : getMailboxQuota(b) - getMailboxQuota(a);
    });
}
// Helper functions for email statistics
export function getTotalEmails(emails) {
    return emails.length;
}
export function getEnabledMailboxes(emails) {
    return emails.filter(email => isMailboxEnabled(email)).length;
}
export function getEnabledForwarding(emails) {
    return emails.filter(email => isForwardingEnabled(email)).length;
}
export function getEnabledAutoresponders(emails) {
    return emails.filter(email => isAutoresponderEnabled(email)).length;
}
export function getSystemEmails(emails) {
    return emails.filter(email => isSystemEmail(email)).length;
}
export function getPersonalEmails(emails) {
    return emails.filter(email => isPersonalEmail(email)).length;
}
export function getTotalMailboxUsage(emails) {
    return emails.reduce((total, email) => total + getMailboxUsage(email), 0);
}
export function getTotalMailboxQuota(emails) {
    return emails.reduce((total, email) => {
        const quota = getMailboxQuota(email);
        return quota === -1 ? total : total + quota;
    }, 0);
}
export function getAverageMailboxUsage(emails) {
    const enabledMailboxes = emails.filter(email => isMailboxEnabled(email));
    if (enabledMailboxes.length === 0)
        return 0;
    return getTotalMailboxUsage(enabledMailboxes) / enabledMailboxes.length;
}
export function getAverageMailboxQuota(emails) {
    const limitedQuotaEmails = emails.filter(email => !isMailboxUnlimited(email));
    if (limitedQuotaEmails.length === 0)
        return 0;
    return getTotalMailboxQuota(limitedQuotaEmails) / limitedQuotaEmails.length;
}
