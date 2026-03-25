/**
 * Comprehensive TypeScript types for Plesk Subscriptions API response
 * Represents a cloud service (webspace/subscription) in Plesk
 */

// XML declaration types
export interface XmlDeclaration {
  '@_version': string;
  '@_encoding': string;
}

// Property types for various configurations
export interface Property {
  name: string;
  value: string | number | boolean;
}

// General information about the subscription
export interface GenInfo {
  cr_date: string;
  name: string;
  'ascii-name': string;
  status: number;
  real_size: number;
  'owner-login'?: string;
  'owner-id'?: number;
  dns_ip_address: string;
  htype: string;
  guid: string;
  'vendor-guid': string;
  'external-id': string;
  'sb-site-uuid': string;
  description: string;
  'admin-description': string;
}

// Virtual hosting configuration
export interface VrtHst {
  property: Property[];
  ip_address: string;
}

// Hosting configuration
export interface Hosting {
  vrt_hst: VrtHst;
}

// Resource limits
export interface Limit {
  name: string;
  value: number;
}

export interface Limits {
  overuse: string;
  limit: Limit[];
}

// Statistics
export interface Stat {
  traffic: number;
  subdom: number;
  wu: number;
  box: number;
  redir: number;
  mg: number;
  resp: number;
  maillists: number;
  db: number;
  mssql_db: number;
  traffic_prevday: number;
  domains: number;
  sites: number;
}

// Preferences
export interface Prefs {
  www: boolean;
  stat_ttl: number;
}

// Permission
export interface Permission {
  name: string;
  value: boolean;
}

export interface Permissions {
  permission: Permission[];
}

// Main subscription data
export interface SubscriptionData {
  gen_info: GenInfo;
  hosting: Hosting;
  limits: Limits;
  stat: Stat;
  prefs: Prefs;
  permissions: Permissions;
}

// Subscription result
export interface SubscriptionResult {
  status: string;
  'filter-id': number;
  id: number;
  data: SubscriptionData;
}

// Webspace get response
export interface WebspaceGet {
  result: SubscriptionResult[];
}

// Webspace section
export interface Webspace {
  get: WebspaceGet;
}

// Main packet structure
export interface Packet {
  webspace: Webspace;
  '@_version': string;
}

// Root response structure
export interface CloudServiceResponse {
  '?xml': XmlDeclaration;
  packet: Packet;
}

// Raw API response wrapper
export interface CloudServiceApiResponse {
  raw: string;
  parsed: CloudServiceResponse;
}

// Individual cloud service type (extracted from the result array)
export type CloudService = SubscriptionResult;

// Helper types for easier access
export type CloudServiceData = SubscriptionData;
export type CloudServiceGenInfo = GenInfo;
export type CloudServiceHosting = Hosting;
export type CloudServiceLimits = Limits;
export type CloudServiceStat = Stat;
export type CloudServicePrefs = Prefs;
export type CloudServicePermissions = Permissions;

// Utility types for specific property access
export type CloudServiceProperty = Property;
export type CloudServiceLimit = Limit;
export type CloudServicePermission = Permission;

// Type guards for runtime type checking
export function isCloudServiceResponse(obj: any): obj is CloudServiceResponse {
  return obj && 
    typeof obj === 'object' && 
    obj['?xml'] && 
    obj.packet && 
    obj.packet.webspace &&
    obj.packet.webspace.get &&
    Array.isArray(obj.packet.webspace.get.result);
}

export function isCloudService(obj: any): obj is CloudService {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.status === 'string' &&
    typeof obj['filter-id'] === 'number' &&
    typeof obj.id === 'number' &&
    obj.data &&
    obj.data.gen_info &&
    obj.data.hosting &&
    obj.data.limits &&
    obj.data.stat &&
    obj.data.prefs &&
    obj.data.permissions;
}

// Constants for common values
export const CLOUD_SERVICE_STATUS = {
  OK: 'ok',
  ERROR: 'error'
} as const;

export const CLOUD_SERVICE_HTYPE = {
  VIRTUAL_HOSTING: 'vrt_hst'
} as const;

export const CLOUD_SERVICE_OVERUSE = {
  BLOCK: 'block',
  ALLOW: 'allow'
} as const;

export const CLOUD_SERVICE_WEBSTAT = {
  AWSTATS: 'awstats',
  NONE: 'none'
} as const;

export const CLOUD_SERVICE_PHP_HANDLER = {
  PLESK_PHP83_FPM: 'plesk-php83-fpm'
} as const;

export const CLOUD_SERVICE_UNPAID_STATUS = {
  SUSPENDED: 'suspended',
  ACTIVE: 'active'
} as const;

export const CLOUD_SERVICE_WAF_RULE_ENGINE = {
  ON: 'on',
  OFF: 'off'
} as const;

