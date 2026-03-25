/**
 * Comprehensive TypeScript types for Plesk Subdomains API response
 * Represents subdomains for domains in Plesk
 */

// XML declaration types
export interface XmlDeclaration {
  '@_version': string;
  '@_encoding': string;
}

// Subdomain property
export interface SubdomainProperty {
  name: string;
  value: string | boolean;
}

// Subdomain data
export interface SubdomainData {
  parent: string;
  name: string;
  property: SubdomainProperty[];
}

// Subdomain result
export interface SubdomainResult {
  status: string;
  'filter-id': string;
  id: number;
  data: SubdomainData;
}

// Subdomain get response
export interface SubdomainGet {
  result: SubdomainResult[];
}

// Subdomain section
export interface Subdomain {
  get: SubdomainGet;
}

// Main packet structure
export interface Packet {
  subdomain: Subdomain;
  '@_version': string;
}

// Root response structure
export interface DomainSubdomainsResponse {
  '?xml': XmlDeclaration;
  packet: Packet;
}

// Raw API response wrapper
export interface DomainSubdomainsApiResponse {
  raw: string;
  parsed: DomainSubdomainsResponse;
}

// Individual subdomain type (extracted from the result array)
export type DomainSubdomain = SubdomainResult;

// Helper types for easier access
export type DomainSubdomainData = SubdomainData;
export type DomainSubdomainProperty = SubdomainProperty;
export type DomainSubdomainResult = SubdomainResult;

// Type guards for runtime type checking
export function isDomainSubdomainsResponse(obj: any): obj is DomainSubdomainsResponse {
  return obj && 
    typeof obj === 'object' && 
    obj['?xml'] && 
    obj.packet && 
    obj.packet.subdomain &&
    obj.packet.subdomain.get &&
    Array.isArray(obj.packet.subdomain.get.result);
}

export function isDomainSubdomain(obj: any): obj is DomainSubdomain {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.status === 'string' &&
    typeof obj['filter-id'] === 'string' &&
    typeof obj.id === 'number' &&
    obj.data &&
    typeof obj.data.parent === 'string' &&
    typeof obj.data.name === 'string' &&
    Array.isArray(obj.data.property);
}

// Constants for common values
export const DOMAIN_SUBDOMAINS_STATUS = {
  OK: 'ok',
  ERROR: 'error'
} as const;

// Subdomain property names
export const DOMAIN_SUBDOMAINS_PROPERTIES = {
  ASP: 'asp',
  SSI: 'ssi',
  PHP: 'php',
  PHP_HANDLER_ID: 'php_handler_id',
  CGI: 'cgi',
  PERL: 'perl',
  PYTHON: 'python',
  FASTCGI: 'fastcgi',
  SSL: 'ssl',
  SAME_SSL: 'same_ssl',
  WWW_ROOT: 'www_root',
  WEBSTAT: 'webstat',
  WEBSTAT_PROTECTED: 'webstat_protected',
  EMPTY_DOCUMENT_ROOT: 'empty-document-root'
} as const;

// PHP handler types
export const DOMAIN_SUBDOMAINS_PHP_HANDLERS = {
  PLESK_PHP82_FPM: 'plesk-php82-fpm',
  PLESK_PHP82_FPM_DEDICATED: 'plesk-php82-fpm-dedicated',
  ALT_PHP81_CGI: 'alt-php81-cgi',
  ALT_PHP80_CGI: 'alt-php80-cgi',
  ALT_PHP79_CGI: 'alt-php79-cgi',
  ALT_PHP78_CGI: 'alt-php78-cgi',
  ALT_PHP77_CGI: 'alt-php77-cgi',
  ALT_PHP76_CGI: 'alt-php76-cgi',
  ALT_PHP75_CGI: 'alt-php75-cgi',
  ALT_PHP74_CGI: 'alt-php74-cgi',
  ALT_PHP73_CGI: 'alt-php73-cgi',
  ALT_PHP72_CGI: 'alt-php72-cgi',
  ALT_PHP71_CGI: 'alt-php71-cgi',
  ALT_PHP70_CGI: 'alt-php70-cgi',
  ALT_PHP56_CGI: 'alt-php56-cgi',
  ALT_PHP55_CGI: 'alt-php55-cgi',
  ALT_PHP54_CGI: 'alt-php54-cgi',
  ALT_PHP53_CGI: 'alt-php53-cgi',
  ALT_PHP52_CGI: 'alt-php52-cgi',
  ALT_PHP51_CGI: 'alt-php51-cgi',
  ALT_PHP50_CGI: 'alt-php50-cgi'
} as const;

