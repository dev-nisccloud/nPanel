// ServicesAccounts Type Definitions for Plesk Customer API
// Based on Plesk customer API responses

export type XmlDeclaration = {
  '@_version': string;
  '@_encoding': string;
};

export type ServicesAccountGenInfo = {
  'cr_date': string;
  'cname': string;
  'pname': string;
  'login': string;
  'status': number;
  'phone': string | number;
  'fax': string;
  'email': string;
  'address': string;
  'city': string;
  'state': string;
  'pcode': string | number;
  'country': string;
  'locale': string;
  'guid': string;
  'owner-login': string;
  'vendor-guid': string;
  'external-id': string;
  'description': string;
  'password': string;
  'password_type': 'crypt' | 'plain' | 'md5' | 'sha256' | 'bcrypt';
};

export type ServicesAccountStat = {
  'active_domains': number;
  'subdomains': number;
  'disk_space': number;
  'postboxs': number;
  'redirects': number;
  'mail_groups': number;
  'mail_resps': number;
  'mail_lists': number;
  'web_users': number;
  'data_bases': number;
  'traffic': number;
  'traffic_prevday': number;
};

export type ServicesAccountData = {
  'gen_info': ServicesAccountGenInfo;
  'stat': ServicesAccountStat;
};

export type ServicesAccountResult = {
  'status': 'ok' | 'error';
  'filter-id': number;
  'id': number;
  'data': ServicesAccountData;
};

export type ServicesAccountGet = {
  'result': ServicesAccountResult | ServicesAccountResult[];
};

export type ServicesAccount = {
  'get': ServicesAccountGet;
};

export type Packet = {
  'customer': ServicesAccount;
  '@_version': string;
};

export type ServicesAccountsResponse = {
  '?xml': XmlDeclaration;
  'packet': Packet;
};

// Main API Response Types
export type ServicesAccountsApiResponse = ServicesAccountsResponse;

// Individual Account Types
export type ServicesAccountInfo = ServicesAccountResult;

// Type Guards
export function isServicesAccountGenInfo(obj: any): obj is ServicesAccountGenInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj['cr_date'] === 'string' &&
    typeof obj['cname'] === 'string' &&
    typeof obj['pname'] === 'string' &&
    typeof obj['login'] === 'string' &&
    typeof obj['status'] === 'number' &&
    (typeof obj['phone'] === 'string' || typeof obj['phone'] === 'number') &&
    typeof obj['fax'] === 'string' &&
    typeof obj['email'] === 'string' &&
    typeof obj['address'] === 'string' &&
    typeof obj['city'] === 'string' &&
    typeof obj['state'] === 'string' &&
    (typeof obj['pcode'] === 'string' || typeof obj['pcode'] === 'number') &&
    typeof obj['country'] === 'string' &&
    typeof obj['locale'] === 'string' &&
    typeof obj['guid'] === 'string' &&
    typeof obj['owner-login'] === 'string' &&
    typeof obj['vendor-guid'] === 'string' &&
    typeof obj['external-id'] === 'string' &&
    typeof obj['description'] === 'string' &&
    typeof obj['password'] === 'string' &&
    typeof obj['password_type'] === 'string'
  );
}

export function isServicesAccountStat(obj: any): obj is ServicesAccountStat {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj['active_domains'] === 'number' &&
    typeof obj['subdomains'] === 'number' &&
    typeof obj['disk_space'] === 'number' &&
    typeof obj['postboxs'] === 'number' &&
    typeof obj['redirects'] === 'number' &&
    typeof obj['mail_groups'] === 'number' &&
    typeof obj['mail_resps'] === 'number' &&
    typeof obj['mail_lists'] === 'number' &&
    typeof obj['web_users'] === 'number' &&
    typeof obj['data_bases'] === 'number' &&
    typeof obj['traffic'] === 'number' &&
    typeof obj['traffic_prevday'] === 'number'
  );
}