export const CLOUD_SERVICE_NGINX_PROXY_MODE = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_SSL = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_SSL_REDIRECT = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PHP = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_SSI = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_CGI = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PERL = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PYTHON = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_ASP = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_ASP_DOT_NET = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_ERRDOCS = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_WUSCRIPTS = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_AT_DOMAINS = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_FASTCGI = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_WEBSTAT_PROTECTED = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_CACHE_ENABLED = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_CACHE_BYPASS_HEADER_NOCACHE = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_CACHE_BYPASS_HEADER_AUTH = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_CACHE_BYPASS_GET_NOCACHE = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_CACHE_USE_STALE_5XX = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_CACHE_USE_STALE_4XX = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_CACHE_USE_STALE_UPDATING = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_WEB_SERVER_EXPIRES_STATIC_ONLY = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_APACHE_RESTRICT_FOLLOW_SYM_LINKS = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_TRANSPARENT_MODE = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_SERVE_STATIC = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_NGINX_SERVE_PHP = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PREFS_WWW = {
  ENABLED: true,
  DISABLED: false
} as const;

// ============================================================================
// CRUD REQUEST TYPES
// ============================================================================

// Cloud Service (Subscription) Create Request
export interface CloudServiceCreateRequest {
  name: string; // Required - domain name (e.g., "example.com")
  ownerId: number; // Required - customer ID (only customer-owned subscriptions supported for creation)
  servicePlanId?: number; // Optional - service plan ID to use
  servicePlanName?: string; // Optional - service plan name to use (alternative to ID)
  ipAddress?: string; // Optional - IP address for the subscription
  status?: 0 | 16 | 32; // Optional - status (0=active, 16=suspended, 32=disabled)

  // Hosting settings
  hostingType?: 'vrt_hst' | 'std_fwd' | 'frm_fwd' | 'none'; // Optional - hosting type
  ftpLogin?: string; // Optional - FTP login (auto-generated if not provided)
  ftpPassword?: string; // Optional - FTP password (auto-generated if not provided)

  // Additional settings
  description?: string; // Optional - subscription description
  adminDescription?: string; // Optional - admin description

  // Resource limits (if not using service plan)
  diskSpace?: number; // Optional - disk space limit in bytes
  bandwidth?: number; // Optional - bandwidth limit in bytes
  databases?: number; // Optional - number of databases allowed
  emailAccounts?: number; // Optional - number of email accounts allowed
  subdomains?: number; // Optional - number of subdomains allowed

  // Preferences
  wwwPrefix?: boolean; // Optional - enable www prefix
  statisticsType?: number; // Optional - statistics time-to-live
}

// Cloud Service (Subscription) Update Request
export interface CloudServiceUpdateRequest {
  id: number; // Required - subscription ID to update
  name?: string; // Optional - new domain name
  status?: 0 | 16 | 32; // Optional - new status (0=active, 16=suspended, 32=disabled)
  ipAddress?: string; // Optional - new IP address
  description?: string; // Optional - new description
  adminDescription?: string; // Optional - new admin description

  // Resource limits updates
  diskSpace?: number; // Optional - new disk space limit
  bandwidth?: number; // Optional - new bandwidth limit
  databases?: number; // Optional - new database limit
  emailAccounts?: number; // Optional - new email account limit
  subdomains?: number; // Optional - new subdomain limit

  // Preferences updates
  wwwPrefix?: boolean; // Optional - enable/disable www prefix
  statisticsType?: number; // Optional - new statistics setting
}

// Cloud Service (Subscription) Delete Request
export interface CloudServiceDeleteRequest {
  id: number; // Required - subscription ID to delete
}

// ============================================================================
// CRUD RESPONSE TYPES
// ============================================================================

// Cloud Service Create Response
export interface CloudServiceCreateResponse {
  status: 'ok' | 'error';
  id?: number;
  guid?: string;
  errcode?: number;
  errtext?: string;
}

// Cloud Service Update Response
export interface CloudServiceUpdateResponse {
  status: 'ok' | 'error';
  id?: number;
  errcode?: number;
  errtext?: string;
}

// Cloud Service Delete Response
export interface CloudServiceDeleteResponse {
  status: 'ok' | 'error';
  id?: number;
  'filter-id'?: string;
  errcode?: number;
  errtext?: string;
}

// ============================================================================
// CRUD API RESPONSE WRAPPERS
// ============================================================================

// Cloud Service Create API Response
export interface CloudServiceCreateApiResponse {
  raw: string;
  parsed: {
    '?xml': XmlDeclaration;
    packet: {
      webspace: {
        add: {
          result: CloudServiceCreateResponse;
        };
      };
      '@_version': string;
    };
  };
}

// Cloud Service Update API Response
export interface CloudServiceUpdateApiResponse {
  raw: string;
  parsed: {
    '?xml': XmlDeclaration;
    packet: {
      webspace: {
        set: {
          result: CloudServiceUpdateResponse;
        };
      };
      '@_version': string;
    };
  };
}

// Cloud Service Delete API Response
export interface CloudServiceDeleteApiResponse {
  raw: string;
  parsed: {
    '?xml': XmlDeclaration;
    packet: {
      webspace: {
        del: {
          result: CloudServiceDeleteResponse;
        };
      };
      '@_version': string;
    };
  };
}