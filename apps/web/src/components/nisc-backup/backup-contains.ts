/** JetBackup 5 Backup Contains flags. Full account = 511. */
export const NISC_BACKUP_CONTAINS = {
  PanelConfig: 1,
  Homedir: 2,
  Databases: 4,
  Emails: 8,
  CronJobs: 16,
  DnsZones: 32,
  SslCertificates: 64,
  DatabaseUsers: 128,
  FtpAccounts: 256,
  FullAccount: 511,
} as const;

export const NISC_BACKUP_CONTAINS_ORDER = [
  NISC_BACKUP_CONTAINS.PanelConfig,
  NISC_BACKUP_CONTAINS.Homedir,
  NISC_BACKUP_CONTAINS.Databases,
  NISC_BACKUP_CONTAINS.DatabaseUsers,
  NISC_BACKUP_CONTAINS.Emails,
  NISC_BACKUP_CONTAINS.FtpAccounts,
  NISC_BACKUP_CONTAINS.CronJobs,
  NISC_BACKUP_CONTAINS.DnsZones,
  NISC_BACKUP_CONTAINS.SslCertificates,
] as const;

export function isRestoreConditionEnabled(disabled: number | boolean | undefined): boolean {
  return disabled !== 1 && disabled !== true;
}
