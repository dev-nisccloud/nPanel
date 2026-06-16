/**
 * JetBackup 5 - JETAPI TypeScript Definitions
 */
export interface JetBackupPagination {
    total: number;
    limit?: number;
    page?: number;
}
export interface JetBackupListResponse<T> {
    items: T[];
    total: number;
}
export declare enum BackupType {
    HomeDirectory = 1,
    Databases = 2,
    Emails = 4,
    SSLCertificates = 8,
    CronJobs = 16,
    DNSZones = 32,
    FTPAccounts = 64,
    FullAccount = 128,
    AllExceptFull = 127,
    Everything = 255
}
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
export interface JetBackupAccount {
    _id: string;
    username: string;
    package: string;
    domain: string;
    backup_job: string;
    tags: string[];
    excluded: number;
}
export interface Tag {
    _id: string;
    name: string;
    color: string;
}
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
export interface Schedule {
    _id: string;
    name: string;
    cron: string;
    enabled: number;
}
export interface BackupSnapshot {
    _id: string;
    username: string;
    date: number;
    type: number;
    size: number;
    destination_id: string;
    locked: number;
}
export interface BackupItem {
    _id: string;
    name: string;
    type: number;
    size: number;
}
export interface Download {
    _id: string;
    username: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    url: string;
    size: number;
    created: number;
    expires: number;
}
export interface QueueGroup {
    _id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
    type: number;
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
export interface Alert {
    _id: string;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    date: number;
    read: number;
}
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
export interface QueuePriority {
    _id: string;
    name: string;
    priority: number;
    type?: number;
}
export interface RestoreCondition {
    _id: string;
    name: string;
    rules?: Record<string, unknown>[];
}
export interface FilePermission {
    _id: string;
    name: string;
}
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