export function isServicesAccountData(obj: any): obj is ServicesAccountData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'gen_info' in obj &&
    'stat' in obj &&
    isServicesAccountGenInfo(obj['gen_info']) &&
    isServicesAccountStat(obj['stat'])
  );
}

export function isServicesAccountResult(obj: any): obj is ServicesAccountResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj['status'] === 'string' &&
    typeof obj['filter-id'] === 'number' &&
    typeof obj['id'] === 'number' &&
    'data' in obj &&
    isServicesAccountData(obj['data'])
  );
}

export function isServicesAccountResultArray(obj: any): obj is ServicesAccountResult[] {
  return Array.isArray(obj) && obj.every(isServicesAccountResult);
}

export function isServicesAccountGet(obj: any): obj is ServicesAccountGet {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'result' in obj &&
    (isServicesAccountResult(obj['result']) || isServicesAccountResultArray(obj['result']))
  );
}

export function isServicesAccount(obj: any): obj is ServicesAccount {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'get' in obj &&
    isServicesAccountGet(obj['get'])
  );
}

export function isPacket(obj: any): obj is Packet {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'customer' in obj &&
    '@_version' in obj &&
    typeof obj['@_version'] === 'string' &&
    isServicesAccount(obj['customer'])
  );
}

export function isServicesAccountsResponse(obj: any): obj is ServicesAccountsResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '?xml' in obj &&
    'packet' in obj &&
    typeof obj['?xml'] === 'object' &&
    obj['?xml'] !== null &&
    '@_version' in obj['?xml'] &&
    '@_encoding' in obj['?xml'] &&
    typeof obj['?xml']['@_version'] === 'string' &&
    typeof obj['?xml']['@_encoding'] === 'string' &&
    isPacket(obj['packet'])
  );
}

export function isServicesAccountsApiResponse(obj: any): obj is ServicesAccountsApiResponse {
  return isServicesAccountsResponse(obj);
}

// Constants for account statuses
export const SERVICES_ACCOUNTS_STATUS = {
  OK: 'ok',
  ERROR: 'error',
} as const;

// Constants for password types
export const SERVICES_ACCOUNTS_PASSWORD_TYPES = {
  CRYPT: 'crypt',
  PLAIN: 'plain',
  MD5: 'md5',
  SHA256: 'sha256',
  BCRYPT: 'bcrypt',
} as const;

// Constants for account status codes
export const SERVICES_ACCOUNTS_STATUS_CODES = {
  ACTIVE: 0,
  SUSPENDED: 1,
  PENDING: 2,
  EXPIRED: 3,
  CANCELLED: 4,
} as const;

// Constants for common locales
export const SERVICES_ACCOUNTS_LOCALES = {
  EN_US: 'en-US',
  EN_GB: 'en-GB',
  EN_CA: 'en-CA',
  EN_AU: 'en-AU',
  FR_FR: 'fr-FR',
  DE_DE: 'de-DE',
  ES_ES: 'es-ES',
  IT_IT: 'it-IT',
  PT_BR: 'pt-BR',
  RU_RU: 'ru-RU',
  ZH_CN: 'zh-CN',
  JA_JP: 'ja-JP',
  KO_KR: 'ko-KR',
  AR_SA: 'ar-SA',
  HI_IN: 'hi-IN',
} as const;

// Constants for common countries
export const SERVICES_ACCOUNTS_COUNTRIES = {
  US: 'US',
  CA: 'CA',
  GB: 'GB',
  AU: 'AU',
  DE: 'DE',
  FR: 'FR',
  ES: 'ES',
  IT: 'IT',
  BR: 'BR',
  RU: 'RU',
  CN: 'CN',
  JP: 'JP',
  KR: 'KR',
  IN: 'IN',
  KE: 'KE',
  NG: 'NG',
  ZA: 'ZA',
  EG: 'EG',
  MA: 'MA',
  XX: 'XX', // Unknown/Not specified
} as const;

// Utility functions for account data
export function getAccountId(account: ServicesAccountResult): number {
  return account.id;
}

export function getAccountLogin(account: ServicesAccountResult): string {
  return account.data['gen_info']['login'];
}

