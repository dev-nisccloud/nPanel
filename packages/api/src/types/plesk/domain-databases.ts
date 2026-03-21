/**
 * Comprehensive TypeScript types for Plesk Databases API response
 * Represents databases for domains in Plesk
 */

// XML declaration types
export interface XmlDeclaration {
  '@_version': string;
  '@_encoding': string;
}

// Database result
export interface DatabaseResult {
  status: string;
  'filter-id': number;
  id: number;
  name: string;
  type: string;
  'webspace-id': number;
  'db-server-id': number;
}

// Database get response
export interface DatabaseGetDb {
  result: DatabaseResult[];
}

// Database section
export interface Database {
  'get-db': DatabaseGetDb;
}

// Main packet structure
export interface Packet {
  database: Database;
  '@_version': string;
}

// Root response structure
export interface DomainDatabasesResponse {
  '?xml': XmlDeclaration;
  packet: Packet;
}

// Raw API response wrapper
export interface DomainDatabasesApiResponse {
  raw: string;
  parsed: DomainDatabasesResponse;
}

// Individual database type (extracted from the result array)
export type DomainDatabase = DatabaseResult;

// Helper types for easier access
export type DomainDatabaseResult = DatabaseResult;

// Type guards for runtime type checking
export function isDomainDatabasesResponse(obj: any): obj is DomainDatabasesResponse {
  return obj && 
    typeof obj === 'object' && 
    obj['?xml'] && 
    obj.packet && 
    obj.packet.database &&
    obj.packet.database['get-db'] &&
    Array.isArray(obj.packet.database['get-db'].result);
}

export function isDomainDatabase(obj: any): obj is DomainDatabase {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.status === 'string' &&
    typeof obj['filter-id'] === 'number' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj['webspace-id'] === 'number' &&
    typeof obj['db-server-id'] === 'number';
}

// Constants for common values
export const DOMAIN_DATABASES_STATUS = {
  OK: 'ok',
  ERROR: 'error'
} as const;

// Database types
export const DOMAIN_DATABASES_TYPES = {
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql',
  MARIADB: 'mariadb',
  MSSQL: 'mssql',
  ORACLE: 'oracle',
  SQLITE: 'sqlite',
  MONGODB: 'mongodb',
  REDIS: 'redis',
  MEMCACHED: 'memcached'
} as const;

// Common database name prefixes
export const DOMAIN_DATABASES_PREFIXES = {
  WP: 'wp_',
  WORDPRESS: 'wordpress_',
  DRUPAL: 'drupal_',
  JOOMLA: 'joomla_',
  MAGENTO: 'magento_',
  PRESTASHOP: 'prestashop_',
  OPENCART: 'opencart_',
  SHOPIFY: 'shopify_',
  WOOCOMMERCE: 'woocommerce_',
  CUSTOM: 'custom_',
  APP: 'app_',
  SITE: 'site_',
  PROJECT: 'project_',
  CLIENT: 'client_',
  USER: 'user_',
  TEST: 'test_',
  DEV: 'dev_',
  STAGING: 'staging_',
  PRODUCTION: 'production_',
  LIVE: 'live_',
  BACKUP: 'backup_',
  TEMP: 'temp_',
  ARCHIVE: 'archive_',
  OLD: 'old_',
  NEW: 'new_',
  V1: 'v1_',
  V2: 'v2_',
  V3: 'v3_',
  BETA: 'beta_',
  ALPHA: 'alpha_',
  DEMO: 'demo_',
  SAMPLE: 'sample_',
  EXAMPLE: 'example_',
  TEMPLATE: 'template_',
  DEFAULT: 'default_',
  MAIN: 'main_',
  PRIMARY: 'primary_',
  SECONDARY: 'secondary_',
  AUXILIARY: 'auxiliary_',
  SUPPORT: 'support_',
  HELPDESK: 'helpdesk_',
  TICKET: 'ticket_',
  CUSTOMER: 'customer_',
  PARTNER: 'partner_',
  VENDOR: 'vendor_',
  SUPPLIER: 'supplier_',
  PROVIDER: 'provider_',
  CONTRACTOR: 'contractor_',
  FREELANCER: 'freelancer_',
  CONSULTANT: 'consultant_',
  ADVISOR: 'advisor_',
  MENTOR: 'mentor_',
  COACH: 'coach_',
  TRAINER: 'trainer_',
  INSTRUCTOR: 'instructor_',
  TEACHER: 'teacher_',
  PROFESSOR: 'professor_',
  LECTURER: 'lecturer_',
  RESEARCHER: 'researcher_',
  SCIENTIST: 'scientist_',
  SCHOLAR: 'scholar_',
  ACADEMIC: 'academic_',
  STUDENT: 'student_',
  GRADUATE: 'graduate_',
  ALUMNI: 'alumni_',
  MEMBER: 'member_',
  SUBSCRIBER: 'subscriber_',
  ACCOUNT: 'account_',
  PROFILE: 'profile_',
  GUEST: 'guest_',
  VISITOR: 'visitor_',
  AUDIENCE: 'audience_',
  COMMUNITY: 'community_',
  GROUP: 'group_',
  TEAM: 'team_',
  SQUAD: 'squad_',
  CREW: 'crew_',
  GANG: 'gang_',
  CLUB: 'club_',
  SOCIETY: 'society_',
  ORGANIZATION: 'organization_',
  ORGANISATION: 'organisation_',
  COMPANY: 'company_',
  CORPORATION: 'corporation_',
  BUSINESS: 'business_',
  ENTERPRISE: 'enterprise_',
  FIRM: 'firm_',
  AGENCY: 'agency_',
  BUREAU: 'bureau_',
  OFFICE: 'office_',
  BRANCH: 'branch_',
  DIVISION: 'division_',
  DEPARTMENT: 'department_',
  SECTION: 'section_',
  UNIT: 'unit_'
} as const;

