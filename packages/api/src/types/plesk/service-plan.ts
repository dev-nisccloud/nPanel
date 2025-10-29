/**
 * Comprehensive TypeScript types for Plesk Service Plans API response
 * Represents a cloud service plan (subscription plan) in Plesk
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

// Setting types for PHP and other configurations
export interface Setting {
  name: string;
  value: string | number;
}

// Mail configuration
export interface NonexistentUser {
  reject: string;
}

export interface Mail {
  'nonexistent-user': NonexistentUser;
  webmail: string;
  'outgoing-messages-mbox-limit': string;
  'outgoing-messages-domain-limit': string;
  'outgoing-messages-subscription-limit': string;
  'outgoing-messages-enable-sendmail': string;
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

// Log rotation configuration
export interface LogCondition {
  'log-bysize': number;
}

export interface LogRotationOn {
  'log-condition': LogCondition;
  'log-max-num-files': number;
  'log-compress': boolean;
}

export interface LogRotation {
  on: LogRotationOn;
}

// Preferences
export interface Preferences {
  stat: number;
  maillists: boolean;
  mailservice: boolean;
  dns_zone_type: string;
}

// Hosting configuration
export interface VrtHstProperty {
  name: string;
  value: string | number | boolean;
}

export interface VrtHst {
  property: VrtHstProperty[];
}

export interface Hosting {
  none?: string;
  vrt_hst?: VrtHst;
}

// Performance settings
export interface Performance {
  bandwidth: number;
  max_connections: number;
}

// Permission
export interface Permission {
  name: string;
  value: boolean;
}

export interface Permissions {
  permission: Permission[];
}

// Plan items
export interface PlanItem {
  name: string;
}

export interface PlanItems {
  item: PlanItem;
}

// Packages
export interface Package {
  name: string;
}

export interface Packages {
  package: Package[];
}

// PHP settings
export interface PhpSettings {
  setting: Setting[];
}

// Web server settings
export interface WebServerSettings {
  'restrict-follow-sym-links': boolean;
  'nginx-proxy-mode': boolean;
}

// Main service plan data
export interface ServicePlanData {
  status: string;
  id: number;
  name: string;
  guid: string;
  'external-id': string;
  'owner-login': string;
  mail: Mail;
  limits: Limits;
  'log-rotation': LogRotation;
  preferences: Preferences;
  hosting: Hosting;
  performance: Performance;
  permissions: Permissions;
  'plan-items': string | PlanItems;
  'aps-filter': boolean;
  packages: string | Packages;
  'php-settings': PhpSettings;
  'web-server-settings': WebServerSettings;
}

// Service plan get response
export interface ServicePlanGet {
  result: ServicePlanData[];
}

// Service plan section
export interface ServicePlan {
  get: ServicePlanGet;
}

// Main packet structure
export interface Packet {
  'service-plan': ServicePlan;
  '@_version': string;
}

// Root response structure
export interface CloudServicePlanResponse {
  '?xml': XmlDeclaration;
  packet: Packet;
}

// Raw API response wrapper
export interface CloudServicePlanApiResponse {
  raw: string;
  parsed: CloudServicePlanResponse;
}

// Individual cloud service plan type (extracted from the result array)
export type CloudServicePlan = ServicePlanData;

// Helper types for easier access
export type CloudServicePlanData = ServicePlanData;
export type CloudServicePlanMail = Mail;
export type CloudServicePlanLimits = Limits;
export type CloudServicePlanLogRotation = LogRotation;
export type CloudServicePlanPreferences = Preferences;
export type CloudServicePlanHosting = Hosting;
export type CloudServicePlanPerformance = Performance;
export type CloudServicePlanPermissions = Permissions;
export type CloudServicePlanPhpSettings = PhpSettings;
export type CloudServicePlanWebServerSettings = WebServerSettings;

// Utility types for specific property access
export type CloudServicePlanProperty = VrtHstProperty;
export type CloudServicePlanLimit = Limit;
export type CloudServicePlanPermission = Permission;
export type CloudServicePlanSetting = Setting;
export type CloudServicePlanPackage = Package;
export type CloudServicePlanPlanItem = PlanItem;

// Type guards for runtime type checking
export function isCloudServicePlanResponse(obj: any): obj is CloudServicePlanResponse {
  return obj && 
    typeof obj === 'object' && 
    obj['?xml'] && 
    obj.packet && 
    obj.packet['service-plan'] &&
    obj.packet['service-plan'].get &&
    Array.isArray(obj.packet['service-plan'].get.result);
}

export function isCloudServicePlan(obj: any): obj is CloudServicePlan {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.status === 'string' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.guid === 'string' &&
    typeof obj['external-id'] === 'string' &&
    typeof obj['owner-login'] === 'string' &&
    obj.mail &&
    obj.limits &&
    obj['log-rotation'] &&
    obj.preferences &&
    obj.hosting &&
    obj.performance &&
    obj.permissions &&
    obj['php-settings'] &&
    obj['web-server-settings'];
}

// Constants for common values
export const CLOUD_SERVICE_PLAN_STATUS = {
  OK: 'ok',
  ERROR: 'error'
} as const;

export const CLOUD_SERVICE_PLAN_OVERUSE = {
  NORMAL: 'normal',
  BLOCK: 'block',
  NOT_SUSPEND: 'not_suspend'
} as const;

export const CLOUD_SERVICE_PLAN_WEBMAIL = {
  ROUNDCUBE: 'roundcube'
} as const;

export const CLOUD_SERVICE_PLAN_OUTGOING_MESSAGES = {
  DEFAULT: 'default'
} as const;

export const CLOUD_SERVICE_PLAN_DNS_ZONE_TYPE = {
  MASTER: 'master'
} as const;

export const CLOUD_SERVICE_PLAN_HOSTING_TYPE = {
  NONE: 'none',
  VRT_HST: 'vrt_hst'
} as const;

export const CLOUD_SERVICE_PLAN_WEBSTAT = {
  AWSTATS: 'awstats',
  WEBALIZER: 'webalizer',
  NONE: 'none'
} as const;

export const CLOUD_SERVICE_PLAN_PHP_HANDLER = {
  PLESK_PHP83_FPM: 'plesk-php83-fpm',
  PLESK_PHP83_FPM_DEDICATED: 'plesk-php83-fpm-dedicated'
} as const;

export const CLOUD_SERVICE_PLAN_UNPAID_STATUS = {
  SUSPENDED: 'suspended',
  ACTIVE: 'active'
} as const;

export const CLOUD_SERVICE_PLAN_SHELL = {
  BIN_FALSE: '/bin/false'
} as const;

export const CLOUD_SERVICE_PLAN_SSL = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_SSL_REDIRECT = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_WEBSTAT_PROTECTED = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_ERRDOCS = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_WU_SCRIPT = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_PHP_SERVED_BY_NGINX = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_SSI = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_PHP = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_CGI = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_PERL = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_PYTHON = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_FASTCGI = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_APS_FILTER = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_RESTRICT_FOLLOW_SYM_LINKS = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_NGINX_PROXY_MODE = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_MAILLISTS = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_MAILSERVICE = {
  ENABLED: true,
  DISABLED: false
} as const;

export const CLOUD_SERVICE_PLAN_LOG_COMPRESS = {
  ENABLED: true,
  DISABLED: false
} as const;

// PHP Settings Constants
export const CLOUD_SERVICE_PLAN_PHP_SAFE_MODE = {
  ON: 'on',
  OFF: 'off'
} as const;

export const CLOUD_SERVICE_PLAN_PHP_OPEN_BASEDIR = {
  WEBSPACEROOT_TMP: '{WEBSPACEROOT}{/}{:}{TMP}{/}'
} as const;

export const CLOUD_SERVICE_PLAN_PHP_ERROR_REPORTING = {
  ALL_EXCEPT_NOTICE_STRICT_DEPRECATED: 'E_ALL & ~E_NOTICE & ~E_STRICT & ~E_DEPRECATED'
} as const;

export const CLOUD_SERVICE_PLAN_PHP_DISABLE_FUNCTIONS = {
  OPCACHE_GET_STATUS: 'opcache_get_status'
} as const;

export const CLOUD_SERVICE_PLAN_PHP_PM = {
  ONDEMAND: 'ondemand'
} as const;

export const CLOUD_SERVICE_PLAN_PHP_ADDITIONAL_DIRECTIVES = {
  EMPTY: ''
} as const;

// Memory limit constants
export const CLOUD_SERVICE_PLAN_PHP_MEMORY_LIMIT = {
  '256M': '256M',
  '300M': '300M',
  '512M': '512M'
} as const;

// Execution time constants
export const CLOUD_SERVICE_PLAN_PHP_MAX_EXECUTION_TIME = {
  '60': 60,
  '90': 90,
  '600': 600
} as const;

// File size constants
export const CLOUD_SERVICE_PLAN_PHP_POST_MAX_SIZE = {
  '16M': '16M',
  '30M': '30M'
} as const;

export const CLOUD_SERVICE_PLAN_PHP_UPLOAD_MAX_FILESIZE = {
  '16M': '16M',
  '30M': '30M'
} as const;

// PM settings constants
export const CLOUD_SERVICE_PLAN_PHP_PM_MAX_CHILDREN = {
  '10': 10
} as const;

export const CLOUD_SERVICE_PLAN_PHP_PM_MAX_REQUESTS = {
  '0': 0
} as const;

export const CLOUD_SERVICE_PLAN_PHP_PM_START_SERVERS = {
  '1': 1
} as const;

export const CLOUD_SERVICE_PLAN_PHP_PM_MIN_SPARE_SERVERS = {
  '1': 1
} as const;

export const CLOUD_SERVICE_PLAN_PHP_PM_MAX_SPARE_SERVERS = {
  '1': 1
} as const;

// Log rotation constants
export const CLOUD_SERVICE_PLAN_LOG_BYSIZE = {
  '10485760': 10485760 // 10MB
} as const;

export const CLOUD_SERVICE_PLAN_LOG_MAX_NUM_FILES = {
  '10': 10
} as const;

// Package names constants
export const CLOUD_SERVICE_PLAN_PACKAGE_NAMES = {
  DRUPAL: 'drupal',
  JOOMLA: 'joomla',
  MAGENTO: 'magento',
  OSCOMMERCE: 'oscommerce',
  PRESTASHOP: 'prestashop',
  WORDPRESS: 'wordpress'
} as const;

// Plan item constants
export const CLOUD_SERVICE_PLAN_PLAN_ITEM_NAMES = {
  KEEP_SECURED: 'urn:ext:sslit:plan-item-sdk:keep-secured'
} as const;

// Limit name constants
export const CLOUD_SERVICE_PLAN_LIMIT_NAMES = {
  MAX_SITE: 'max_site',
  MAX_SUBDOM: 'max_subdom',
  MAX_DOM_ALIASES: 'max_dom_aliases',
  DISK_SPACE: 'disk_space',
  DISK_SPACE_SOFT: 'disk_space_soft',
  MAX_TRAFFIC: 'max_traffic',
  MAX_TRAFFIC_SOFT: 'max_traffic_soft',
  MAX_WU: 'max_wu',
  MAX_SUBFTP_USERS: 'max_subftp_users',
  MAX_DB: 'max_db',
  MAX_BOX: 'max_box',
  MBOX_QUOTA: 'mbox_quota',
  MAX_MAILLISTS: 'max_maillists',
  EXPIRATION: 'expiration',
  CGROUPS_CPU_USAGE: 'cgroups_cpu_usage',
  CGROUPS_CPU_USAGE_SOFT: 'cgroups_cpu_usage_soft',
  CGROUPS_RAM_USAGE: 'cgroups_ram_usage',
  CGROUPS_RAM_USAGE_SOFT: 'cgroups_ram_usage_soft',
  CGROUPS_DISK_READ_USAGE: 'cgroups_disk_read_usage',
  CGROUPS_DISK_READ_USAGE_SOFT: 'cgroups_disk_read_usage_soft',
  CGROUPS_DISK_WRITE_USAGE: 'cgroups_disk_write_usage',
  CGROUPS_DISK_WRITE_USAGE_SOFT: 'cgroups_disk_write_usage_soft',
  CGROUPS_CPU_PERIOD: 'cgroups_cpu_period',
  CGROUPS_RAM_PERIOD: 'cgroups_ram_period',
  CGROUPS_DISK_READ_PERIOD: 'cgroups_disk_read_period',
  CGROUPS_DISK_WRITE_PERIOD: 'cgroups_disk_write_period',
  EXT_LIMIT_WP_TOOLKIT_WP_INSTANCES: 'ext_limit_wp_toolkit_wp_instances',
  EXT_LIMIT_WP_TOOLKIT_WP_BACKUPS: 'ext_limit_wp_toolkit_wp_backups',
  EXT_LIMIT_WP_TOOLKIT_SMART_UPDATE_INSTANCES: 'ext_limit_wp_toolkit_smart_update_instances',
  EXT_LIMIT_WP_TOOLKIT_VIRTUAL_PATCHES_INSTANCES: 'ext_limit_wp_toolkit_virtual_patches_instances',
  EXT_LIMIT_XOVI_MAX_KEYWORDS: 'ext_limit_xovi_max_keywords',
  EXT_LIMIT_JOOMLA_TOOLKIT_JTK_CUSTOM_BACKUP_LIMIT: 'ext_limit_joomla_toolkit_jtk_custom_backup_limit',
  EXT_LIMIT_JOOMLA_TOOLKIT_JTK_SCHEDULED_BACKUP_LIMIT: 'ext_limit_joomla_toolkit_jtk_scheduled_backup_limit',
  EXT_LIMIT_JOOMLA_TOOLKIT_JTK_MONTHS_TO_KEEP_LOGS: 'ext_limit_joomla_toolkit_jtk_months_to_keep_logs',
  UPSELL_SITE_BUILDER: 'upsell_site_builder'
} as const;

// Permission name constants
export const CLOUD_SERVICE_PLAN_PERMISSION_NAMES = {
  MANAGE_PHOSTING_SSI: 'manage_phosting_ssi',
  MANAGE_PHOSTING_PHP: 'manage_phosting_php',
  MANAGE_PHOSTING_CGI: 'manage_phosting_cgi',
  MANAGE_PHOSTING_PERL: 'manage_phosting_perl',
  MANAGE_PHOSTING_PYTHON: 'manage_phosting_python',
  MANAGE_PHOSTING_FASTCGI: 'manage_phosting_fastcgi',
  MANAGE_SH_ACCESS: 'manage_sh_access',
  MANAGE_PHOSTING_ERRDOCS: 'manage_phosting_errdocs',
  MANAGE_PHOSTING_SSL: 'manage_phosting_ssl',
  MANAGE_PHOSTING_WEBDEPLOY: 'manage_phosting_webdeploy',
  MANAGE_DNS: 'manage_dns',
  MANAGE_PHOSTING: 'manage_phosting',
  MANAGE_PHP_SETTINGS: 'manage_php_settings',
  MANAGE_PHP_VERSION: 'manage_php_version',
  ALLOW_INSECURE_SITES: 'allow_insecure_sites',
  MANAGE_NOT_CHROOT_SHELL: 'manage_not_chroot_shell',
  MANAGE_ANONFTP: 'manage_anonftp',
  MANAGE_CRONTAB: 'manage_crontab',
  MANAGE_SPAMFILTER: 'manage_spamfilter',
  MANAGE_VIRUSFILTER: 'manage_virusfilter',
  ALLOW_LOCAL_BACKUPS: 'allow_local_backups',
  ALLOW_FTP_BACKUPS: 'allow_ftp_backups',
  ALLOW_ACCOUNT_LOCAL_BACKUPS: 'allow_account_local_backups',
  ALLOW_ACCOUNT_FTP_BACKUPS: 'allow_account_ftp_backups',
  MANAGE_WEBSTAT: 'manage_webstat',
  MANAGE_LOG: 'manage_log',
  ACCESS_APPCATALOG: 'access_appcatalog',
  CREATE_DOMAINS: 'create_domains',
  MANAGE_SUBDOMAINS: 'manage_subdomains',
  MANAGE_DOMAIN_ALIASES: 'manage_domain_aliases',
  MANAGE_SUBFTP: 'manage_subftp',
  MANAGE_MAIL_SETTINGS: 'manage_mail_settings',
  MANAGE_MAILLISTS: 'manage_maillists',
  MANAGE_MAIL_AUTODISCOVER: 'manage_mail_autodiscover',
  MANAGE_PERFORMANCE: 'manage_performance',
  MANAGE_QUOTA: 'manage_quota',
  SELECT_DB_SERVER: 'select_db_server',
  REMOTE_DB_CONNECTION: 'remote_db_connection',
  MANAGE_WEBSITE_MAINTENANCE: 'manage_website_maintenance',
  MANAGE_PROTECTED_DIRS: 'manage_protected_dirs',
  ACCESS_SERVICE_USERS: 'access_service_users',
  EXT_PERMISSION_GIT_MANAGE_GIT: 'ext_permission_git_manage_git',
  EXT_PERMISSION_WP_TOOLKIT_MANAGE_WORDPRESS_TOOLKIT: 'ext_permission_wp_toolkit_manage_wordpress_toolkit',
  EXT_PERMISSION_WP_TOOLKIT_MANAGE_SECURITY_WORDPRESS_TOOLKIT: 'ext_permission_wp_toolkit_manage_security_wordpress_toolkit',
  EXT_PERMISSION_WP_TOOLKIT_MANAGE_CLONING: 'ext_permission_wp_toolkit_manage_cloning',
  EXT_PERMISSION_WP_TOOLKIT_MANAGE_SYNCING: 'ext_permission_wp_toolkit_manage_syncing',
  EXT_PERMISSION_WP_TOOLKIT_MANAGE_AUTOUPDATES: 'ext_permission_wp_toolkit_manage_autoupdates',
  EXT_PERMISSION_WP_TOOLKIT_MANAGE_SMART_PHP_UPDATE: 'ext_permission_wp_toolkit_manage_smart_php_update',
  EXT_PERMISSION_WP_TOOLKIT_WP_CLI_ACCESS_IN_UI: 'ext_permission_wp_toolkit_wp_cli_access_in_ui',
  EXT_PERMISSION_IMUNIFY360_IMUNIFY_END_USER_ON: 'ext_permission_imunify360_imunify_end_user_on',
  EXT_PERMISSION_IMUNIFY360_IMUNIFY_SCANNING_ALLOWED: 'ext_permission_imunify360_imunify_scanning_allowed',
  EXT_PERMISSION_IMUNIFY360_IMUNIFY_CLEANUP_ALLOWED: 'ext_permission_imunify360_imunify_cleanup_allowed',
  EXT_PERMISSION_PLESK_SITEJET_CREATE_SITEJET_SITE: 'ext_permission_plesk_sitejet_create_sitejet_site',
  EXT_PERMISSION_PLESK_SITEJET_ACCESS_XOVI_INTEGRATION: 'ext_permission_plesk_sitejet_access_xovi_integration',
  EXT_PERMISSION_PLESK_SITEJET_ACCESS_ECOMMERCE_INTEGRATION: 'ext_permission_plesk_sitejet_access_ecommerce_integration',
  EXT_PERMISSION_LARAVEL_MANAGE_LARAVEL_TOOLKIT: 'ext_permission_laravel_manage_laravel_toolkit',
  EXT_PERMISSION_NODEJS_SUPPORT_MANAGEMENT: 'ext_permission_nodejs_support_management',
  EXT_PERMISSION_NODEJS_STATE_MANAGEMENT: 'ext_permission_nodejs_state_management',
  EXT_PERMISSION_NODEJS_VERSION_MANAGEMENT: 'ext_permission_nodejs_version_management',
  EXT_PERMISSION_DOT_NET_MANAGE_DOTNET_TOOLKIT: 'ext_permission_dot_net_manage_dotnet_toolkit',
  EXT_PERMISSION_JOOMLA_TOOLKIT_JTK_ENABLED: 'ext_permission_joomla_toolkit_jtk_enabled',
  EXT_PERMISSION_RUBY_SUPPORT_MANAGEMENT: 'ext_permission_ruby_support_management',
  EXT_PERMISSION_RUBY_STATE_MANAGEMENT: 'ext_permission_ruby_state_management',
  EXT_PERMISSION_RUBY_VERSION_MANAGEMENT: 'ext_permission_ruby_version_management',
  EXT_PERMISSION_SITE_BUILDER_SITE_BUILDER_DOMAIN: 'ext_permission_site_builder_site_builder_domain',
  EXT_PERMISSION_JETBACKUP5_MANAGE_JETBACKUP: 'ext_permission_jetbackup5_manage_jetbackup'
} as const;

// Hosting property name constants
export const CLOUD_SERVICE_PLAN_HOSTING_PROPERTY_NAMES = {
  SSL: 'ssl',
  SSL_REDIRECT: 'ssl-redirect',
  WEBSTAT: 'webstat',
  WEBSTAT_PROTECTED: 'webstat_protected',
  ERRDOCS: 'errdocs',
  WU_SCRIPT: 'wu_script',
  SHELL: 'shell',
  FTP_QUOTA: 'ftp_quota',
  PHP_HANDLER_ID: 'php_handler_id',
  PHP_SERVED_BY_NGINX: 'php_served_by_nginx',
  UNPAID_WEBSITE_STATUS: 'unpaid_website_status',
  SSI: 'ssi',
  PHP: 'php',
  CGI: 'cgi',
  PERL: 'perl',
  PYTHON: 'python',
  FASTCGI: 'fastcgi'
} as const;

// PHP setting name constants
export const CLOUD_SERVICE_PLAN_PHP_SETTING_NAMES = {
  SAFE_MODE: 'safe_mode',
  OPEN_BASEDIR: 'open_basedir',
  ERROR_REPORTING: 'error_reporting',
  DISABLE_FUNCTIONS: 'disable_functions',
  PM_MAX_CHILDREN: 'pm.max_children',
  PM_MAX_REQUESTS: 'pm.max_requests',
  PM: 'pm',
  PM_START_SERVERS: 'pm.start_servers',
  PM_MIN_SPARE_SERVERS: 'pm.min_spare_servers',
  PM_MAX_SPARE_SERVERS: 'pm.max_spare_servers',
  ADDITIONAL_DIRECTIVES: 'additional-directives',
  MEMORY_LIMIT: 'memory_limit',
  MAX_EXECUTION_TIME: 'max_execution_time',
  MAX_INPUT_TIME: 'max_input_time',
  POST_MAX_SIZE: 'post_max_size',
  UPLOAD_MAX_FILESIZE: 'upload_max_filesize'
} as const;
