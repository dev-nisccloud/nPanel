/**
 * Comprehensive TypeScript types for Plesk Email Accounts API response
 * Represents email accounts for domains in Plesk
 */
export interface XmlDeclaration {
    '@_version': string;
    '@_encoding': string;
}
export interface EmailMailbox {
    enabled: boolean;
    quota: number;
    usage: number;
}
export interface EmailForwarding {
    enabled: boolean;
    address?: string | string[];
}
export interface EmailAutoresponder {
    enabled: boolean;
    subject?: string;
    content_type?: string;
    charset?: string;
    text?: string;
    end_date?: string;
}
export interface EmailPassword {
    value: string;
    type: string;
}
export interface EmailMailname {
    id: number;
    name: string;
    mailbox: EmailMailbox;
    forwarding: EmailForwarding;
    autoresponder: EmailAutoresponder;
    password: EmailPassword;
    antivir: string;
    description: string;
    'user-guid'?: string;
    alias?: string | string[];
}
export interface EmailResult {
    status: string;
    mailname: EmailMailname;
}
export interface EmailGetInfo {
    result: EmailResult[];
}
export interface Email {
    get_info: EmailGetInfo;
}
export interface Packet {
    mail: Email;
    '@_version': string;
}
export interface DomainEmailsResponse {
    '?xml': XmlDeclaration;
    packet: Packet;
}
export interface DomainEmailsApiResponse {
    raw: string;
    parsed: DomainEmailsResponse;
}
export type DomainEmail = EmailResult;
export type DomainEmailMailname = EmailMailname;
export type DomainEmailMailbox = EmailMailbox;
export type DomainEmailForwarding = EmailForwarding;
export type DomainEmailAutoresponder = EmailAutoresponder;
export type DomainEmailPassword = EmailPassword;
export type DomainEmailResult = EmailResult;
export declare function isDomainEmailsResponse(obj: any): obj is DomainEmailsResponse;
export declare function isDomainEmail(obj: any): obj is DomainEmail;
export declare const DOMAIN_EMAILS_STATUS: {
    readonly OK: "ok";
    readonly ERROR: "error";
};
export declare const DOMAIN_EMAILS_ANTIVIR: {
    readonly OFF: "off";
    readonly INOUT: "inout";
    readonly IN: "in";
    readonly OUT: "out";
};
export declare const DOMAIN_EMAILS_PASSWORD_TYPES: {
    readonly SYM: "sym";
    readonly PLAIN: "plain";
    readonly CRYPT: "crypt";
    readonly MD5: "md5";
    readonly SHA256: "sha256";
    readonly SHA512: "sha512";
};
export declare const DOMAIN_EMAILS_CONTENT_TYPES: {
    readonly TEXT_PLAIN: "text/plain";
    readonly TEXT_HTML: "text/html";
    readonly TEXT_RICH: "text/rich";
};
export declare const DOMAIN_EMAILS_CHARSETS: {
    readonly UTF8: "UTF-8";
    readonly ASCII: "ASCII";
    readonly ISO_8859_1: "ISO-8859-1";
    readonly WINDOWS_1252: "Windows-1252";
};
export declare const DOMAIN_EMAILS_PREFIXES: {
    readonly ADMIN: "admin";
    readonly SUPPORT: "support";
    readonly INFO: "info";
    readonly CONTACT: "contact";
    readonly SALES: "sales";
    readonly MARKETING: "marketing";
    readonly HR: "hr";
    readonly LEGAL: "legal";
    readonly PRESS: "press";
    readonly CAREERS: "careers";
    readonly FEEDBACK: "feedback";
    readonly ENQUIRIES: "enquiries";
    readonly ABUSE: "abuse";
    readonly POSTMASTER: "postmaster";
    readonly HOSTMASTER: "hostmaster";
    readonly WEBMASTER: "webmaster";
    readonly NO_REPLY: "no-reply";
    readonly NOREPLY: "noreply";
    readonly DONOTREPLY: "donotreply";
    readonly DO_NOT_REPLY: "do-not-reply";
    readonly ACCOUNTS: "accounts";
    readonly BILLING: "billing";
    readonly PAYMENTS: "payments";
    readonly INVOICES: "invoices";
    readonly ORDERS: "orders";
    readonly CUSTOMER_SERVICE: "customer-service";
    readonly CUSTOMER_SUPPORT: "customer-support";
    readonly TECHNICAL_SUPPORT: "technical-support";
    readonly HELP: "help";
    readonly ASSISTANCE: "assistance";
    readonly PARTNERS: "partners";
    readonly AFFILIATES: "affiliates";
    readonly DEVELOPERS: "developers";
    readonly DEVS: "devs";
    readonly API: "api";
    readonly INTEGRATIONS: "integrations";
    readonly SECURITY: "security";
    readonly COMPLIANCE: "compliance";
    readonly PRIVACY: "privacy";
    readonly TERMS: "terms";
    readonly NEWS: "news";
    readonly UPDATES: "updates";
    readonly NOTIFICATIONS: "notifications";
    readonly ALERTS: "alerts";
    readonly SYSTEM: "system";
    readonly AUTOMATED: "automated";
    readonly BOT: "bot";
    readonly ROBOT: "robot";
    readonly SERVICE: "service";
    readonly SERVICES: "services";
    readonly TEAM: "team";
    readonly STAFF: "staff";
    readonly EMPLOYEES: "employees";
    readonly MANAGEMENT: "management";
    readonly EXECUTIVE: "executive";
    readonly LEADERSHIP: "leadership";
    readonly BOARD: "board";
    readonly DIRECTORS: "directors";
    readonly FOUNDERS: "founders";
    readonly CO_FOUNDERS: "co-founders";
    readonly CEO: "ceo";
    readonly CTO: "cto";
    readonly CFO: "cfo";
    readonly COO: "coo";
    readonly CMO: "cmo";
    readonly VP: "vp";
    readonly VICE_PRESIDENT: "vice-president";
    readonly PRESIDENT: "president";
    readonly CHAIRMAN: "chairman";
    readonly CHAIRWOMAN: "chairwoman";
    readonly CHAIR: "chair";
    readonly OWNER: "owner";
    readonly FOUNDER: "founder";
    readonly CO_FOUNDER: "co-founder";
    readonly PARTNER: "partner";
    readonly ASSOCIATE: "associate";
    readonly ASSOCIATES: "associates";
    readonly SENIOR: "senior";
    readonly JUNIOR: "junior";
    readonly LEAD: "lead";
    readonly PRINCIPAL: "principal";
    readonly ARCHITECT: "architect";
    readonly ENGINEER: "engineer";
    readonly ENGINEERS: "engineers";
    readonly DEVELOPER: "developer";
    readonly PROGRAMMER: "programmer";
    readonly PROGRAMMERS: "programmers";
    readonly DESIGNER: "designer";
    readonly DESIGNERS: "designers";
    readonly MANAGER: "manager";
    readonly MANAGERS: "managers";
    readonly DIRECTOR: "director";
    readonly COORDINATOR: "coordinator";
    readonly COORDINATORS: "coordinators";
    readonly SPECIALIST: "specialist";
    readonly SPECIALISTS: "specialists";
    readonly ANALYST: "analyst";
    readonly ANALYSTS: "analysts";
    readonly CONSULTANT: "consultant";
    readonly CONSULTANTS: "consultants";
    readonly ADVISOR: "advisor";
    readonly ADVISORS: "advisors";
    readonly ADVISER: "adviser";
    readonly ADVISERS: "advisers";
    readonly EXPERT: "expert";
    readonly EXPERTS: "experts";
    readonly PROFESSIONAL: "professional";
    readonly PROFESSIONALS: "professionals";
    readonly EXECUTIVES: "executives";
    readonly OFFICER: "officer";
    readonly OFFICERS: "officers";
    readonly REPRESENTATIVE: "representative";
    readonly REPRESENTATIVES: "representatives";
    readonly AGENT: "agent";
    readonly AGENTS: "agents";
    readonly ASSISTANT: "assistant";
    readonly ASSISTANTS: "assistants";
    readonly FACILITATOR: "facilitator";
    readonly FACILITATORS: "facilitators";
    readonly MEDIATOR: "mediator";
    readonly MEDIATORS: "mediators";
    readonly NEGOTIATOR: "negotiator";
    readonly NEGOTIATORS: "negotiators";
    readonly BROKER: "broker";
    readonly BROKERS: "brokers";
    readonly DEALER: "dealer";
    readonly DEALERS: "dealers";
    readonly DISTRIBUTOR: "distributor";
    readonly DISTRIBUTORS: "distributors";
    readonly RESELLER: "reseller";
    readonly RESELLERS: "resellers";
    readonly VENDOR: "vendor";
    readonly VENDORS: "vendors";
    readonly SUPPLIER: "supplier";
    readonly SUPPLIERS: "suppliers";
    readonly PROVIDER: "provider";
    readonly PROVIDERS: "providers";
    readonly CONTRACTOR: "contractor";
    readonly CONTRACTORS: "contractors";
    readonly FREELANCER: "freelancer";
    readonly FREELANCERS: "freelancers";
    readonly MENTOR: "mentor";
    readonly MENTORS: "mentors";
    readonly COACH: "coach";
    readonly COACHES: "coaches";
    readonly TRAINER: "trainer";
    readonly TRAINERS: "trainers";
    readonly INSTRUCTOR: "instructor";
    readonly INSTRUCTORS: "instructors";
    readonly TEACHER: "teacher";
    readonly TEACHERS: "teachers";
    readonly PROFESSOR: "professor";
    readonly PROFESSORS: "professors";
    readonly LECTURER: "lecturer";
    readonly LECTURERS: "lecturers";
    readonly RESEARCHER: "researcher";
    readonly RESEARCHERS: "researchers";
    readonly SCIENTIST: "scientist";
    readonly SCIENTISTS: "scientists";
    readonly SCHOLAR: "scholar";
    readonly SCHOLARS: "scholars";
    readonly ACADEMIC: "academic";
    readonly ACADEMICS: "academics";
    readonly STUDENT: "student";
    readonly STUDENTS: "students";
    readonly GRADUATE: "graduate";
    readonly GRADUATES: "graduates";
    readonly ALUMNI: "alumni";
    readonly ALUMNUS: "alumnus";
    readonly ALUMNA: "alumna";
    readonly ALUMNAE: "alumnae";
    readonly MEMBER: "member";
    readonly MEMBERS: "members";
    readonly MEMBERSHIP: "membership";
    readonly SUBSCRIBER: "subscriber";
    readonly SUBSCRIBERS: "subscribers";
    readonly SUBSCRIPTION: "subscription";
    readonly SUBSCRIPTIONS: "subscriptions";
    readonly CUSTOMER: "customer";
    readonly CUSTOMERS: "customers";
    readonly CLIENT: "client";
    readonly CLIENTS: "clients";
    readonly USER: "user";
    readonly USERS: "users";
    readonly ACCOUNT: "account";
    readonly PROFILE: "profile";
    readonly PROFILES: "profiles";
    readonly GUEST: "guest";
    readonly GUESTS: "guests";
    readonly VISITOR: "visitor";
    readonly VISITORS: "visitors";
    readonly AUDIENCE: "audience";
    readonly AUDIENCES: "audiences";
    readonly COMMUNITY: "community";
    readonly COMMUNITIES: "communities";
    readonly GROUP: "group";
    readonly GROUPS: "groups";
    readonly TEAMS: "teams";
    readonly SQUAD: "squad";
    readonly SQUADS: "squads";
    readonly CREW: "crew";
    readonly CREWS: "crews";
    readonly GANG: "gang";
    readonly GANGS: "gangs";
    readonly CLUB: "club";
    readonly CLUBS: "clubs";
    readonly SOCIETY: "society";
    readonly SOCIETIES: "societies";
    readonly ORGANIZATION: "organization";
    readonly ORGANIZATIONS: "organizations";
    readonly ORGANISATION: "organisation";
    readonly ORGANISATIONS: "organisations";
    readonly COMPANY: "company";
    readonly COMPANIES: "companies";
    readonly CORPORATION: "corporation";
    readonly CORPORATIONS: "corporations";
    readonly BUSINESS: "business";
    readonly BUSINESSES: "businesses";
    readonly ENTERPRISE: "enterprise";
    readonly ENTERPRISES: "enterprises";
    readonly FIRM: "firm";
    readonly FIRMS: "firms";
    readonly AGENCY: "agency";
    readonly AGENCIES: "agencies";
    readonly BUREAU: "bureau";
    readonly BUREAUS: "bureaus";
    readonly BUREAUX: "bureaux";
    readonly OFFICE: "office";
    readonly OFFICES: "offices";
    readonly BRANCH: "branch";
    readonly BRANCHES: "branches";
    readonly DIVISION: "division";
    readonly DIVISIONS: "divisions";
    readonly DEPARTMENT: "department";
    readonly DEPARTMENTS: "departments";
    readonly SECTION: "section";
    readonly SECTIONS: "sections";
    readonly UNIT: "unit";
    readonly UNITS: "units";
};
export declare function isValidEmailStatus(status: string): boolean;
export declare function isValidAntivirSetting(antivir: string): boolean;
export declare function isValidPasswordType(type: string): boolean;
export declare function isValidContentType(contentType: string): boolean;
export declare function isValidCharset(charset: string): boolean;
export declare function isValidEmailPrefix(prefix: string): boolean;
export declare function getEmailId(email: DomainEmail): number;
export declare function getEmailName(email: DomainEmail): string;
export declare function getEmailStatus(email: DomainEmail): string;
export declare function isMailboxEnabled(email: DomainEmail): boolean;
export declare function getMailboxQuota(email: DomainEmail): number;
export declare function getMailboxUsage(email: DomainEmail): number;
export declare function isMailboxUnlimited(email: DomainEmail): boolean;
export declare function getMailboxUsagePercentage(email: DomainEmail): number;
export declare function isForwardingEnabled(email: DomainEmail): boolean;
export declare function getForwardingAddresses(email: DomainEmail): string[];
export declare function isAutoresponderEnabled(email: DomainEmail): boolean;
export declare function getAutoresponderSubject(email: DomainEmail): string | null;
export declare function getAutoresponderText(email: DomainEmail): string | null;
export declare function getAutoresponderEndDate(email: DomainEmail): string | null;
export declare function getPasswordType(email: DomainEmail): string;
export declare function getAntivirSetting(email: DomainEmail): string;
export declare function getDescription(email: DomainEmail): string;
export declare function getUserGuid(email: DomainEmail): string | null;
export declare function getAliases(email: DomainEmail): string[];
export declare function hasUserGuid(email: DomainEmail): boolean;
export declare function hasAliases(email: DomainEmail): boolean;
export declare function isSystemEmail(email: DomainEmail): boolean;
export declare function isPersonalEmail(email: DomainEmail): boolean;
export declare function isForwardingEmail(email: DomainEmail): boolean;
export declare function isAliasEmail(email: DomainEmail): boolean;
export declare function filterEmailsByStatus(emails: DomainEmail[], status: string): DomainEmail[];
export declare function filterEmailsByMailboxEnabled(emails: DomainEmail[]): DomainEmail[];
export declare function filterEmailsByForwardingEnabled(emails: DomainEmail[]): DomainEmail[];
export declare function filterEmailsByAutoresponderEnabled(emails: DomainEmail[]): DomainEmail[];
export declare function filterEmailsBySystemEmails(emails: DomainEmail[]): DomainEmail[];
export declare function filterEmailsByPersonalEmails(emails: DomainEmail[]): DomainEmail[];
export declare function filterEmailsByPrefix(emails: DomainEmail[], prefix: string): DomainEmail[];
export declare function filterEmailsByAntivirSetting(emails: DomainEmail[], antivir: string): DomainEmail[];
export declare function filterEmailsByUnlimitedQuota(emails: DomainEmail[]): DomainEmail[];
export declare function filterEmailsByLimitedQuota(emails: DomainEmail[]): DomainEmail[];
export declare function sortEmailsByName(emails: DomainEmail[], ascending?: boolean): DomainEmail[];
export declare function sortEmailsById(emails: DomainEmail[], ascending?: boolean): DomainEmail[];
export declare function sortEmailsByUsage(emails: DomainEmail[], ascending?: boolean): DomainEmail[];
export declare function sortEmailsByQuota(emails: DomainEmail[], ascending?: boolean): DomainEmail[];
export declare function getTotalEmails(emails: DomainEmail[]): number;
export declare function getEnabledMailboxes(emails: DomainEmail[]): number;
export declare function getEnabledForwarding(emails: DomainEmail[]): number;
export declare function getEnabledAutoresponders(emails: DomainEmail[]): number;
export declare function getSystemEmails(emails: DomainEmail[]): number;
export declare function getPersonalEmails(emails: DomainEmail[]): number;
export declare function getTotalMailboxUsage(emails: DomainEmail[]): number;
export declare function getTotalMailboxQuota(emails: DomainEmail[]): number;
export declare function getAverageMailboxUsage(emails: DomainEmail[]): number;
export declare function getAverageMailboxQuota(emails: DomainEmail[]): number;
export interface EmailCreateRequest {
    name: string;
    password: string;
    passwordType?: 'plain' | 'crypt' | 'md5' | 'sha256' | 'sha512';
    mailbox?: {
        enabled?: boolean;
        quota?: number;
    };
    forwarding?: {
        enabled?: boolean;
        addresses?: string[];
    };
    autoresponder?: {
        enabled?: boolean;
        subject?: string;
        contentType?: 'text/plain' | 'text/html' | 'text/rich';
        content?: string;
    };
    alias?: string;
    antivir?: 'off' | 'inout' | 'in' | 'out';
    cpAccess?: boolean;
    outgoingMessagesLimit?: number;
    description?: string;
}
export interface EmailDeleteRequest {
    name: string;
}
export interface EmailUpdateRequest {
    name: string;
    antivir?: 'off' | 'inout' | 'in' | 'out';
    outgoingMessagesLimit?: number;
    description?: string;
    forwarding?: {
        addresses?: string[];
    };
}
export interface EmailCreateResponse {
    id: number;
    name: string;
    siteId: number;
}
export interface EmailDeleteResponse {
    name: string;
    siteId: number;
}
export interface EmailUpdateResponse {
    name: string;
    siteId: number;
    operationsPerformed: string[];
    fieldResults: Record<string, {
        success: boolean;
        operation: 'set' | 'add';
        error?: string;
        errorCode?: string;
        updated?: boolean;
    }>;
    warnings: string[];
}
export interface EmailCreateApiResponse {
    success: boolean;
    message: string;
    data: EmailCreateResponse;
    raw?: string;
    parsed?: unknown;
}
export interface EmailDeleteApiResponse {
    status: 'success';
    message: string;
    mailName: string;
    siteId: number;
    raw?: string;
    parsed?: unknown;
}
export interface EmailUpdateApiResponse {
    success: boolean;
    message: string;
    mailName: string;
    siteId: number;
    operationsPerformed: string[];
    fieldResults: Record<string, any>;
    warnings: string[];
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
    raw?: string;
    parsed?: unknown;
}