// Utility functions for database validation
export function isValidDatabaseStatus(status: string): boolean {
  return Object.values(DOMAIN_DATABASES_STATUS).includes(status as any);
}

export function isValidDatabaseType(type: string): boolean {
  return Object.values(DOMAIN_DATABASES_TYPES).includes(type as any);
}

export function isValidDatabasePrefix(prefix: string): boolean {
  return Object.values(DOMAIN_DATABASES_PREFIXES).includes(prefix as any);
}

// Helper functions for parsing database data
export function getDatabaseId(database: DomainDatabase): number {
  return database.id;
}

export function getDatabaseName(database: DomainDatabase): string {
  return database.name;
}

export function getDatabaseType(database: DomainDatabase): string {
  return database.type;
}

export function getDatabaseStatus(database: DomainDatabase): string {
  return database.status;
}

export function getFilterId(database: DomainDatabase): number {
  return database['filter-id'];
}

export function getWebspaceId(database: DomainDatabase): number {
  return database['webspace-id'];
}

export function getDbServerId(database: DomainDatabase): number {
  return database['db-server-id'];
}

// Helper functions for database analysis
export function isWordPressDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('wp_') || database.name.startsWith('wordpress_');
}

export function isDrupalDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('drupal_');
}

export function isJoomlaDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('joomla_');
}

export function isMagentoDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('magento_');
}

export function isPrestaShopDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('prestashop_');
}

export function isOpenCartDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('opencart_');
}

export function isWooCommerceDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('woocommerce_');
}

export function isCustomDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('custom_') || 
         database.name.startsWith('app_') || 
         database.name.startsWith('site_') || 
         database.name.startsWith('project_');
}

export function isTestDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('test_') || 
         database.name.startsWith('dev_') || 
         database.name.startsWith('staging_') || 
         database.name.startsWith('beta_') || 
         database.name.startsWith('alpha_') || 
         database.name.startsWith('demo_');
}

export function isBackupDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('backup_') || 
         database.name.startsWith('archive_') || 
         database.name.startsWith('old_') || 
         database.name.startsWith('temp_');
}

export function isProductionDatabase(database: DomainDatabase): boolean {
  return database.name.startsWith('production_') || 
         database.name.startsWith('live_') || 
         database.name.startsWith('main_') || 
         database.name.startsWith('primary_');
}

export function getDatabasePrefix(database: DomainDatabase): string | null {
  for (const prefix of Object.values(DOMAIN_DATABASES_PREFIXES)) {
    if (database.name.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}

export function getDatabaseSuffix(database: DomainDatabase): string | null {
  const prefix = getDatabasePrefix(database);
  if (prefix) {
    return database.name.substring(prefix.length);
  }
  return database.name;
}

// Helper functions for filtering databases
export function filterDatabasesByStatus(databases: DomainDatabase[], status: string): DomainDatabase[] {
  return databases.filter(database => database.status === status);
}

export function filterDatabasesByType(databases: DomainDatabase[], type: string): DomainDatabase[] {
  return databases.filter(database => database.type === type);
}

export function filterDatabasesByWebspaceId(databases: DomainDatabase[], webspaceId: number): DomainDatabase[] {
  return databases.filter(database => database['webspace-id'] === webspaceId);
}

export function filterDatabasesByDbServerId(databases: DomainDatabase[], dbServerId: number): DomainDatabase[] {
  return databases.filter(database => database['db-server-id'] === dbServerId);
}

export function filterDatabasesByPrefix(databases: DomainDatabase[], prefix: string): DomainDatabase[] {
  return databases.filter(database => database.name.startsWith(prefix));
}

export function filterWordPressDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isWordPressDatabase(database));
}

export function filterDrupalDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isDrupalDatabase(database));
}

export function filterJoomlaDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isJoomlaDatabase(database));
}

export function filterMagentoDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isMagentoDatabase(database));
}

export function filterPrestaShopDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isPrestaShopDatabase(database));
}

export function filterOpenCartDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isOpenCartDatabase(database));
}

export function filterWooCommerceDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isWooCommerceDatabase(database));
}

export function filterCustomDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isCustomDatabase(database));
}

export function filterTestDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isTestDatabase(database));
}

export function filterBackupDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isBackupDatabase(database));
}

export function filterProductionDatabases(databases: DomainDatabase[]): DomainDatabase[] {
  return databases.filter(database => isProductionDatabase(database));
}