// Web statistics types
export const DOMAIN_SUBDOMAINS_WEBSTAT_TYPES = {
  NONE: 'none',
  AWSTATS: 'awstats',
  WEBALIZER: 'webalizer',
  ANALOG: 'analog',
  CUSTOM: 'custom'
} as const;

// Common subdomain patterns
export const DOMAIN_SUBDOMAINS_PATTERNS = {
  WWW: 'www',
  MAIL: 'mail',
  WEBMAIL: 'webmail',
  FTP: 'ftp',
  ADMIN: 'admin',
  API: 'api',
  APP: 'app',
  BLOG: 'blog',
  SHOP: 'shop',
  STORE: 'store',
  SUPPORT: 'support',
  HELP: 'help',
  DOCS: 'docs',
  DOCUMENTATION: 'documentation',
  FORUM: 'forum',
  COMMUNITY: 'community',
  NEWS: 'news',
  PORTAL: 'portal',
  DASHBOARD: 'dashboard',
  PANEL: 'panel',
  CPANEL: 'cpanel',
  PLESK: 'plesk',
  CP: 'cp',
  CONTROL: 'control',
  MANAGE: 'manage',
  MANAGEMENT: 'management',
  ADMINISTRATION: 'administration',
  ADMINISTRATOR: 'administrator',
  ROOT: 'root',
  SUPERUSER: 'superuser',
  SYSADMIN: 'sysadmin',
  SYSTEM: 'system',
  SERVER: 'server',
  HOST: 'host',
  HOSTING: 'hosting',
  DOMAIN: 'domain',
  DOMAINS: 'domains',
  SUBDOMAIN: 'subdomain',
  SUBDOMAINS: 'subdomains',
  SITE: 'site',
  SITES: 'sites',
  WEBSITE: 'website',
  WEBSITES: 'websites',
  WEB: 'web',
  HTTP: 'http',
  HTTPS: 'https',
  SSL: 'ssl',
  TLS: 'tls',
  SECURE: 'secure',
  SECURITY: 'security',
  AUTH: 'auth',
  AUTHENTICATION: 'authentication',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNIN: 'signin',
  SIGNOUT: 'signout',
  REGISTER: 'register',
  REGISTRATION: 'registration',
  SIGNUP: 'signup',
  ACCOUNT: 'account',
  ACCOUNTS: 'accounts',
  USER: 'user',
  USERS: 'users',
  PROFILE: 'profile',
  PROFILES: 'profiles',
  SETTINGS: 'settings',
  CONFIG: 'config',
  CONFIGURATION: 'configuration',
  PREFERENCES: 'preferences',
  OPTIONS: 'options',
  CUSTOMIZE: 'customize',
  CUSTOMIZATION: 'customization',
  THEME: 'theme',
  THEMES: 'themes',
  SKIN: 'skin',
  SKINS: 'skins',
  LAYOUT: 'layout',
  LAYOUTS: 'layouts',
  DESIGN: 'design',
  DESIGNS: 'designs',
  STYLE: 'style',
  STYLES: 'styles',
  CSS: 'css',
  JAVASCRIPT: 'javascript',
  JS: 'js',
  IMAGES: 'images',
  IMG: 'img',
  PICTURES: 'pictures',
  PICS: 'pics',
  PHOTOS: 'photos',
  GALLERY: 'gallery',
  GALLERIES: 'galleries',
  MEDIA: 'media',
  FILES: 'files',
  DOWNLOADS: 'downloads',
  UPLOADS: 'uploads',
  ASSETS: 'assets',
  RESOURCES: 'resources',
  STATIC: 'static',
  PUBLIC: 'public',
  PRIVATE: 'private',
  PROTECTED: 'protected',
  RESTRICTED: 'restricted',
  MEMBERS: 'members',
  MEMBERSHIP: 'membership',
  SUBSCRIPTION: 'subscription',
  SUBSCRIPTIONS: 'subscriptions',
  BILLING: 'billing',
  PAYMENT: 'payment',
  PAYMENTS: 'payments',
  INVOICE: 'invoice',
  INVOICES: 'invoices',
  RECEIPT: 'receipt',
  RECEIPTS: 'receipts',
  ORDER: 'order',
  ORDERS: 'orders',
  CART: 'cart',
  CHECKOUT: 'checkout',
  PURCHASE: 'purchase',
  PURCHASES: 'purchases',
  PRODUCT: 'product',
  PRODUCTS: 'products',
  CATALOG: 'catalog',
  CATALOGS: 'catalogs',
  CATEGORY: 'category',
  CATEGORIES: 'categories',
  TAG: 'tag',
  TAGS: 'tags',
  SEARCH: 'search',
  FILTER: 'filter',
  FILTERS: 'filters',
  SORT: 'sort',
  SORTING: 'sorting',
  ORDER_BY: 'orderby',
  PAGE: 'page',
  PAGES: 'pages',
  POST: 'post',
  POSTS: 'posts',
  ARTICLE: 'article',
  ARTICLES: 'articles',
  CONTENT: 'content',
  CONTENTS: 'contents',
  TEXT: 'text',
  TEXTS: 'texts',
  MESSAGE: 'message',
  MESSAGES: 'messages',
  COMMENT: 'comment',
  COMMENTS: 'comments',
  REVIEW: 'review',
  REVIEWS: 'reviews',
  RATING: 'rating',
  RATINGS: 'ratings',
  FEEDBACK: 'feedback',
  FEEDBACKS: 'feedbacks',
  CONTACT: 'contact',
  CONTACTS: 'contacts',
  ABOUT: 'about',
  INFO: 'info',
  INFORMATION: 'information',
  DETAILS: 'details',
  SPECIFICATION: 'specification',
  SPECIFICATIONS: 'specifications',
  DESCRIPTION: 'description',
  DESCRIPTIONS: 'descriptions',
  SUMMARY: 'summary',
  SUMMARIES: 'summaries',
  OVERVIEW: 'overview',
  OVERVIEWS: 'overviews',
  INTRODUCTION: 'introduction',
  INTRODUCTIONS: 'introductions',
  WELCOME: 'welcome',
  HOME: 'home',
  INDEX: 'index',
  MAIN: 'main',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  ALTERNATIVE: 'alternative',
  ALTERNATIVES: 'alternatives',
  BACKUP: 'backup',
  BACKUPS: 'backups',
  ARCHIVE: 'archive',
  ARCHIVES: 'archives',
  OLD: 'old',
  NEW: 'new',
  LATEST: 'latest',
  RECENT: 'recent',
  POPULAR: 'popular',
  TRENDING: 'trending',
  FEATURED: 'featured',
  HIGHLIGHTED: 'highlighted',
  RECOMMENDED: 'recommended',
  SUGGESTED: 'suggested',
  RELATED: 'related',
  SIMILAR: 'similar',
  MATCHING: 'matching',
  RELEVANT: 'relevant',
  APPROPRIATE: 'appropriate',
  SUITABLE: 'suitable',
  COMPATIBLE: 'compatible',
  SUPPORTED: 'supported',
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  OFFLINE: 'offline',
  ONLINE: 'online',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  ENABLE: 'enable',
  DISABLE: 'disable',
  ON: 'on',
  OFF: 'off',
  YES: 'yes',
  NO: 'no',
  TRUE: 'true',
  FALSE: 'false',
  ALLOW: 'allow',
  DENY: 'deny',
  PERMIT: 'permit',
  FORBID: 'forbid',
  GRANT: 'grant',
  REVOKE: 'revoke',
  GIVE: 'give',
  TAKE: 'take',
  ADD: 'add',
  REMOVE: 'remove',
  DELETE: 'delete',
  DESTROY: 'destroy',
  CREATE: 'create',
  UPDATE: 'update',
  MODIFY: 'modify',
  CHANGE: 'change',
  EDIT: 'edit',
  SAVE: 'save',
  LOAD: 'load',
  FETCH: 'fetch',
  GET: 'get',
  SET: 'set',
  PUT: 'put',
  PATCH: 'patch',
  TRACE: 'trace',
  CONNECT: 'connect',
  UPGRADE: 'upgrade',
  DOWNGRADE: 'downgrade',
  INSTALL: 'install',
  UNINSTALL: 'uninstall',
  DEPLOY: 'deploy',
  UNDEPLOY: 'undeploy',
  PUBLISH: 'publish',
  UNPUBLISH: 'unpublish',
  RELEASE: 'release',
  UNRELEASE: 'unrelease',
  LAUNCH: 'launch',
  SHUTDOWN: 'shutdown',
  START: 'start',
  STOP: 'stop',
  PAUSE: 'pause',
  RESUME: 'resume',
  RESTART: 'restart',
  RELOAD: 'reload',
  REFRESH: 'refresh',
  RESET: 'reset',
  CLEAR: 'clear',
  CLEAN: 'clean',
  PURGE: 'purge',
  FLUSH: 'flush',
  DRAIN: 'drain',
  DROP: 'drop',
  TRUNCATE: 'truncate',
  EMPTY: 'empty',
  FILL: 'fill',
  POPULATE: 'populate',
  SEED: 'seed',
  INITIALIZE: 'initialize',
  INIT: 'init',
  SETUP: 'setup',
  CONFIGURE: 'configure',
  PERSONALIZE: 'personalize',
  CUSTOM: 'custom',
  DEFAULT: 'default',
  STANDARD: 'standard',
  BASIC: 'basic',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  BUSINESS: 'business',
  COMMERCIAL: 'commercial',
  FREE: 'free',
  PREMIUM: 'premium',
  PRO: 'pro',
  PLUS: 'plus',
  ULTIMATE: 'ultimate',
  DELUXE: 'deluxe',
  LUXURY: 'luxury',
  EXCLUSIVE: 'exclusive',
  LIMITED: 'limited',
  SPECIAL: 'special',
  UNIQUE: 'unique',
  RARE: 'rare',
  EXCEPTIONAL: 'exceptional',
  OUTSTANDING: 'outstanding',
  EXCELLENT: 'excellent',
  SUPERIOR: 'superior',
  SUPREME: 'supreme',
  MAXIMUM: 'maximum',
  MINIMUM: 'minimum',
  OPTIMAL: 'optimal',
  IDEAL: 'ideal',
  PERFECT: 'perfect',
  FLAWLESS: 'flawless',
  IMPECCABLE: 'impeccable'
} as const;