export function getAccountEmail(account: ServicesAccountResult): string {
  return account.data['gen_info']['email'];
}

export function getAccountName(account: ServicesAccountResult): string {
  return account.data['gen_info']['pname'];
}

export function getCompanyName(account: ServicesAccountResult): string {
  return account.data['gen_info']['cname'];
}

export function getAccountStatus(account: ServicesAccountResult): string {
  return account['status'];
}

export function getAccountStatusCode(account: ServicesAccountResult): number {
  return account.data['gen_info']['status'];
}

export function getAccountGuid(account: ServicesAccountResult): string {
  return account.data['gen_info']['guid'];
}

export function getAccountOwnerLogin(account: ServicesAccountResult): string {
  return account.data['gen_info']['owner-login'];
}

export function getAccountVendorGuid(account: ServicesAccountResult): string {
  return account.data['gen_info']['vendor-guid'];
}

export function getAccountExternalId(account: ServicesAccountResult): string {
  return account.data['gen_info']['external-id'];
}

export function getAccountCreationDate(account: ServicesAccountResult): string {
  return account.data['gen_info']['cr_date'];
}

export function getAccountCountry(account: ServicesAccountResult): string {
  return account.data['gen_info']['country'];
}

export function getAccountLocale(account: ServicesAccountResult): string {
  return account.data['gen_info']['locale'];
}

export function getAccountPhone(account: ServicesAccountResult): string | number {
  return account.data['gen_info']['phone'];
}

export function getAccountAddress(account: ServicesAccountResult): string {
  return account.data['gen_info']['address'];
}

export function getAccountCity(account: ServicesAccountResult): string {
  return account.data['gen_info']['city'];
}

export function getAccountState(account: ServicesAccountResult): string {
  return account.data['gen_info']['state'];
}

export function getAccountPostalCode(account: ServicesAccountResult): string | number {
  return account.data['gen_info']['pcode'];
}

export function getAccountPasswordType(account: ServicesAccountResult): string {
  return account.data['gen_info']['password_type'];
}

export function getAccountDescription(account: ServicesAccountResult): string {
  return account.data['gen_info']['description'];
}

// Statistics functions
export function getActiveDomainsCount(account: ServicesAccountResult): number {
  return account.data['stat']['active_domains'];
}

export function getSubdomainsCount(account: ServicesAccountResult): number {
  return account.data['stat']['subdomains'];
}

export function getDiskSpaceUsed(account: ServicesAccountResult): number {
  return account.data['stat']['disk_space'];
}

export function getPostboxesCount(account: ServicesAccountResult): number {
  return account.data['stat']['postboxs'];
}

export function getRedirectsCount(account: ServicesAccountResult): number {
  return account.data['stat']['redirects'];
}

export function getMailGroupsCount(account: ServicesAccountResult): number {
  return account.data['stat']['mail_groups'];
}

export function getMailResponsesCount(account: ServicesAccountResult): number {
  return account.data['stat']['mail_resps'];
}

export function getMailListsCount(account: ServicesAccountResult): number {
  return account.data['stat']['mail_lists'];
}

export function getWebUsersCount(account: ServicesAccountResult): number {
  return account.data['stat']['web_users'];
}

export function getDatabasesCount(account: ServicesAccountResult): number {
  return account.data['stat']['data_bases'];
}

export function getTrafficCurrent(account: ServicesAccountResult): number {
  return account.data['stat']['traffic'];
}

export function getTrafficPreviousDay(account: ServicesAccountResult): number {
  return account.data['stat']['traffic_prevday'];
}

// Validation functions
export function isValidAccountStatus(status: string): boolean {
  return Object.values(SERVICES_ACCOUNTS_STATUS).includes(status as any);
}

export function isValidPasswordType(passwordType: string): boolean {
  return Object.values(SERVICES_ACCOUNTS_PASSWORD_TYPES).includes(passwordType as any);
}

export function isValidStatusCode(statusCode: number): boolean {
  return Object.values(SERVICES_ACCOUNTS_STATUS_CODES).includes(statusCode as any);
}

