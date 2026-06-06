/**
 * JetBackup 5 - JETAPI TypeScript Definitions
 */
// Section 8: Backup Type Bitmask
export var BackupType;
(function (BackupType) {
    BackupType[BackupType["HomeDirectory"] = 1] = "HomeDirectory";
    BackupType[BackupType["Databases"] = 2] = "Databases";
    BackupType[BackupType["Emails"] = 4] = "Emails";
    BackupType[BackupType["SSLCertificates"] = 8] = "SSLCertificates";
    BackupType[BackupType["CronJobs"] = 16] = "CronJobs";
    BackupType[BackupType["DNSZones"] = 32] = "DNSZones";
    BackupType[BackupType["FTPAccounts"] = 64] = "FTPAccounts";
    BackupType[BackupType["FullAccount"] = 128] = "FullAccount";
    BackupType[BackupType["AllExceptFull"] = 127] = "AllExceptFull";
    BackupType[BackupType["Everything"] = 255] = "Everything";
})(BackupType || (BackupType = {}));