// Utility functions for subdomain validation
export function isValidSubdomainProperty(property: string): boolean {
  return Object.values(DOMAIN_SUBDOMAINS_PROPERTIES).includes(property as any);
}

export function isValidPhpHandler(handler: string): boolean {
  return Object.values(DOMAIN_SUBDOMAINS_PHP_HANDLERS).includes(handler as any);
}

export function isValidWebstatType(webstat: string): boolean {
  return Object.values(DOMAIN_SUBDOMAINS_WEBSTAT_TYPES).includes(webstat as any);
}

export function isBooleanProperty(property: string): boolean {
  const booleanProperties = [
    DOMAIN_SUBDOMAINS_PROPERTIES.ASP,
    DOMAIN_SUBDOMAINS_PROPERTIES.SSI,
    DOMAIN_SUBDOMAINS_PROPERTIES.PHP,
    DOMAIN_SUBDOMAINS_PROPERTIES.CGI,
    DOMAIN_SUBDOMAINS_PROPERTIES.PERL,
    DOMAIN_SUBDOMAINS_PROPERTIES.PYTHON,
    DOMAIN_SUBDOMAINS_PROPERTIES.FASTCGI,
    DOMAIN_SUBDOMAINS_PROPERTIES.SSL,
    DOMAIN_SUBDOMAINS_PROPERTIES.SAME_SSL
  ];
  return booleanProperties.includes(property as any);
}