// Helper functions for sorting databases
export function sortDatabasesByName(databases: DomainDatabase[], ascending: boolean = true): DomainDatabase[] {
  return databases.sort((a, b) => {
    const nameA = getDatabaseName(a).toLowerCase();
    const nameB = getDatabaseName(b).toLowerCase();
    return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
}

export function sortDatabasesById(databases: DomainDatabase[], ascending: boolean = true): DomainDatabase[] {
  return databases.sort((a, b) => {
    return ascending ? getDatabaseId(a) - getDatabaseId(b) : getDatabaseId(b) - getDatabaseId(a);
  });
}

export function sortDatabasesByType(databases: DomainDatabase[], ascending: boolean = true): DomainDatabase[] {
  return databases.sort((a, b) => {
    const typeA = getDatabaseType(a).toLowerCase();
    const typeB = getDatabaseType(b).toLowerCase();
    return ascending ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA);
  });
}

export function sortDatabasesByWebspaceId(databases: DomainDatabase[], ascending: boolean = true): DomainDatabase[] {
  return databases.sort((a, b) => {
    return ascending ? getWebspaceId(a) - getWebspaceId(b) : getWebspaceId(b) - getWebspaceId(a);
  });
}

export function sortDatabasesByDbServerId(databases: DomainDatabase[], ascending: boolean = true): DomainDatabase[] {
  return databases.sort((a, b) => {
    return ascending ? getDbServerId(a) - getDbServerId(b) : getDbServerId(b) - getDbServerId(a);
  });
}

// Helper functions for database statistics
export function getTotalDatabases(databases: DomainDatabase[]): number {
  return databases.length;
}

export function getDatabasesByType(databases: DomainDatabase[]): Record<string, number> {
  const typeCount: Record<string, number> = {};
  databases.forEach(database => {
    const type = getDatabaseType(database);
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  return typeCount;
}

export function getDatabasesByWebspaceId(databases: DomainDatabase[]): Record<number, number> {
  const webspaceCount: Record<number, number> = {};
  databases.forEach(database => {
    const webspaceId = getWebspaceId(database);
    webspaceCount[webspaceId] = (webspaceCount[webspaceId] || 0) + 1;
  });
  return webspaceCount;
}

export function getDatabasesByDbServerId(databases: DomainDatabase[]): Record<number, number> {
  const serverCount: Record<number, number> = {};
  databases.forEach(database => {
    const serverId = getDbServerId(database);
    serverCount[serverId] = (serverCount[serverId] || 0) + 1;
  });
  return serverCount;
}

export function getWordPressDatabaseCount(databases: DomainDatabase[]): number {
  return filterWordPressDatabases(databases).length;
}

export function getDrupalDatabaseCount(databases: DomainDatabase[]): number {
  return filterDrupalDatabases(databases).length;
}

export function getJoomlaDatabaseCount(databases: DomainDatabase[]): number {
  return filterJoomlaDatabases(databases).length;
}

export function getMagentoDatabaseCount(databases: DomainDatabase[]): number {
  return filterMagentoDatabases(databases).length;
}

export function getPrestaShopDatabaseCount(databases: DomainDatabase[]): number {
  return filterPrestaShopDatabases(databases).length;
}

export function getOpenCartDatabaseCount(databases: DomainDatabase[]): number {
  return filterOpenCartDatabases(databases).length;
}

export function getWooCommerceDatabaseCount(databases: DomainDatabase[]): number {
  return filterWooCommerceDatabases(databases).length;
}

export function getCustomDatabaseCount(databases: DomainDatabase[]): number {
  return filterCustomDatabases(databases).length;
}

export function getTestDatabaseCount(databases: DomainDatabase[]): number {
  return filterTestDatabases(databases).length;
}

export function getBackupDatabaseCount(databases: DomainDatabase[]): number {
  return filterBackupDatabases(databases).length;
}

export function getProductionDatabaseCount(databases: DomainDatabase[]): number {
  return filterProductionDatabases(databases).length;
}

export function getMostCommonDatabaseType(databases: DomainDatabase[]): string | null {
  const typeCount = getDatabasesByType(databases);
  let maxCount = 0;
  let mostCommonType: string | null = null;
  
  for (const [type, count] of Object.entries(typeCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type;
    }
  }
  
  return mostCommonType;
}

export function getMostCommonWebspaceId(databases: DomainDatabase[]): number | null {
  const webspaceCount = getDatabasesByWebspaceId(databases);
  let maxCount = 0;
  let mostCommonWebspaceId: number | null = null;
  
  for (const [webspaceId, count] of Object.entries(webspaceCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonWebspaceId = parseInt(webspaceId);
    }
  }
  
  return mostCommonWebspaceId;
}

export function getMostCommonDbServerId(databases: DomainDatabase[]): number | null {
  const serverCount = getDatabasesByDbServerId(databases);
  let maxCount = 0;
  let mostCommonServerId: number | null = null;
  
  for (const [serverId, count] of Object.entries(serverCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonServerId = parseInt(serverId);
    }
  }
  
  return mostCommonServerId;
}
