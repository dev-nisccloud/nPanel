/**
 * Comprehensive TypeScript types for Plesk Email Accounts API response
 * Represents email accounts for domains in Plesk
 */

// XML declaration types
export interface XmlDeclaration {
  '@_version': string;
  '@_encoding': string;
}

// Mailbox configuration
export interface EmailMailbox {
  enabled: boolean;
  quota: number; // -1 for unlimited
  usage: number;
}

// Forwarding configuration
export interface EmailForwarding {
  enabled: boolean;
  address?: string | string[]; // Can be single address or array of addresses
}

// Autoresponder configuration
export interface EmailAutoresponder {
  enabled: boolean;
  subject?: string;
  content_type?: string;
  charset?: string;
  text?: string;
  end_date?: string;
}

// Password configuration
export interface EmailPassword {
  value: string;
  type: string;
}

// Main email account data
export interface EmailMailname {
  id: number;
  name: string;
  mailbox: EmailMailbox;
  forwarding: EmailForwarding;
  autoresponder: EmailAutoresponder;
  password: EmailPassword;
  antivir: string;
  description: string;
  'user-guid'?: string; // Optional user GUID
  alias?: string | string[]; // Optional aliases
}

// Email result
export interface EmailResult {
  status: string;
  mailname: EmailMailname;
}

// Email get info response
export interface EmailGetInfo {
  result: EmailResult[];
}

// Email section
export interface Email {
  get_info: EmailGetInfo;
}

// Main packet structure
export interface Packet {
  mail: Email;
  '@_version': string;
}

// Root response structure
export interface DomainEmailsResponse {
  '?xml': XmlDeclaration;
  packet: Packet;
}

// Raw API response wrapper
export interface DomainEmailsApiResponse {
  raw: string;
  parsed: DomainEmailsResponse;
}

// Individual email account type (extracted from the result array)
export type DomainEmail = EmailResult;

// Helper types for easier access
export type DomainEmailMailname = EmailMailname;
export type DomainEmailMailbox = EmailMailbox;
export type DomainEmailForwarding = EmailForwarding;
export type DomainEmailAutoresponder = EmailAutoresponder;
export type DomainEmailPassword = EmailPassword;
export type DomainEmailResult = EmailResult;

// Type guards for runtime type checking
export function isDomainEmailsResponse(obj: any): obj is DomainEmailsResponse {
  return obj && 
    typeof obj === 'object' && 
    obj['?xml'] && 
    obj.packet && 
    obj.packet.mail &&
    obj.packet.mail.get_info &&
    Array.isArray(obj.packet.mail.get_info.result);
}

export function isDomainEmail(obj: any): obj is DomainEmail {
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
} as const;

// Antivirus settings
export const DOMAIN_EMAILS_ANTIVIR = {
  OFF: 'off',
  INOUT: 'inout',
  IN: 'in',
  OUT: 'out'
} as const;

// Password types
export const DOMAIN_EMAILS_PASSWORD_TYPES = {
  SYM: 'sym',
  PLAIN: 'plain',
  CRYPT: 'crypt',
  MD5: 'md5',
  SHA256: 'sha256',
  SHA512: 'sha512'
} as const;

// Content types for autoresponder
export const DOMAIN_EMAILS_CONTENT_TYPES = {
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
  TEXT_RICH: 'text/rich'
} as const;

// Character sets
export const DOMAIN_EMAILS_CHARSETS = {
  UTF8: 'UTF-8',
  ASCII: 'ASCII',
  ISO_8859_1: 'ISO-8859-1',
  WINDOWS_1252: 'Windows-1252'
} as const;

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
} as const;

// Utility functions for email validation
export function isValidEmailStatus(status: string): boolean {
  return Object.values(DOMAIN_EMAILS_STATUS).includes(status as any);
}

export function isValidAntivirSetting(antivir: string): boolean {
  return Object.values(DOMAIN_EMAILS_ANTIVIR).includes(antivir as any);
}

export function isValidPasswordType(type: string): boolean {
  return Object.values(DOMAIN_EMAILS_PASSWORD_TYPES).includes(type as any);
}

export function isValidContentType(contentType: string): boolean {
  return Object.values(DOMAIN_EMAILS_CONTENT_TYPES).includes(contentType as any);
}

export function isValidCharset(charset: string): boolean {
  return Object.values(DOMAIN_EMAILS_CHARSETS).includes(charset as any);
}

export function isValidEmailPrefix(prefix: string): boolean {
  return Object.values(DOMAIN_EMAILS_PREFIXES).includes(prefix as any);
}

// Helper functions for parsing email data
export function getEmailId(email: DomainEmail): number {
  return email.mailname.id;
}

export function getEmailName(email: DomainEmail): string {
  return email.mailname.name;
}

export function getEmailStatus(email: DomainEmail): string {
  return email.status;
}

export function isMailboxEnabled(email: DomainEmail): boolean {
  return email.mailname.mailbox.enabled;
}