export function isStringProperty(property: string): boolean {
  const stringProperties = [
    DOMAIN_SUBDOMAINS_PROPERTIES.PHP_HANDLER_ID,
    DOMAIN_SUBDOMAINS_PROPERTIES.WWW_ROOT,
    DOMAIN_SUBDOMAINS_PROPERTIES.WEBSTAT,
    DOMAIN_SUBDOMAINS_PROPERTIES.WEBSTAT_PROTECTED,
    DOMAIN_SUBDOMAINS_PROPERTIES.EMPTY_DOCUMENT_ROOT
  ];
  return stringProperties.includes(property as any);
}

// Helper functions for parsing subdomain properties
export function getSubdomainProperty(subdomain: DomainSubdomain, propertyName: string): string | boolean | null {
  const property = subdomain.data.property.find(p => p.name === propertyName);
  return property ? property.value : null;
}

export function getSubdomainBooleanProperty(subdomain: DomainSubdomain, propertyName: string): boolean | null {
  const value = getSubdomainProperty(subdomain, propertyName);
  return typeof value === 'boolean' ? value : null;
}

export function getSubdomainStringProperty(subdomain: DomainSubdomain, propertyName: string): string | null {
  const value = getSubdomainProperty(subdomain, propertyName);
  return typeof value === 'string' ? value : null;
}