export function isValidLocale(locale: string): boolean {
  return Object.values(SERVICES_ACCOUNTS_LOCALES).includes(locale as any);
}

export function isValidCountry(country: string): boolean {
  return Object.values(SERVICES_ACCOUNTS_COUNTRIES).includes(country as any);
}

export function isActiveAccount(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['status'] === SERVICES_ACCOUNTS_STATUS_CODES.ACTIVE;
}

export function isSuspendedAccount(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['status'] === SERVICES_ACCOUNTS_STATUS_CODES.SUSPENDED;
}

export function isPendingAccount(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['status'] === SERVICES_ACCOUNTS_STATUS_CODES.PENDING;
}

export function isExpiredAccount(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['status'] === SERVICES_ACCOUNTS_STATUS_CODES.EXPIRED;
}

export function isCancelledAccount(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['status'] === SERVICES_ACCOUNTS_STATUS_CODES.CANCELLED;
}

export function hasCompanyName(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['cname'] !== '';
}

export function hasExternalId(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['external-id'] !== '';
}

export function hasDescription(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['description'] !== '';
}

export function hasPhone(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['phone'] !== '';
}

export function hasFax(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['fax'] !== '';
}

export function hasAddress(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['address'] !== '';
}

export function hasCity(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['city'] !== '';
}

export function hasState(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['state'] !== '';
}

export function hasPostalCode(account: ServicesAccountResult): boolean {
  return account.data['gen_info']['pcode'] !== '';
}

// Filtering functions
export function filterAccountsByStatus(accounts: ServicesAccountResult[], status: string): ServicesAccountResult[] {
  return accounts.filter(account => account['status'] === status);
}

export function filterAccountsByStatusCode(accounts: ServicesAccountResult[], statusCode: number): ServicesAccountResult[] {
  return accounts.filter(account => account.data['gen_info']['status'] === statusCode);
}

export function filterActiveAccounts(accounts: ServicesAccountResult[]): ServicesAccountResult[] {
  return accounts.filter(isActiveAccount);
}

export function filterSuspendedAccounts(accounts: ServicesAccountResult[]): ServicesAccountResult[] {
  return accounts.filter(isSuspendedAccount);
}

export function filterAccountsByCountry(accounts: ServicesAccountResult[], country: string): ServicesAccountResult[] {
  return accounts.filter(account => account.data['gen_info']['country'] === country);
}

export function filterAccountsByLocale(accounts: ServicesAccountResult[], locale: string): ServicesAccountResult[] {
  return accounts.filter(account => account.data['gen_info']['locale'] === locale);
}

export function filterAccountsByOwner(accounts: ServicesAccountResult[], ownerLogin: string): ServicesAccountResult[] {
  return accounts.filter(account => account.data['gen_info']['owner-login'] === ownerLogin);
}

export function filterAccountsByVendor(accounts: ServicesAccountResult[], vendorGuid: string): ServicesAccountResult[] {
  return accounts.filter(account => account.data['gen_info']['vendor-guid'] === vendorGuid);
}

export function filterAccountsWithCompanyName(accounts: ServicesAccountResult[]): ServicesAccountResult[] {
  return accounts.filter(hasCompanyName);
}

export function filterAccountsWithExternalId(accounts: ServicesAccountResult[]): ServicesAccountResult[] {
  return accounts.filter(hasExternalId);
}

export function filterAccountsByEmailDomain(accounts: ServicesAccountResult[], domain: string): ServicesAccountResult[] {
  return accounts.filter(account => account.data['gen_info']['email'].endsWith(`@${domain}`));
}

export function filterAccountsByCreationDate(accounts: ServicesAccountResult[], startDate: string, endDate?: string): ServicesAccountResult[] {
  return accounts.filter(account => {
    const accountDate = account.data['gen_info']['cr_date'];
    if (endDate) {
      return accountDate >= startDate && accountDate <= endDate;
    }
    return accountDate >= startDate;
  });
}