export function getMailboxQuota(email: DomainEmail): number {
  return email.mailname.mailbox.quota;
}

export function getMailboxUsage(email: DomainEmail): number {
  return email.mailname.mailbox.usage;
}

export function isMailboxUnlimited(email: DomainEmail): boolean {
  return email.mailname.mailbox.quota === -1;
}

export function getMailboxUsagePercentage(email: DomainEmail): number {
  if (isMailboxUnlimited(email)) return 0;
  return (email.mailname.mailbox.usage / email.mailname.mailbox.quota) * 100;
}

export function isForwardingEnabled(email: DomainEmail): boolean {
  return email.mailname.forwarding.enabled;
}

export function getForwardingAddresses(email: DomainEmail): string[] {
  if (!isForwardingEnabled(email)) return [];
  const address = email.mailname.forwarding.address;
  return Array.isArray(address) ? address : address ? [address] : [];
}

export function isAutoresponderEnabled(email: DomainEmail): boolean {
  return email.mailname.autoresponder.enabled;
}

export function getAutoresponderSubject(email: DomainEmail): string | null {
  return email.mailname.autoresponder.subject || null;
}

export function getAutoresponderText(email: DomainEmail): string | null {
  return email.mailname.autoresponder.text || null;
}

export function getAutoresponderEndDate(email: DomainEmail): string | null {
  return email.mailname.autoresponder.end_date || null;
}

export function getPasswordType(email: DomainEmail): string {
  return email.mailname.password.type;
}

export function getAntivirSetting(email: DomainEmail): string {
  return email.mailname.antivir;
}

export function getDescription(email: DomainEmail): string {
  return email.mailname.description;
}

export function getUserGuid(email: DomainEmail): string | null {
  return email.mailname['user-guid'] || null;
}

export function getAliases(email: DomainEmail): string[] {
  const alias = email.mailname.alias;
  return Array.isArray(alias) ? alias : alias ? [alias] : [];
}

export function hasUserGuid(email: DomainEmail): boolean {
  return !!email.mailname['user-guid'];
}

export function hasAliases(email: DomainEmail): boolean {
  return !!email.mailname.alias;
}

export function isSystemEmail(email: DomainEmail): boolean {
  const systemPrefixes = [
    'postmaster', 'hostmaster', 'webmaster', 'abuse', 'admin',
    'no-reply', 'noreply', 'donotreply', 'do-not-reply'
  ];
  return systemPrefixes.includes(email.mailname.name.toLowerCase());
}

export function isPersonalEmail(email: DomainEmail): boolean {
  return hasUserGuid(email) && !isSystemEmail(email);
}

export function isForwardingEmail(email: DomainEmail): boolean {
  return isForwardingEnabled(email) && !isMailboxEnabled(email);
}

export function isAliasEmail(email: DomainEmail): boolean {
  return hasAliases(email) && !isMailboxEnabled(email);
}

// Helper functions for filtering emails
export function filterEmailsByStatus(emails: DomainEmail[], status: string): DomainEmail[] {
  return emails.filter(email => email.status === status);
}

export function filterEmailsByMailboxEnabled(emails: DomainEmail[]): DomainEmail[] {
  return emails.filter(email => isMailboxEnabled(email));
}

export function filterEmailsByForwardingEnabled(emails: DomainEmail[]): DomainEmail[] {
  return emails.filter(email => isForwardingEnabled(email));
}

export function filterEmailsByAutoresponderEnabled(emails: DomainEmail[]): DomainEmail[] {
  return emails.filter(email => isAutoresponderEnabled(email));
}

export function filterEmailsBySystemEmails(emails: DomainEmail[]): DomainEmail[] {
  return emails.filter(email => isSystemEmail(email));
}

export function filterEmailsByPersonalEmails(emails: DomainEmail[]): DomainEmail[] {
  return emails.filter(email => isPersonalEmail(email));
}

export function filterEmailsByPrefix(emails: DomainEmail[], prefix: string): DomainEmail[] {
  return emails.filter(email => email.mailname.name.toLowerCase().startsWith(prefix.toLowerCase()));
}

export function filterEmailsByAntivirSetting(emails: DomainEmail[], antivir: string): DomainEmail[] {
  return emails.filter(email => email.mailname.antivir === antivir);
}

export function filterEmailsByUnlimitedQuota(emails: DomainEmail[]): DomainEmail[] {
  return emails.filter(email => isMailboxUnlimited(email));
}

export function filterEmailsByLimitedQuota(emails: DomainEmail[]): DomainEmail[] {
  return emails.filter(email => !isMailboxUnlimited(email));
}