export function hasPhpEnabled(subdomain: DomainSubdomain): boolean {
  return getSubdomainBooleanProperty(subdomain, DOMAIN_SUBDOMAINS_PROPERTIES.PHP) === true;
}

export function hasSslEnabled(subdomain: DomainSubdomain): boolean {
  return getSubdomainBooleanProperty(subdomain, DOMAIN_SUBDOMAINS_PROPERTIES.SSL) === true;
}

export function hasSameSslEnabled(subdomain: DomainSubdomain): boolean {
  return getSubdomainBooleanProperty(subdomain, DOMAIN_SUBDOMAINS_PROPERTIES.SAME_SSL) === true;
}

export function getPhpHandler(subdomain: DomainSubdomain): string | null {
  return getSubdomainStringProperty(subdomain, DOMAIN_SUBDOMAINS_PROPERTIES.PHP_HANDLER_ID);
}

export function getWwwRoot(subdomain: DomainSubdomain): string | null {
  return getSubdomainStringProperty(subdomain, DOMAIN_SUBDOMAINS_PROPERTIES.WWW_ROOT);
}

export function getWebstatType(subdomain: DomainSubdomain): string | null {
  return getSubdomainStringProperty(subdomain, DOMAIN_SUBDOMAINS_PROPERTIES.WEBSTAT);
}

export function isSubdomainSecure(subdomain: DomainSubdomain): boolean {
  return hasSslEnabled(subdomain) && hasSameSslEnabled(subdomain);
}

export function getSubdomainPath(subdomain: DomainSubdomain): string | null {
  const wwwRoot = getWwwRoot(subdomain);
  if (!wwwRoot) return null;
  
  // Extract the subdomain path from the www_root
  const parts = wwwRoot.split('/');
  const subdomainName = parts[parts.length - 1];
  return subdomainName || null;
}

export function getParentDomain(subdomain: DomainSubdomain): string {
  return subdomain.data.parent;
}

export function getSubdomainName(subdomain: DomainSubdomain): string {
  return subdomain.data.name;
}

export function getSubdomainId(subdomain: DomainSubdomain): number {
  return subdomain.id;
}