// Sorting functions
export function sortAccountsById(accounts: ServicesAccountResult[], order: 'asc' | 'desc' = 'asc'): ServicesAccountResult[] {
  return [...accounts].sort((a, b) => {
    if (order === 'asc') {
      return a.id - b.id;
    } else {
      return b.id - a.id;
    }
  });
}

export function sortAccountsByLogin(accounts: ServicesAccountResult[], order: 'asc' | 'desc' = 'asc'): ServicesAccountResult[] {
  return [...accounts].sort((a, b) => {
    if (order === 'asc') {
      return a.data['gen_info']['login'].localeCompare(b.data['gen_info']['login']);
    } else {
      return b.data['gen_info']['login'].localeCompare(a.data['gen_info']['login']);
    }
  });
}

export function sortAccountsByName(accounts: ServicesAccountResult[], order: 'asc' | 'desc' = 'asc'): ServicesAccountResult[] {
  return [...accounts].sort((a, b) => {
    if (order === 'asc') {
      return a.data['gen_info']['pname'].localeCompare(b.data['gen_info']['pname']);
    } else {
      return b.data['gen_info']['pname'].localeCompare(a.data['gen_info']['pname']);
    }
  });
}

export function sortAccountsByCompanyName(accounts: ServicesAccountResult[], order: 'asc' | 'desc' = 'asc'): ServicesAccountResult[] {
  return [...accounts].sort((a, b) => {
    if (order === 'asc') {
      return a.data['gen_info']['cname'].localeCompare(b.data['gen_info']['cname']);
    } else {
      return b.data['gen_info']['cname'].localeCompare(a.data['gen_info']['cname']);
    }
  });
}

export function sortAccountsByCreationDate(accounts: ServicesAccountResult[], order: 'asc' | 'desc' = 'asc'): ServicesAccountResult[] {
  return [...accounts].sort((a, b) => {
    if (order === 'asc') {
      return a.data['gen_info']['cr_date'].localeCompare(b.data['gen_info']['cr_date']);
    } else {
      return b.data['gen_info']['cr_date'].localeCompare(a.data['gen_info']['cr_date']);
    }
  });
}

export function sortAccountsByEmail(accounts: ServicesAccountResult[], order: 'asc' | 'desc' = 'asc'): ServicesAccountResult[] {
  return [...accounts].sort((a, b) => {
    if (order === 'asc') {
      return a.data['gen_info']['email'].localeCompare(b.data['gen_info']['email']);
    } else {
      return b.data['gen_info']['email'].localeCompare(a.data['gen_info']['email']);
    }
  });
}

export function sortAccountsByDiskSpace(accounts: ServicesAccountResult[], order: 'asc' | 'desc' = 'desc'): ServicesAccountResult[] {
  return [...accounts].sort((a, b) => {
    if (order === 'asc') {
      return a.data['stat']['disk_space'] - b.data['stat']['disk_space'];
    } else {
      return b.data['stat']['disk_space'] - a.data['stat']['disk_space'];
    }
  });
}

export function sortAccountsByTraffic(accounts: ServicesAccountResult[], order: 'asc' | 'desc' = 'desc'): ServicesAccountResult[] {
  return [...accounts].sort((a, b) => {
    if (order === 'asc') {
      return a.data['stat']['traffic'] - b.data['stat']['traffic'];
    } else {
      return b.data['stat']['traffic'] - a.data['stat']['traffic'];
    }
  });
}

// Statistics functions
export function getTotalAccounts(accounts: ServicesAccountResult[]): number {
  return accounts.length;
}

export function getActiveAccountsCount(accounts: ServicesAccountResult[]): number {
  return accounts.filter(isActiveAccount).length;
}

export function getSuspendedAccountsCount(accounts: ServicesAccountResult[]): number {
  return accounts.filter(isSuspendedAccount).length;
}