// Helper functions for sorting emails
export function sortEmailsByName(emails: DomainEmail[], ascending: boolean = true): DomainEmail[] {
  return emails.sort((a, b) => {
    const nameA = getEmailName(a).toLowerCase();
    const nameB = getEmailName(b).toLowerCase();
    return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
}

export function sortEmailsById(emails: DomainEmail[], ascending: boolean = true): DomainEmail[] {
  return emails.sort((a, b) => {
    return ascending ? getEmailId(a) - getEmailId(b) : getEmailId(b) - getEmailId(a);
  });
}

export function sortEmailsByUsage(emails: DomainEmail[], ascending: boolean = true): DomainEmail[] {
  return emails.sort((a, b) => {
    return ascending ? getMailboxUsage(a) - getMailboxUsage(b) : getMailboxUsage(b) - getMailboxUsage(a);
  });
}

export function sortEmailsByQuota(emails: DomainEmail[], ascending: boolean = true): DomainEmail[] {
  return emails.sort((a, b) => {
    return ascending ? getMailboxQuota(a) - getMailboxQuota(b) : getMailboxQuota(b) - getMailboxQuota(a);
  });
}

// Helper functions for email statistics
export function getTotalEmails(emails: DomainEmail[]): number {
  return emails.length;
}

export function getEnabledMailboxes(emails: DomainEmail[]): number {
  return emails.filter(email => isMailboxEnabled(email)).length;
}

export function getEnabledForwarding(emails: DomainEmail[]): number {
  return emails.filter(email => isForwardingEnabled(email)).length;
}

export function getEnabledAutoresponders(emails: DomainEmail[]): number {
  return emails.filter(email => isAutoresponderEnabled(email)).length;
}

export function getSystemEmails(emails: DomainEmail[]): number {
  return emails.filter(email => isSystemEmail(email)).length;
}

export function getPersonalEmails(emails: DomainEmail[]): number {
  return emails.filter(email => isPersonalEmail(email)).length;
}

export function getTotalMailboxUsage(emails: DomainEmail[]): number {
  return emails.reduce((total, email) => total + getMailboxUsage(email), 0);
}

export function getTotalMailboxQuota(emails: DomainEmail[]): number {
  return emails.reduce((total, email) => {
    const quota = getMailboxQuota(email);
    return quota === -1 ? total : total + quota;
  }, 0);
}

export function getAverageMailboxUsage(emails: DomainEmail[]): number {
  const enabledMailboxes = emails.filter(email => isMailboxEnabled(email));
  if (enabledMailboxes.length === 0) return 0;
  return getTotalMailboxUsage(enabledMailboxes) / enabledMailboxes.length;
}

export function getAverageMailboxQuota(emails: DomainEmail[]): number {
  const limitedQuotaEmails = emails.filter(email => !isMailboxUnlimited(email));
  if (limitedQuotaEmails.length === 0) return 0;
  return getTotalMailboxQuota(limitedQuotaEmails) / limitedQuotaEmails.length;
}

// Email CRUD Request/Response Types
export interface EmailCreateRequest {
  name: string; // Required - email account name (e.g., "admin", "support")
  password: string; // Required - email account password
  passwordType?: 'plain' | 'crypt' | 'md5' | 'sha256' | 'sha512'; // Optional - password type (default: 'plain')
  
  // Mailbox settings
  mailbox?: {
    enabled?: boolean; // Optional - enable mailbox (default: true)
    quota?: number; // Optional - mailbox quota in bytes (-1 for unlimited, default: -1)
  };
  
  // Forwarding settings
  forwarding?: {
    enabled?: boolean; // Optional - enable forwarding (default: false)
    addresses?: string[]; // Optional - forwarding addresses
  };
  
  // Autoresponder settings
  autoresponder?: {
    enabled?: boolean; // Optional - enable autoresponder (default: false)
    subject?: string; // Optional - autoresponder subject
    contentType?: 'text/plain' | 'text/html' | 'text/rich'; // Optional - content type (default: 'text/plain')
    content?: string; // Optional - autoresponder content
  };
  
  // Additional settings
  alias?: string; // Optional - email alias (single string, not array)
  antivir?: 'off' | 'inout' | 'in' | 'out'; // Optional - antivirus setting (default: 'off')
  cpAccess?: boolean; // Optional - control panel access (default: false)
  outgoingMessagesLimit?: number; // Optional - outgoing messages limit
  description?: string; // Optional - email account description
}

export interface EmailDeleteRequest {
  name: string; // Required - email account name to delete
}

export interface EmailUpdateRequest {
  name: string; // Required - email account name to update
  
  // Updateable fields
  antivir?: 'off' | 'inout' | 'in' | 'out'; // Optional - antivirus setting
  outgoingMessagesLimit?: number; // Optional - outgoing messages limit
  description?: string; // Optional - email account description
  
  // Forwarding settings (add new addresses)
  forwarding?: {
    addresses?: string[]; // Optional - forwarding addresses to add
  };
  
  // Note: password, alias, autoresponder, and mailbox settings are NOT supported in UPDATE operations
  // These fields will be ignored if provided and marked as unsupported
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