export function getFilterId(subdomain: DomainSubdomain): string {
  return subdomain['filter-id'];
}

// Helper functions for filtering subdomains
export function filterSubdomainsByPhpHandler(subdomains: DomainSubdomain[], handler: string): DomainSubdomain[] {
  return subdomains.filter(subdomain => getPhpHandler(subdomain) === handler);
}

export function filterSubdomainsBySslEnabled(subdomains: DomainSubdomain[]): DomainSubdomain[] {
  return subdomains.filter(subdomain => hasSslEnabled(subdomain));
}

export function filterSubdomainsBySecure(subdomains: DomainSubdomain[]): DomainSubdomain[] {
  return subdomains.filter(subdomain => isSubdomainSecure(subdomain));
}

export function filterSubdomainsByWebstatType(subdomains: DomainSubdomain[], webstatType: string): DomainSubdomain[] {
  return subdomains.filter(subdomain => getWebstatType(subdomain) === webstatType);
}

export function filterSubdomainsByParent(subdomains: DomainSubdomain[], parent: string): DomainSubdomain[] {
  return subdomains.filter(subdomain => getParentDomain(subdomain) === parent);
}

// Helper functions for sorting subdomains
export function sortSubdomainsByName(subdomains: DomainSubdomain[], ascending: boolean = true): DomainSubdomain[] {
  return subdomains.sort((a, b) => {
    const nameA = getSubdomainName(a).toLowerCase();
    const nameB = getSubdomainName(b).toLowerCase();
    return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
}

export function sortSubdomainsById(subdomains: DomainSubdomain[], ascending: boolean = true): DomainSubdomain[] {
  return subdomains.sort((a, b) => {
    return ascending ? a.id - b.id : b.id - a.id;
  });
}

export function sortSubdomainsByPhpHandler(subdomains: DomainSubdomain[], ascending: boolean = true): DomainSubdomain[] {
  return subdomains.sort((a, b) => {
    const handlerA = getPhpHandler(a) || '';
    const handlerB = getPhpHandler(b) || '';
    return ascending ? handlerA.localeCompare(handlerB) : handlerB.localeCompare(handlerA);
  });
}

// Subdomain CRUD Request/Response Types
export interface SubdomainCreateRequest {
  parent: string; // Required - parent domain name (e.g., "example.com")
  name: string; // Required - subdomain name (e.g., "blog")
  
  // Optional properties
  wwwRoot?: string; // Optional - document root directory
  php?: boolean; // Optional - enable PHP
  phpHandlerId?: string; // Optional - PHP handler ID
  ssl?: boolean; // Optional - enable SSL
  sameSsl?: boolean; // Optional - use same SSL as parent domain
  cgi?: boolean; // Optional - enable CGI
  perl?: boolean; // Optional - enable Perl
  python?: boolean; // Optional - enable Python
  fastcgi?: boolean; // Optional - enable FastCGI
  asp?: boolean; // Optional - enable ASP
  ssi?: boolean; // Optional - enable SSI
  webstat?: string; // Optional - web statistics type (none, awstats, webalizer, analog, custom)
  webstatProtected?: boolean; // Optional - protect web statistics
  emptyDocumentRoot?: boolean; // Optional - empty document root
}

export interface SubdomainCreateResponse {
  subdomainId: number;
  filterId?: string;
  parent: string;
  name: string;
}

export interface SubdomainCreateApiResponse {
  success: boolean;
  subdomainId: number;
  filterId?: string;
  parent: string;
  name: string;
  raw?: string;
  parsed?: unknown;
}

export interface SubdomainDeleteRequest {
  name?: string; // Optional - full subdomain name (e.g., "blog.example.com")
  id?: number; // Optional - subdomain ID
}

export interface SubdomainDeleteResponse {
  subdomainId: number;
  filterId?: string;
  name: string;
}

export interface SubdomainDeleteApiResponse {
  success: boolean;
  subdomainId: number;
  filterId?: string;
  name: string;
  raw?: string;
  parsed?: unknown;
}