/**
 * Nisc Backup - JETAPI TypeScript Definitions
 */

export interface NiscBackupPagination {
  total: number;
  limit?: number;
  page?: number;
}

export interface NiscBackupListResponse<T> {
  items: T[];
  total: number;
}

/** JetBackup 5 Backup Contains flags (binary). Full account = 511. */
export enum BackupContains {
  PanelConfig = 1,
  Homedir = 2,
  Databases = 4,
  Emails = 8,
  CronJobs = 16,
  DnsZones = 32,
  SslCertificates = 64,
  DatabaseUsers = 128,
  FtpAccounts = 256,
  FullAccount = 511,
}

/** JetBackup 5 backup structure. */
export enum BackupStructure {
  Incremental = 1,
  Archived = 2,
  Compressed = 4,
}

// 9.2 Dashboard
export interface DashboardDetails {
  total_accounts: number;
  total_backup_jobs: number;
  total_clone_jobs: number;
  queue: {
    running: number;
    pending: number;
    failed: number;
  };
  destinations: Array<{
    _id: string;
    name: string;
    disk_usage: number;
    disk_limit: number;
  }>;
  recent_activity: any[];
}

export interface SystemInfo {
  version: string;
  tier: string;
  panel: string;
  os: string;
  license: any;
}

// 9.3 Accounts
export interface NiscBackupAccount {
  _id: string;
  username: string;
  package: string;
  domain: string;
  backup_job: string;
  tags: string[];
  excluded: number; // 1 or 0
}

export interface Tag {
  _id: string;
  name: string;
  color: string;
}

// 9.4 Destinations
export interface Destination {
  _id: string;
  name: string;
  type: string;
  disk_limit: number;
  disk_usage: number;
  threads: number;
  readonly: number;
  disabled: number;
  dr: number;
  options: Record<string, any>;
}

// 9.5 Backup Jobs
export interface BackupJob {
  _id: string;
  name: string;
  destination_id: string;
  type: number;
  enabled: number;
  schedule_id: string;
  account_filter_id: string;
  retain: number;
  ttl: number;
  running: number;
}

// 9.6 Clone Jobs
export interface CloneJob {
  _id: string;
  name: string;
  destination_id: string;
  type: number;
  enabled: number;
  schedule_id: string;
  account_filter_id: string;
  running: number;
}

// 9.7 Schedules
export interface Schedule {
  _id: string;
  name: string;
  cron: string;
  enabled: number;
}

// 9.9 Backups (Snapshots)
export interface BackupSnapshot {
  _id: string;
  parent_id?: string;
  username: string;
  date: number; // Unix timestamp
  created?: string;
  backup_type?: number;
  backup_contains?: number;
  backup_structure?: number;
  type: number;
  size: number;
  destination_id: string;
  destination_name?: string;
  locked: number;
}

export interface BackupItem {
  _id: string;
  parent_id?: string;
  name: string;
  path?: string;
  backup_contains?: number;
  backup_structure?: number;
  type: number;
  size: number;
}

// 9.11 Downloads
export interface Download {
  _id: string;
  username: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url: string;
  size: number;
  created: number;
  expires: number;
}

// 9.12 Queues
export interface QueueGroup {
  _id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  type: number; // 1=backup, 2=restore, 3=download
  username: string;
  created: number;
  started?: number;
  completed?: number;
  progress: number;
}

export interface QueueItem {
  _id: string;
  parent_id: string;
  status: string;
  message: string;
}

// 9.13 Alerts
export interface Alert {
  _id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  date: number;
  read: number;
}

// 9.14 Logs
export interface LogEntry {
  _id: string;
  type: number;
  username: string;
  status: string;
  created: number;
}

export interface LogItem {
  _id: string;
  message: string;
  date: number;
}

// 9.8 Account Filters
export interface AccountFilter {
  _id: string;
  name: string;
  group_id?: string;
  rules?: Record<string, unknown>[];
}

export interface AccountFilterGroup {
  _id: string;
  name: string;
}

// 9.12 Queue Priorities
export interface QueuePriority {
  _id: string;
  name: string;
  priority: number;
  type?: number;
}

// 9.17 Restore Conditions
export interface RestoreCondition {
  _id: string;
  condition: string;
  disabled?: number | boolean;
}

// 9.18 File Permissions
export interface FilePermission {
  _id: string;
  name: string;
}

// 9.19 Plugins
export interface Plugin {
  _id: string;
  name: string;
  version?: string;
  enabled?: number;
}

export interface PluginPackage {
  _id: string;
  name: string;
  code?: string;
  version?: string;
}