export function getAccountsByStatus(accounts: ServicesAccountResult[]): Record<string, number> {
  return accounts.reduce((acc, account) => {
    const status = account['status'];
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function getAccountsByStatusCode(accounts: ServicesAccountResult[]): Record<number, number> {
  return accounts.reduce((acc, account) => {
    const statusCode = account.data['gen_info']['status'];
    acc[statusCode] = (acc[statusCode] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
}

export function getAccountsByCountry(accounts: ServicesAccountResult[]): Record<string, number> {
  return accounts.reduce((acc, account) => {
    const country = account.data['gen_info']['country'];
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function getAccountsByLocale(accounts: ServicesAccountResult[]): Record<string, number> {
  return accounts.reduce((acc, account) => {
    const locale = account.data['gen_info']['locale'];
    acc[locale] = (acc[locale] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function getTotalDiskSpaceUsed(accounts: ServicesAccountResult[]): number {
  return accounts.reduce((total, account) => total + account.data['stat']['disk_space'], 0);
}

export function getTotalTraffic(accounts: ServicesAccountResult[]): number {
  return accounts.reduce((total, account) => total + account.data['stat']['traffic'], 0);
}

export function getTotalActiveDomains(accounts: ServicesAccountResult[]): number {
  return accounts.reduce((total, account) => total + account.data['stat']['active_domains'], 0);
}

export function getTotalDatabases(accounts: ServicesAccountResult[]): number {
  return accounts.reduce((total, account) => total + account.data['stat']['data_bases'], 0);
}

export function getTotalPostboxes(accounts: ServicesAccountResult[]): number {
  return accounts.reduce((total, account) => total + account.data['stat']['postboxs'], 0);
}

export function getAverageDiskSpacePerAccount(accounts: ServicesAccountResult[]): number {
  if (accounts.length === 0) return 0;
  return getTotalDiskSpaceUsed(accounts) / accounts.length;
}

export function getAverageTrafficPerAccount(accounts: ServicesAccountResult[]): number {
  if (accounts.length === 0) return 0;
  return getTotalTraffic(accounts) / accounts.length;
}

export function getMostCommonCountry(accounts: ServicesAccountResult[]): string | null {
  const countryCounts = getAccountsByCountry(accounts);
  if (Object.keys(countryCounts).length === 0) {
    return null;
  }
  return Object.entries(countryCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}

export function getMostCommonLocale(accounts: ServicesAccountResult[]): string | null {
  const localeCounts = getAccountsByLocale(accounts);
  if (Object.keys(localeCounts).length === 0) {
    return null;
  }
  return Object.entries(localeCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}

export function getAccountWithMostDiskSpace(accounts: ServicesAccountResult[]): ServicesAccountResult | null {
  if (accounts.length === 0) return null;
  return accounts.reduce((max, account) => 
    account.data['stat']['disk_space'] > max.data['stat']['disk_space'] ? account : max
  );
}

export function getAccountWithMostTraffic(accounts: ServicesAccountResult[]): ServicesAccountResult | null {
  if (accounts.length === 0) return null;
  return accounts.reduce((max, account) => 
    account.data['stat']['traffic'] > max.data['stat']['traffic'] ? account : max
  );
}

export function getAccountWithMostDomains(accounts: ServicesAccountResult[]): ServicesAccountResult | null {
  if (accounts.length === 0) return null;
  return accounts.reduce((max, account) => 
    account.data['stat']['active_domains'] > max.data['stat']['active_domains'] ? account : max
  );
}

// Search functions
export function searchAccountsByLogin(accounts: ServicesAccountResult[], query: string): ServicesAccountResult[] {
  return accounts.filter(account => 
    account.data['gen_info']['login'].toLowerCase().includes(query.toLowerCase())
  );
}

export function searchAccountsByName(accounts: ServicesAccountResult[], query: string): ServicesAccountResult[] {
  return accounts.filter(account => 
    account.data['gen_info']['pname'].toLowerCase().includes(query.toLowerCase())
  );
}

export function searchAccountsByCompanyName(accounts: ServicesAccountResult[], query: string): ServicesAccountResult[] {
  return accounts.filter(account => 
    account.data['gen_info']['cname'].toLowerCase().includes(query.toLowerCase())
  );
}

export function searchAccountsByEmail(accounts: ServicesAccountResult[], query: string): ServicesAccountResult[] {
  return accounts.filter(account => 
    account.data['gen_info']['email'].toLowerCase().includes(query.toLowerCase())
  );
}

export function searchAccountsByGuid(accounts: ServicesAccountResult[], guid: string): ServicesAccountResult[] {
  return accounts.filter(account => 
    account.data['gen_info']['guid'].toLowerCase().includes(guid.toLowerCase())
  );
}

export function searchAccountsByExternalId(accounts: ServicesAccountResult[], externalId: string): ServicesAccountResult[] {
  return accounts.filter(account => 
    account.data['gen_info']['external-id'].toLowerCase().includes(externalId.toLowerCase())
  );
}

// Date utility functions
export function getAccountsCreatedAfter(accounts: ServicesAccountResult[], date: string): ServicesAccountResult[] {
  return accounts.filter(account => account.data['gen_info']['cr_date'] >= date);
}

export function getAccountsCreatedBefore(accounts: ServicesAccountResult[], date: string): ServicesAccountResult[] {
  return accounts.filter(account => account.data['gen_info']['cr_date'] <= date);
}

export function getAccountsCreatedBetween(accounts: ServicesAccountResult[], startDate: string, endDate: string): ServicesAccountResult[] {
  return accounts.filter(account => 
    account.data['gen_info']['cr_date'] >= startDate && 
    account.data['gen_info']['cr_date'] <= endDate
  );
}

// Format utility functions
export function formatDiskSpace(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function formatTraffic(bytes: number): string {
  return formatDiskSpace(bytes);
}

export function formatPhoneNumber(phone: string | number): string {
  const phoneStr = phone.toString();
  if (phoneStr.length === 0) return '';
  
  // Basic formatting for common patterns
  if (phoneStr.startsWith('+254')) {
    return `+254 ${phoneStr.slice(4, 7)} ${phoneStr.slice(7, 10)} ${phoneStr.slice(10)}`;
  }
  
  if (phoneStr.length === 9 && /^\d+$/.test(phoneStr)) {
    return `${phoneStr.slice(0, 3)} ${phoneStr.slice(3, 6)} ${phoneStr.slice(6)}`;
  }
  
  return phoneStr;
}

export function formatPostalCode(pcode: string | number): string {
  const pcodeStr = pcode.toString();
  if (pcodeStr.length === 0) return '';
  
  // Basic formatting for common patterns
  if (pcodeStr.length === 5 && /^\d+$/.test(pcodeStr)) {
    return `${pcodeStr.slice(0, 2)}-${pcodeStr.slice(2)}`;
  }
  
  return pcodeStr;
}

// Customer CRUD Request/Response Types
export interface CustomerCreateRequest {
  personName: string; // Required - customer's full name
  email: string; // Required - customer's email address
  companyName?: string; // Optional - company name
  login?: string; // Optional - customer login (auto-generated if not provided)
  password?: string; // Optional - customer password (auto-generated if not provided)
  passwordType?: 'crypt' | 'plain' | 'md5' | 'sha256' | 'bcrypt'; // Optional - password type (default: 'plain')
  
  // Contact information
  phone?: string | number; // Optional - phone number
  fax?: string; // Optional - fax number
  address?: string; // Optional - street address
  city?: string; // Optional - city
  state?: string; // Optional - state/province
  country?: string; // Optional - country code
  zip?: string | number; // Optional - postal code
  locale?: string; // Optional - locale (default: 'en-US')
  
  // Additional information
  description?: string; // Optional - customer description
  externalId?: string; // Optional - external system ID
}

export interface CustomerCreateResponse {
  customerId: number;
  filterId?: number;
  customerLogin: string;
  generatedPassword: string;
}

export interface CustomerCreateApiResponse {
  success: boolean;
  customerId: number;
  filterId?: number;
  customerLogin: string;
  generatedPassword: string;
  raw?: string;
  parsed?: unknown;
}