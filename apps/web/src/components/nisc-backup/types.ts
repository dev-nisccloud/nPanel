export interface NiscBackupAccountRow {
  _id: string;
  username: string;
  nickname?: string;
  domain?: string;
  owner?: string;
  owner_nickname?: string;
  excluded?: number | boolean;
  active?: boolean;
  suspended?: boolean;
  created?: string;
  backup_stats?: Record<string, number>;
}

export interface NiscBackupSnapshotRow {
  _id: string;
  parent_id?: string;
  username?: string;
  date?: number | string;
  type?: number;
  backup_contains?: number;
  backup_structure?: number;
  size?: number;
  destination_id?: string;
  destination_name?: string;
  locked?: number | boolean;
  damaged?: boolean;
}

export interface NiscBackupBackupItemRow {
  _id: string;
  parent_id?: string;
  name?: string;
  path?: string;
  backup_contains?: number;
  backup_structure?: number;
  size?: number;
}

export interface NiscBackupRestoreConditionRow {
  _id: string;
  condition?: string;
  disabled?: number | boolean;
}

export interface NiscBackupAlertSendLog {
  integration?: string;
  message?: string;
  created?: string;
  status?: number;
}

export interface NiscBackupAlertRow {
  _id: string;
  title?: string;
  message?: string;
  level?: number;
  created?: string;
  owner?: string;
  owner_name?: string;
  send_logs?: NiscBackupAlertSendLog[];
}

export interface NiscBackupDashboardData {
  statistics?: {
    total_accounts?: number;
    total_backup_jobs?: number;
    total_clone_jobs?: number;
    total_backups?: number;
    total_new_alerts?: number;
    total_disk_usage?: number;
    total_backup_jobs_running?: number;
    total_clone_jobs_running?: number;
  };
  alerts?: {
    alerts?: NiscBackupAlertRow[];
    total?: number;
  };
  destinations?: {
    destinations?: NiscBackupDestinationRow[];
    total?: number;
  };
  queue_summary?: {
    pending?: number;
    processing?: number;
    completed?: number;
    failed?: number;
  };
}

export interface NiscBackupJobRow {
  _id: string;
  name?: string;
  enabled?: number | boolean;
  running?: number | boolean;
  destination_id?: string;
  type?: number;
}

export interface NiscBackupDestinationRow {
  _id: string;
  name?: string;
  type?: string;
  type_name?: string;
  disk_usage?:
    | number
    | string
    | {
        usage?: number | string;
        free?: number | string;
        total?: number | string;
      };
  usage?: number | string;
  free?: number | string;
  total?: number | string;
  disk_limit?: number;
  disabled?: number | boolean;
  running?: boolean;
}

export interface NiscBackupQueueGroupRow {
  _id: string;
  status?: number | string;
  type?: number;
  username?: string;
  progress?: number;
  created?: number;
}

export interface NiscBackupDownloadRow {
  _id: string;
  path?: string;
  account?: string;
  account_id?: string;
  size?: number;
  created?: string | number;
  backup_type?: number;
}

export interface NiscBackupLogRow {
  _id: string;
  username?: string;
  status?: number | string;
  type?: number;
  created?: number | string;
  start_time?: string;
  execution_time?: number;
  info?: { Type?: string; Destination?: string; Account?: string };
}
