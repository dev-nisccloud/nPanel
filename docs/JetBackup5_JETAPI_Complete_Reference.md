# JetBackup 5 - JETAPI Complete Reference Guide (Plesk Edition)

> **Source:** Official JetBackup 5 Documentation - https://docs.jetbackup.com/v5.3/api/  
> **Version Covered:** JetBackup 5 v5.3 (STABLE)  
> **Minimum Plesk Version Required:** 18.0.39 and above  
> **Last Docs Update Referenced:** June 2025  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication - Plesk](#2-authentication--plesk)
3. [Base API URL - Plesk](#3-base-api-url--plesk)
4. [Request Format](#4-request-format)
5. [Universal Response Structure](#5-universal-response-structure)
6. [Common Parameters (List Calls)](#6-common-parameters-list-calls)
7. [Boolean Convention](#7-boolean-convention)
8. [Backup Type Bitmask Reference](#8-backup-type-bitmask-reference)
9. [API Sections & All Endpoints](#9-api-sections--all-endpoints)
   - [9.1 System](#91-system)
   - [9.2 Dashboard](#92-dashboard)
   - [9.3 Accounts](#93-accounts)
   - [9.4 Destinations](#94-destinations)
   - [9.5 Backup Jobs](#95-backup-jobs)
   - [9.6 Clone Jobs](#96-clone-jobs)
   - [9.7 Schedules](#97-schedules)
   - [9.8 Account Filters](#98-account-filters)
   - [9.9 Backups](#99-backups)
   - [9.10 Restore](#910-restore)
   - [9.11 Downloads](#911-downloads)
   - [9.12 Queues](#912-queues)
   - [9.13 Alerts](#913-alerts)
   - [9.14 Logs](#914-logs)
   - [9.15 Settings](#915-settings)
   - [9.16 Permissions](#916-permissions)
   - [9.17 Restore Conditions](#917-restore-conditions)
   - [9.18 File Permissions](#918-file-permissions)
   - [9.19 Plugins](#919-plugins)
10. [PHP Code Example (Plesk)](#10-php-code-example-plesk)
11. [Bash / cURL Example (Plesk)](#11-bash--curl-example-plesk)
12. [Workflow: List Backups → Restore for a Customer Account](#12-workflow-list-backups--restore-for-a-customer-account)
13. [Complete Endpoint Quick-Reference Table](#13-complete-endpoint-quick-reference-table)

---

## 1. Overview

JetBackup's JETAPI gives you **full programmatic access** to every feature available in the JetBackup 5 admin GUI - and more. You can use it to:

- Create and manage backup destinations (S3, FTP, SFTP, local, Google Drive, Dropbox, OneDrive)
- Create, edit, run, and delete backup jobs and clone jobs
- Manage schedules and account filters
- List and browse backup snapshots per account
- Queue restore and download operations
- Monitor the queue, logs, and alerts
- Manage system settings, security, snapshot retention, notifications
- Manage plugins and integrations

> **Important for Plesk shared hosting:** The JETAPI operates at the **admin level**. You authenticate as the Plesk admin (root), and then scope individual calls to a specific customer account using the `account` parameter. Your customers never authenticate directly against the JETAPI - your system acts on their behalf.

---

## 2. Authentication - Plesk

### How it works

JetBackup on Plesk uses the **same Plesk API secret key** you already use for Plesk XML-RPC calls. No separate JetBackup key is needed.

### Creating the API Key (if you haven't already)

**Method 1 - SSH terminal (recommended):**
```bash
plesk bin secret_key --create -ip-address ALL -description "JetBackup API Key"
```
This prints a key. Store it securely.

**Method 2 - Plesk REST API:**
```
POST https://{YOUR_PLESK_HOST}:8443/api/v2/auth/keys
Content-Type: application/json
Authorization: Basic base64(admin:password)

{
  "description": "JetBackup API Key",
  "ip_address": "ALL"
}
```

### Using the Key in JetBackup API Calls

Pass it as a `secret_key` header:
```
secret_key: YOUR_SECRET_KEY_HERE
```

Or as a `Authorization: Bearer` token format - the Plesk API adapter accepts both.

---

## 3. Base API URL - Plesk

All JetBackup API calls on a Plesk server go to this endpoint:

```
https://{YOUR_PLESK_HOST}:8443/modules/jetbackup5/api.php
```

Replace `{YOUR_PLESK_HOST}` with your server's hostname or IP address.

> Port **8443** is the standard Plesk HTTPS panel port. If your Plesk installation uses a different port, adjust accordingly.

**Example full URL:**
```
https://server.yourdomain.com:8443/modules/jetbackup5/api.php
```

---

## 4. Request Format

All API calls are **HTTP POST** requests with a **JSON body**.

### Required Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `secret_key` | `YOUR_PLESK_API_KEY` |

### Request Body Structure

```json
{
  "function": "FUNCTION_NAME",
  "param1": "value1",
  "param2": "value2"
}
```

The `function` key is **always required** and determines which API action to execute. All other parameters are function-specific.

### Character Encoding Note

Non-alphanumeric characters (except underscore `_`) in parameter values must be URL-encoded if passing via query string. When using JSON body, standard JSON encoding applies.

---

## 5. Universal Response Structure

**Every single API call returns this envelope:**

```json
{
  "success": 1,
  "message": "",
  "data": {},
  "system": {
    "version": "5.3.x",
    "tier": "STABLE",
    "type": "Plesk",
    "disableui": false,
    "dr": false,
    "agreement_panel": false,
    "agreement": false,
    "licenseIssue": false
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean (1/0) | `1` = call succeeded, `0` = failed |
| `message` | String | Error message if `success` is `0`, or informational message |
| `data` | Object/Array | The actual returned data - structure varies per function |
| `system.version` | String | Current JetBackup version installed |
| `system.tier` | String | `STABLE`, `EDGE`, or `ALPHA` |
| `system.type` | String | Panel type - will be `Plesk` on your server |
| `system.dr` | Boolean | Whether system is in Disaster Recovery mode |
| `system.licenseIssue` | Boolean | Whether there is a license problem |

---

## 6. Common Parameters (List Calls)

All functions that return a **list** of items accept these optional parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | Integer | Page number for paginated results (default: 1) |
| `limit` | Integer | Number of results per page |
| `search` | String | Filter results by a search term |
| `orderby` | String | Field name to sort by |
| `order` | String | Sort direction: `asc` or `desc` |

**CLI equivalent (for reference):**
```bash
jetbackup5api backup -F listBackups -D "type=127" -O json
```

---

## 7. Boolean Convention

> The term **"Boolean"** in JetBackup documentation means the values `1` (true) or `0` (false).  
> JetBackup **does NOT** accept the literal strings `true` or `false`.

Always use:
- `1` for true/enabled/yes
- `0` for false/disabled/no

---

## 8. Backup Type Bitmask Reference

Many backup-related API calls use a `type` parameter that is a **bitmask** (bitwise OR combination) of backup content types:

| Bit Value | Content Type |
|-----------|-------------|
| `1` | Home Directory |
| `2` | Databases |
| `4` | Emails |
| `8` | SSL Certificates |
| `16` | Cron Jobs |
| `32` | DNS Zones |
| `64` | FTP Accounts |
| `128` | Full Account |
| `127` | All types except Full Account (1+2+4+8+16+32+64) |
| `255` | All types including Full Account |

**Examples:**
- `type=1` → Home Directory only
- `type=3` → Home Directory + Databases (1+2)
- `type=127` → All individual component types
- `type=128` → Full account backup only
- `type=255` → Everything

---

## 9. API Sections & All Endpoints

---

### 9.1 System

> Functions for system-level operations, disaster recovery management, and EULA handling.

---

#### `getMasterEncryptionKey`
Returns the Master Encryption Key used for encrypted backups. Store this securely - it is required for disaster recovery.

**Parameters:** None

**Example Request:**
```json
{
  "function": "getMasterEncryptionKey"
}
```

**Response `data`:**
```json
{
  "key": "YOUR_MASTER_KEY_HERE"
}
```

---

#### `factoryReset`
Resets the entire JetBackup configuration back to factory defaults. **Destructive - use with extreme caution.**

**Parameters:** None

---

#### `exitDisasterRecovery`
Exits Disaster Recovery mode. Use this after a server rebuild when you want to resume normal JetBackup operations using an existing configuration.

**Parameters:** None

---

#### `approveAgreement`
Approves the JetBackup End User License Agreement (EULA). Required after fresh installation before other features are accessible.

**Parameters:** None

---

#### `approveShowcase`
Approves the JetBackup showcase/onboarding screen.

**Parameters:** None

---

#### `listShowcase`
Returns the list of showcase items / onboarding steps and their completion status.

**Parameters:** None

---

### 9.2 Dashboard

> Functions for retrieving summary statistics and system health information.

---

#### `getDashboardDetails`
Returns a comprehensive overview of the JetBackup dashboard - backup counts, queue status, recent activity, storage usage, and job summaries.

**Parameters:** None

**Response `data` includes:**
- Total number of accounts
- Number of backup jobs and clone jobs
- Queue status (running, pending, failed)
- Storage statistics per destination
- Recent job activity

---

#### `getInfo`
Returns version and system information about the JetBackup installation.

**Parameters:** None

**Response `data` includes:**
```json
{
  "version": "5.3.x",
  "tier": "STABLE",
  "panel": "Plesk",
  "os": "...",
  "license": {...}
}
```

---

#### `getStatistics`
Returns statistical data for charts and reporting - backup counts over time, storage usage trends, success/failure rates.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `range` | String | No | Time range for statistics (e.g., `7d`, `30d`, `90d`) |

---

#### `listShowcase` *(Dashboard version)*
Returns showcase/feature highlight items for the dashboard.

**Parameters:** None

---

### 9.3 Accounts

> Functions for managing hosting accounts tracked by JetBackup, including tags, on-demand backups, exclude lists, and snapshot deletion.

---

#### `listAccounts`
Returns a list of all hosting accounts known to JetBackup on this server.

**Parameters (all optional):** Standard list parameters (`page`, `limit`, `search`, `orderby`, `order`)

**Response `data`:**
```json
{
  "items": [
    {
      "_id": "account_mongo_id",
      "username": "customeruser",
      "package": "hosting_package_name",
      "domain": "customer.com",
      "backup_job": "job_id",
      "tags": [],
      "excluded": false
    }
  ],
  "total": 100
}
```

---

#### `getAccount`
Returns full settings and backup information for a specific account by its ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | The account's internal JetBackup ID |

---

#### `manageAccount`
Creates or modifies an account's JetBackup settings (e.g., assign to a backup job, enable/disable, set tags).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create` or `modify` |
| `_id` | String | Required for modify | Account ID |
| `username` | String | Required for create | Hosting account username |
| `backup_job` | String | No | Backup job ID to assign this account to |
| `excluded` | Boolean | No | `1` to exclude account from all backups |
| `tags` | Array | No | Array of tag strings to assign |

---

#### `manageTag`
Creates, modifies, or deletes a tag that can be applied to accounts.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create`, `modify`, or `delete` |
| `_id` | String | Required for modify/delete | Tag ID |
| `name` | String | Required for create | Tag name |
| `color` | String | No | Hex color code for the tag |

---

#### `listTags`
Returns all defined account tags.

**Parameters:** Standard list parameters

---

#### `reassignAccount`
Reassigns an account from one assignable entity (backup job group) to another.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | String | **Yes** | Account username |
| `assignable_id` | String | **Yes** | The ID to assign to (from `listAssignableAccounts`) |

---

#### `reassignAccountMulti`
Reassigns multiple accounts at once to a new assignable entity.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `usernames` | Array | **Yes** | Array of account usernames |
| `assignable_id` | String | **Yes** | The assignable ID to move them to |

---

#### `listAssignableAccounts`
Returns the list of assignable IDs (backup job groups/packages) for a given username. Used before calling `reassignAccount`.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | String | **Yes** | Account username to check assignable options for |

---

#### `createBackupOnDemand`
Triggers an immediate on-demand backup for a specific account. This does not wait for a scheduled job.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | String | **Yes** | Account username to back up |
| `type` | Integer | **Yes** | Bitmask of what to back up (see Section 8) |
| `destination_id` | String | No | Destination ID to send backup to; uses default if omitted |
| `notify` | Boolean | No | `1` to send notification on completion |

---

#### `manageAccountExecludeList`
*(Note: "Execlude" is the spelling used in the official API)*  
Adds or removes items from an account's backup exclusion list (files/directories to skip).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `add` or `remove` |
| `username` | String | **Yes** | Account username |
| `paths` | Array | **Yes** | Array of file paths to exclude/include |

---

#### `getAccountExcludeList`
Returns the current exclusion list (paths that will be skipped during backup) for a specific account.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | String | **Yes** | Account username |

---

#### `listAccountPackages`
Returns a list of all hosting packages/plans that have accounts assigned to them. Useful for grouping or filtering accounts.

**Parameters:** Standard list parameters

---

#### `deleteAccountSnapshots`
Permanently deletes all backup snapshots for a specific account from a specific destination. **Irreversible.**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | String | **Yes** | Account username |
| `destination_id` | String | **Yes** | Destination ID to delete snapshots from |
| `type` | Integer | No | Bitmask of backup types to delete; all if omitted |

---

### 9.4 Destinations

> Functions for managing where backups are stored - create, list, validate, delete, and reindex destinations.

---

#### `listDestinations`
Returns all configured backup destinations.

**Parameters:** Standard list parameters

**Response `data.items` fields per destination:**

| Field | Description |
|-------|-------------|
| `_id` | Destination's unique ID |
| `name` | Human-readable name |
| `type` | Destination type (e.g., `S3`, `Local`, `FTP`, `SFTP`, `SSH`, `GoogleDrive`, `Dropbox`, `OneDrive`) |
| `disk_limit` | Storage limit in bytes (`0` = unlimited) |
| `disk_usage` | Current usage in bytes |
| `threads` | Number of concurrent upload threads |
| `readonly` | Boolean - if `1`, no new backups can be sent here |
| `disabled` | Boolean - if `1`, destination is inactive |
| `dr` | Boolean - whether this destination is used for Disaster Recovery |
| `options` | Object - connection-specific settings (path, credentials, etc.) |

---

#### `getDestination`
Returns full details for a specific destination by its ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Destination ID |

---

#### `manageDestination`
Creates or modifies a backup destination.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create` or `modify` |
| `_id` | String | Required for modify | Destination ID |
| `name` | String | Required for create | Friendly name |
| `type` | String | Required for create | One of: `Local`, `SSH`, `S3`, `FTP`, `SFTP`, `GoogleDrive`, `Dropbox`, `OneDrive` |
| `threads` | Integer | No | Concurrent upload threads (default: 10) |
| `disk_limit` | Integer | No | Storage cap in bytes (`0` for unlimited) |
| `options` | Object | **Yes** for create | Connection options (see per-type examples below) |
| `dr` | Boolean | No | `1` to mark as Disaster Recovery destination |
| `readonly` | Boolean | No | `1` to mark as read-only |

**`options` structure by destination type:**

**Local:**
```json
{
  "options[path]": "/backup/path"
}
```

**SSH/SFTP:**
```json
{
  "options[host]": "remote.host.com",
  "options[port]": "22",
  "options[user]": "sshuser",
  "options[key]": "SSH_PRIVATE_KEY",
  "options[path]": "/remote/backup/path"
}
```

**S3-Compatible (AWS, Wasabi, Backblaze B2, etc.):**
```json
{
  "options[path]": "/path",
  "options[access_key]": "YOUR_ACCESS_KEY",
  "options[secret_key]": "YOUR_SECRET_KEY",
  "options[bucket]": "your-bucket-name",
  "options[endpoint]": "s3.us-east-1.amazonaws.com",
  "options[region]": "us-east-1"
}
```

**FTP:**
```json
{
  "options[host]": "ftp.example.com",
  "options[port]": "21",
  "options[user]": "ftpuser",
  "options[password]": "ftppassword",
  "options[path]": "/backup"
}
```

**Full example call body:**
```json
{
  "function": "manageDestination",
  "action": "create",
  "type": "S3",
  "name": "AWS-S3-Backup",
  "threads": 20,
  "options[path]": "/backups",
  "options[access_key]": "AKIAIOSFODNN7EXAMPLE",
  "options[secret_key]": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "options[bucket]": "my-hosting-backups",
  "options[endpoint]": "s3.eu-west-1.amazonaws.com",
  "options[region]": "eu-west-1"
}
```

---

#### `listDestinationsTypes`
Returns a list of all supported destination types available for use on this server.

**Parameters:** None

---

#### `validateDestination`
Checks the connectivity and credentials for an existing destination.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Destination ID to validate |

---

#### `deleteDestination`
Permanently deletes a destination configuration. **Does not delete the actual backup files stored there.**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Destination ID |

---

#### `reindexDestination`
Forces JetBackup to re-scan and resync all backup data from a destination into the JetBackup database. Use if the backup index is out of sync.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Destination ID |

---

#### `runIntegrityCheck`
Runs an integrity check on a destination to verify backup files are intact and uncorrupted.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Destination ID |

---

### 9.5 Backup Jobs

> Functions for creating, managing, running, and deleting backup jobs (scheduled backup configurations).

---

#### `listBackupJob`
Returns all configured backup jobs.

**Parameters:** Standard list parameters

**Response `data.items` fields:**

| Field | Description |
|-------|-------------|
| `_id` | Job's unique ID |
| `name` | Job name |
| `destination_id` | Target destination ID |
| `type` | Bitmask of what types are backed up |
| `enabled` | Boolean - whether job is active |
| `schedule_id` | Associated schedule ID |
| `account_filter_id` | Associated account filter ID |
| `retain` | Number of snapshots to retain |
| `ttl` | Snapshot time-to-live in days |
| `running` | Boolean - whether job is currently executing |

---

#### `getBackupJob`
Returns full details for a specific backup job.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Backup job ID |

---

#### `manageBackupJob`
Creates or modifies a backup job.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create` or `modify` |
| `_id` | String | Required for modify | Job ID |
| `name` | String | Required for create | Job name |
| `destination_id` | String | **Yes** | Target destination ID |
| `type` | Integer | **Yes** | Backup type bitmask |
| `enabled` | Boolean | No | `1` to enable (default: `1`) |
| `schedule_id` | String | No | Schedule ID to run on |
| `account_filter_id` | String | No | Account filter ID to scope which accounts are backed up |
| `retain` | Integer | No | Number of snapshots to keep |
| `ttl` | Integer | No | Days to keep snapshots |
| `notify` | Boolean | No | `1` to send notifications on completion |
| `compress` | Boolean | No | `1` to compress backup archives |
| `encrypt` | Boolean | No | `1` to encrypt backups |

---

#### `duplicateBackupJob`
Creates an exact copy of an existing backup job.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Source backup job ID to duplicate |

---

#### `runBackupJobManually`
Triggers an immediate manual run of a backup job, bypassing the schedule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Backup job ID to run |

---

#### `deleteBackupJob`
Permanently deletes a backup job configuration. **Does not delete existing backups created by the job.**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Backup job ID |

---

### 9.6 Clone Jobs

> Functions for managing clone jobs - jobs that copy/clone account data to another server or location.

---

#### `listCloneJobs`
Returns all configured clone jobs.

**Parameters:** Standard list parameters

---

#### `getCloneJob`
Returns details of a specific clone job.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Clone job ID |

---

#### `manageCloneJob`
Creates or modifies a clone job.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create` or `modify` |
| `_id` | String | Required for modify | Clone job ID |
| `name` | String | Required for create | Job name |
| `destination_id` | String | **Yes** | Target destination ID |
| `type` | Integer | **Yes** | Type bitmask |
| `enabled` | Boolean | No | `1` to enable |
| `schedule_id` | String | No | Schedule ID |
| `account_filter_id` | String | No | Account filter ID |

---

#### `duplicateCloneJob`
Duplicates an existing clone job.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Source clone job ID |

---

#### `runCloneJobManually`
Triggers an immediate manual run of a clone job.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Clone job ID |

---

#### `deleteCloneJob`
Deletes a clone job configuration.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Clone job ID |

---

### 9.7 Schedules

> Schedules define *when* backup jobs and clone jobs run (cron-style timing configuration).

---

#### `listSchedules`
Returns all defined schedules.

**Parameters:** Standard list parameters

**Response `data.items` fields:**

| Field | Description |
|-------|-------------|
| `_id` | Schedule ID |
| `name` | Schedule name |
| `cron` | Cron expression (e.g., `0 2 * * *` for 2am daily) |
| `enabled` | Boolean |

---

#### `getSchedule`
Returns details of a specific schedule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Schedule ID |

---

#### `manageSchedule`
Creates or modifies a schedule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create` or `modify` |
| `_id` | String | Required for modify | Schedule ID |
| `name` | String | Required for create | Schedule name |
| `cron` | String | **Yes** | Cron expression defining when to run |
| `enabled` | Boolean | No | `1` to enable |

---

#### `deleteSchedule`
Deletes a schedule. Jobs using this schedule will no longer run on a schedule until reassigned.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Schedule ID |

---

### 9.8 Account Filters

> Account filters define *which* accounts a backup job or clone job applies to.

---

#### `listAccountFilters`
Returns all defined account filters.

**Parameters:** Standard list parameters

---

#### `getAccountFilter`
Returns details of a specific account filter.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Filter ID |

---

#### `manageAccountFilter`
Creates or modifies an account filter.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create` or `modify` |
| `_id` | String | Required for modify | Filter ID |
| `name` | String | Required for create | Filter name |
| `group_id` | String | No | Group this filter belongs to |
| `rules` | Array | No | Filter rules (conditions on account properties) |

---

#### `deleteAccountFilter`
Deletes an account filter.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Filter ID |

---

#### `listAccountFilterGroups`
Returns all account filter groups (groups of filters).

**Parameters:** Standard list parameters

---

#### `getAccountFilterGroups`
Returns details of a specific account filter group.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Filter group ID |

---

### 9.9 Backups

> Functions for browsing, searching, and inspecting backup snapshots stored in destinations.

---

#### `listBackups`
Returns all backup snapshots across all destinations.

**Parameters (all optional):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | Integer | Filter by backup type bitmask |
| `destination_id` | String | Filter by destination |
| Standard list params | - | `page`, `limit`, `search`, `orderby`, `order` |

---

#### `listBackupForAccounts`
Returns all available backups for accounts. This is the primary call for showing a customer's backup history.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | Integer | **Yes** | Bitmask of backup types to retrieve |
| `contains` | Integer | No | Bitmask filter for types that must be included in snapshot |
| `username` | String | No | Filter to a single account username |
| `destination_id` | String | No | Filter by destination |

**Example - list all backups for a specific customer:**
```json
{
  "function": "listBackupForAccounts",
  "type": 127,
  "username": "customerusername"
}
```

**Response `data.items` includes:**

| Field | Description |
|-------|-------------|
| `_id` | Backup snapshot ID (use as `parent_id` in restore/download calls) |
| `username` | Account username |
| `date` | Backup date (Unix timestamp) |
| `type` | Bitmask of what was backed up |
| `size` | Size in bytes |
| `destination_id` | Where it is stored |
| `locked` | Boolean - if locked, cannot be auto-deleted |

---

#### `listBackupForType`
Returns backups filtered by a specific type value.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | Integer | **Yes** | Exact backup type bitmask to match |

---

#### `listBackupForTypeName`
Returns backups filtered by type name (string-based lookup).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type_name` | String | **Yes** | Type name string (e.g., `home`, `database`, `email`) |
| `username` | String | No | Filter to a specific account |

---

#### `listAccountsByFilters`
Returns accounts that match given filter criteria, along with their backup snapshot data.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filter` | Object | **Yes** | Filter criteria object |

---

#### `getBackupItems`
Returns all sub-items within a backup snapshot - e.g., list of individual databases, email accounts, or files inside a specific backup.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parent_id` | String | **Yes** | The backup snapshot `_id` |
| `type` | Integer | **Yes** | Type bitmask for which items to list |

---

#### `getBackupItem`
Returns details of a single specific item within a backup snapshot.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Item's ID within the snapshot |
| `parent_id` | String | **Yes** | The parent snapshot's `_id` |

---

#### `manageBackupLock`
Locks or unlocks a backup snapshot to prevent automatic deletion by retention policies.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Backup snapshot ID |
| `lock` | Boolean | **Yes** | `1` to lock, `0` to unlock |

---

### 9.10 Restore

> The Restore section in JETAPI is handled via **`addQueueItems`** in the Queues section (see Section 9.12), by passing `type: 2` (restore) when queuing items. There is no separate standalone restore function - restoration is a queue operation.

> The workflow is: `listBackupForAccounts` → get `parent_id` → `getBackupItems` → get item `_id`s → `addQueueItems` with `type: 2`.

---

### 9.11 Downloads

> Functions for queuing backup items for download (generating a downloadable archive a customer can retrieve).

---

#### `addQueueItems` *(Downloads version)*
Queues backup items to be packaged as a downloadable file. See also the Queues version of this function.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | Array | **Yes** | Array of backup item objects to queue for download |
| `items[].parent_id` | String | **Yes** | The backup snapshot `_id` |
| `items[].type` | Integer | **Yes** | `3` for download |

---

#### `listDownloads`
Returns a list of all generated download packages.

**Parameters:** Standard list parameters

**Response `data.items` fields:**

| Field | Description |
|-------|-------------|
| `_id` | Download ID |
| `username` | Account the download belongs to |
| `status` | `pending`, `processing`, `completed`, `failed` |
| `url` | Download URL (populated when status is `completed`) |
| `size` | File size in bytes |
| `created` | Creation timestamp |
| `expires` | Expiry timestamp |

---

#### `getDownload`
Returns details of a specific download by its ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Download ID |

---

#### `manageDownloadNotes`
Adds or updates notes/comments on a download entry.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Download ID |
| `notes` | String | **Yes** | Note text to save |

---

### 9.12 Queues

> The Queue is the central execution engine. Restores, downloads, and other operations are all queued here. These functions let you add, monitor, control, and prioritize queue operations.

---

#### `addQueueItems`
The most important queue function - queues backup items for either **restore** or **download**.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | Array | **Yes** | Array of queue item objects |
| `items[].parent_id` | String | **Yes** | Backup snapshot `_id` from `listBackupForAccounts` |
| `items[].type` | Integer | **Yes** | `1` = Backup, `2` = Restore, `3` = Download |
| `items[].item_id` | String | No | Specific sub-item ID (from `getBackupItems`) - if omitted, entire snapshot is processed |
| `items[].username` | String | No | Target account (for restore to different account) |

**Example - queue a full account restore:**
```json
{
  "function": "addQueueItems",
  "items": [
    {
      "parent_id": "SNAPSHOT_ID_FROM_listBackupForAccounts",
      "type": 2
    }
  ]
}
```

**Example - queue a specific database restore:**
```json
{
  "function": "addQueueItems",
  "items": [
    {
      "parent_id": "SNAPSHOT_ID",
      "item_id": "DATABASE_ITEM_ID",
      "type": 2
    }
  ]
}
```

---

#### `addMultiAccountQueueItems`
Queues operations for multiple accounts in a single API call.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | Array | **Yes** | Array of queue items, each with `parent_id`, `type`, and `username` |

---

#### `listQueueGroups`
Returns all queue groups (each queue run is a group containing multiple items).

**Parameters:** Standard list parameters

**Response `data.items` fields:**

| Field | Description |
|-------|-------------|
| `_id` | Queue group ID |
| `status` | `pending`, `running`, `completed`, `failed`, `stopped` |
| `type` | Operation type (`1`=backup, `2`=restore, `3`=download) |
| `username` | Account being processed |
| `created` | When queued |
| `started` | When execution began |
| `completed` | When finished |
| `progress` | Percentage complete |

---

#### `getQueueGroup`
Returns details of a specific queue group.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Queue group ID |

---

#### `listQueueItems`
Returns all individual items within queue groups.

**Parameters:** Standard list parameters

---

#### `getQueueItem`
Returns details of a specific queue item.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Queue item ID |

---

#### `stopQueueGroup`
Stops a currently running queue group.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Queue group ID to stop |

---

#### `stopAllQueueGroup`
Stops all currently running queue groups immediately.

**Parameters:** None

---

#### `clearQueue`
Removes all pending (not yet started) items from the queue.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | Integer | No | If provided, only clears queue items of this type |

---

#### `rerunFailedQueueGroup`
Re-queues a failed queue group to try again.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Failed queue group ID |

---

#### `manageQueuePriority`
Creates or modifies a queue priority rule - controls the order in which queue items are processed.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create` or `modify` |
| `_id` | String | Required for modify | Priority rule ID |
| `name` | String | Required for create | Priority rule name |
| `priority` | Integer | **Yes** | Priority level (lower = higher priority) |
| `type` | Integer | No | Queue type this applies to |

---

#### `listQueuePriorities`
Returns all defined queue priority rules.

**Parameters:** Standard list parameters

---

#### `getQueuePriority`
Returns a specific queue priority rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Priority rule ID |

---

#### `deleteQueuePriority`
Deletes a queue priority rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Priority rule ID |

---

### 9.13 Alerts

> Alerts are system-generated notifications about backup failures, storage issues, license problems, etc.

---

#### `listAlerts`
Returns all current alerts.

**Parameters:** Standard list parameters

**Response `data.items` fields:**

| Field | Description |
|-------|-------------|
| `_id` | Alert ID |
| `type` | Alert category |
| `message` | Human-readable alert message |
| `severity` | `info`, `warning`, `critical` |
| `date` | Alert timestamp |
| `read` | Boolean - whether alert has been acknowledged |

---

#### `getAlert`
Returns a specific alert by ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Alert ID |

---

#### `clearAlerts`
Dismisses/clears all alerts, or a specific alert.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | No | If provided, clears only this alert; if omitted, clears all alerts |

---

### 9.14 Logs

> JetBackup keeps detailed logs of every backup, restore, download, and system event.

---

#### `listLogs`
Returns a list of all log entries.

**Parameters:** Standard list parameters + optional filters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | Integer | Filter by log type bitmask |
| `username` | String | Filter logs for a specific account |

---

#### `getLog`
Returns a specific log entry summary.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Log ID |

---

#### `listLogItems`
Returns all detailed line items within a specific log (the verbose output of a backup or restore operation).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `log_id` | String | **Yes** | Parent log ID |
| Standard list params | - | `page`, `limit` |

---

#### `getLogItem`
Returns a single detailed log line item.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Log item ID |

---

#### `deleteLog`
Deletes a log entry and all its associated items.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Log ID to delete |

---

### 9.15 Settings

> The Settings section covers all system configuration objects: general, restore, security, privacy, panel, snapshots, binary/paths, and notifications.

---

#### `getSettingsRestore`
Returns the current restore settings configuration object.

**Response `data` includes:** Default restore overwrite behaviour, whether to restore to original path, etc.

---

#### `manageSettingsRestore`
Updates the restore settings configuration.

**Parameters:** Restore settings fields to modify (restore overwrite policy, default restore path, etc.)

---

#### `getSettingsSecurity`
Returns the security settings object - IP whitelist/blacklist, 2FA requirements, session timeouts.

---

#### `manageSettingsSecurity`
Updates security settings.

---

#### `getSettingsPrivacy`
Returns privacy settings - data anonymisation, log retention policies.

---

#### `manageSettingsPrivacy`
Updates privacy settings.

---

#### `getSettingsPanel`
Returns panel-specific settings for the JetBackup interface.

---

#### `manageSettingsPanel`
Updates panel settings.

---

#### `getSettingsSnapshots`
Returns the snapshot retention settings - how many to keep, TTL (time-to-live), size and inode limits.

**Response `data` example:**
```json
{
  "backup": {
    "retain": 1,
    "ttl": 2,
    "rule_size": 5,
    "rule_inodes": 50000
  }
}
```

---

#### `manageSettingsSnapshots`
Updates snapshot retention settings.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `backup[retain]` | Integer | Number of snapshots to keep |
| `backup[ttl]` | Integer | Days to keep a snapshot |
| `backup[rule_size]` | Integer | Max disk usage (GB) before old snapshots are purged |
| `backup[rule_inodes]` | Integer | Max inode count before old snapshots are purged |

---

#### `getSettingsBinary`
Returns the binary/path settings - paths to compression tools, workspace directory, download directory.

---

#### `manageSettingsBinary`
Updates binary/path settings.

---

#### `getSettingsResource`
Returns resource allocation settings - CPU and memory limits for backup processes.

---

#### `manageSettingsResource`
Updates resource allocation settings.

---

#### `listNotificationIntegrationTypes`
Returns a list of all available notification integration types (Slack, email, PagerDuty, etc.).

---

#### `listEnabledNotificationIntegrations`
Returns a list of all currently configured/enabled notification integrations.

---

#### `getEnabledNotificationIntegration`
Returns the configuration of a specific notification integration by its type.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | String | **Yes** | Notification type identifier |

---

#### `deleteEnabledNotificationIntegration`
Removes a configured notification integration.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | String | **Yes** | Notification type identifier to remove |

---

### 9.16 Permissions

> Returns the permission set for the currently authenticated user. Useful for confirming what your API key is allowed to do.

---

#### `listPermissions`
Returns all permission settings for the currently authenticated user/key.

**Parameters:** None

**Response `data` includes:** A full map of all JetBackup features and whether the current user has read/write/execute access to each.

---

### 9.17 Restore Conditions

> Restore conditions are rules that gate when a restore can proceed (e.g., "only restore if disk space is sufficient").

---

#### `listRestoreConditions` *(via `RestoreConditions`)*
Returns all defined restore condition objects.

**Parameters:** Standard list parameters

---

#### `getRestoreCondition`
Returns a specific restore condition by ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Restore condition ID |

---

#### `manageRestoreCondition`
Creates or modifies a restore condition object.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create` or `modify` |
| `_id` | String | Required for modify | Condition ID |
| `name` | String | Required for create | Condition name |
| `rules` | Array | **Yes** | Array of condition rules |

---

#### `deleteRestoreCondition`
Deletes a restore condition.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Restore condition ID |

---

### 9.18 File Permissions

> File permission objects control the ownership and permission settings applied when files are restored.

---

#### `listFilePermissions`
Returns all file permission objects.

**Parameters:** Standard list parameters

---

#### `getFilePermission`
Returns a specific file permission object by ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | File permission object ID |

---

#### `deleteFilePermission`
Deletes a file permission object.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | File permission object ID |

---

### 9.19 Plugins

> Manage JetBackup's plugin system - install, configure, and remove plugins that extend functionality (notification channels, Imunify360 security integration, JetBackupMC management console, etc.).

---

#### `listPlugins`
Returns a list of all currently installed plugins.

**Parameters:** Standard list parameters

---

#### `listPluginPackages`
Returns available plugin packages from configured repositories (not yet installed).

**Parameters:** Standard list parameters

---

#### `listRepositories`
Returns all configured plugin repositories.

**Parameters:** None

---

#### `manageRepositories`
Adds or modifies a plugin repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | String | **Yes** | `create` or `modify` |
| `url` | String | **Yes** | Repository URL |

---

#### `deleteRepository`
Removes a plugin repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Repository ID |

---

#### `getPlugin`
Returns details of a specific installed plugin.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Plugin ID |

---

#### `managePlugin`
Enables or disables a plugin, or modifies its settings.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Plugin ID |
| `enabled` | Boolean | No | `1` to enable, `0` to disable |

---

#### `installPlugin`
Installs a plugin by package ID or from a zip file.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `package_id` | String | One of these required | Package ID from `listPluginPackages` |
| `zip_path` | String | One of these required | Path to a local zip file to install from |

---

#### `uninstallPlugin`
Uninstalls a plugin.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Plugin ID |

---

#### `updatePlugin`
Manually triggers an update for an installed plugin.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_id` | String | **Yes** | Plugin ID |

---

#### `listPluginFiles`
Returns a list of downloaded/available plugin zip files that can be installed locally.

**Parameters:** None

---

#### `manageSecurityPlugin`
Enables or disables the Imunify360 security plugin integration. If called with no data, the plugin is **disabled**.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled` | Boolean | No | `1` to enable Imunify360 integration; omit or `0` to disable |

---

## 10. PHP Code Example (Plesk)

Complete PHP function for making JetBackup API calls on a Plesk server:

```php
<?php

/**
 * Call the JetBackup 5 API on a Plesk server
 *
 * @param string $host       Your Plesk hostname (e.g. server.yourdomain.com)
 * @param string $secretKey  Your Plesk API secret key
 * @param string $function   The JetBackup API function name
 * @param array  $params     Additional parameters to pass
 * @return array             Decoded JSON response
 */
function jetbackupApiCall(string $host, string $secretKey, string $function, array $params = []): array
{
    $url = "https://{$host}:8443/modules/jetbackup5/api.php";

    $body = array_merge(['function' => $function], $params);

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_SSL_VERIFYPEER => false,  // Set to true in production with valid cert
        CURLOPT_SSL_VERIFYHOST => false,  // Set to 2 in production
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            "secret_key: {$secretKey}",
        ],
    ]);

    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($curlError) {
        throw new RuntimeException("cURL error: {$curlError}");
    }

    if ($httpCode !== 200) {
        throw new RuntimeException("HTTP error {$httpCode}");
    }

    $decoded = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException("JSON decode error: " . json_last_error_msg());
    }

    return $decoded;
}

// --- Usage Examples ---

$host      = 'server.yourdomain.com';
$secretKey = 'YOUR_PLESK_SECRET_KEY';

// 1. List all accounts
$accounts = jetbackupApiCall($host, $secretKey, 'listAccounts');
print_r($accounts['data']['items']);

// 2. List all backups for a specific customer
$backups = jetbackupApiCall($host, $secretKey, 'listBackupForAccounts', [
    'type'     => 127,
    'username' => 'customerusername',
]);
print_r($backups['data']['items']);

// 3. Trigger on-demand backup for a customer
$onDemand = jetbackupApiCall($host, $secretKey, 'createBackupOnDemand', [
    'username' => 'customerusername',
    'type'     => 127,
]);
echo $onDemand['message'];

// 4. Queue a restore for a specific backup snapshot
$restore = jetbackupApiCall($host, $secretKey, 'addQueueItems', [
    'items' => [
        [
            'parent_id' => 'SNAPSHOT_ID_FROM_listBackupForAccounts',
            'type'      => 2,  // 2 = restore
        ]
    ]
]);
print_r($restore['data']);

// 5. Check queue status
$queue = jetbackupApiCall($host, $secretKey, 'listQueueGroups');
foreach ($queue['data']['items'] as $group) {
    echo "{$group['username']} - Status: {$group['status']}\n";
}
```

---

## 11. Bash / cURL Example (Plesk)

```bash
#!/bin/bash

HOST="server.yourdomain.com"
SECRET_KEY="YOUR_PLESK_SECRET_KEY"
API_URL="https://${HOST}:8443/modules/jetbackup5/api.php"

# Helper function
jb_api() {
    local FUNCTION="$1"
    local DATA="${2:-{}}"
    curl -sk \
        -X POST \
        -H "Content-Type: application/json" \
        -H "secret_key: ${SECRET_KEY}" \
        -d "${DATA}" \
        "${API_URL}"
}

# List all backup jobs
echo "=== Backup Jobs ==="
jb_api '{"function":"listBackupJob"}' | python3 -m json.tool

# List backups for a specific account
echo "=== Backups for customerusername ==="
jb_api '{"function":"listBackupForAccounts","type":127,"username":"customerusername"}' | python3 -m json.tool

# Trigger an on-demand backup
echo "=== Trigger On-Demand Backup ==="
jb_api '{"function":"createBackupOnDemand","username":"customerusername","type":127}' | python3 -m json.tool

# List destinations
echo "=== Destinations ==="
jb_api '{"function":"listDestinations"}' | python3 -m json.tool

# Queue a restore (replace SNAPSHOT_ID with actual ID)
echo "=== Queue Restore ==="
jb_api '{"function":"addQueueItems","items":[{"parent_id":"SNAPSHOT_ID","type":2}]}' | python3 -m json.tool
```

---

## 12. Workflow: List Backups → Restore for a Customer Account

This is the complete step-by-step workflow for showing a customer their backups and letting them restore one:

### Step 1 - Get the customer's backup snapshots

```json
POST https://server.yourdomain.com:8443/modules/jetbackup5/api.php
{
  "function": "listBackupForAccounts",
  "type": 127,
  "username": "customerusername"
}
```

From the response, collect the `_id` of the snapshot the customer wants to restore. This is the `parent_id` for all subsequent calls.

---

### Step 2 (Optional) - Browse items within a snapshot

If the customer wants to restore only a specific database or specific files rather than the full snapshot:

```json
POST https://server.yourdomain.com:8443/modules/jetbackup5/api.php
{
  "function": "getBackupItems",
  "parent_id": "SNAPSHOT_ID_FROM_STEP_1",
  "type": 2
}
```

(Use type bitmask `2` for databases, `1` for home directory, etc.)

From the response, collect the `_id` of the specific item to restore.

---

### Step 3 - Queue the restore

**Full snapshot restore:**
```json
POST https://server.yourdomain.com:8443/modules/jetbackup5/api.php
{
  "function": "addQueueItems",
  "items": [
    {
      "parent_id": "SNAPSHOT_ID_FROM_STEP_1",
      "type": 2
    }
  ]
}
```

**Specific item restore (e.g., one database):**
```json
POST https://server.yourdomain.com:8443/modules/jetbackup5/api.php
{
  "function": "addQueueItems",
  "items": [
    {
      "parent_id": "SNAPSHOT_ID",
      "item_id": "DATABASE_ITEM_ID_FROM_STEP_2",
      "type": 2
    }
  ]
}
```

---

### Step 4 - Monitor progress

```json
POST https://server.yourdomain.com:8443/modules/jetbackup5/api.php
{
  "function": "listQueueGroups"
}
```

Poll this endpoint until `status` returns `completed` or `failed`. On failure, use `rerunFailedQueueGroup` with the group `_id`.

---

## 13. Complete Endpoint Quick-Reference Table

| Section | Function | Description |
|---------|----------|-------------|
| **System** | `getMasterEncryptionKey` | Get master encryption key |
| | `factoryReset` | Reset entire JetBackup config |
| | `exitDisasterRecovery` | Exit disaster recovery mode |
| | `approveAgreement` | Accept EULA |
| | `approveShowcase` | Approve onboarding screen |
| | `listShowcase` | List onboarding steps |
| **Dashboard** | `getDashboardDetails` | Full dashboard overview |
| | `getInfo` | System version/info |
| | `getStatistics` | Usage statistics |
| | `listShowcase` | Dashboard showcase items |
| **Accounts** | `listAccounts` | List all hosting accounts |
| | `getAccount` | Get single account details |
| | `manageAccount` | Create/modify account settings |
| | `manageTag` | Create/modify/delete tags |
| | `listTags` | List all tags |
| | `reassignAccount` | Reassign single account |
| | `reassignAccountMulti` | Reassign multiple accounts |
| | `listAssignableAccounts` | Get assignable IDs for account |
| | `createBackupOnDemand` | Trigger immediate backup |
| | `manageAccountExecludeList` | Add/remove exclusion paths |
| | `getAccountExcludeList` | View exclusion paths |
| | `listAccountPackages` | List hosting packages |
| | `deleteAccountSnapshots` | Delete all snapshots for account |
| **Destinations** | `listDestinations` | List all destinations |
| | `getDestination` | Get destination by ID |
| | `manageDestination` | Create/modify destination |
| | `listDestinationsTypes` | List supported destination types |
| | `validateDestination` | Test destination connectivity |
| | `deleteDestination` | Delete destination |
| | `reindexDestination` | Resync destination index |
| | `runIntegrityCheck` | Run integrity check on destination |
| **Backup Jobs** | `listBackupJob` | List all backup jobs |
| | `getBackupJob` | Get backup job by ID |
| | `manageBackupJob` | Create/modify backup job |
| | `duplicateBackupJob` | Clone a backup job |
| | `runBackupJobManually` | Run backup job immediately |
| | `deleteBackupJob` | Delete backup job |
| **Clone Jobs** | `listCloneJobs` | List all clone jobs |
| | `getCloneJob` | Get clone job by ID |
| | `manageCloneJob` | Create/modify clone job |
| | `duplicateCloneJob` | Clone a clone job |
| | `runCloneJobManually` | Run clone job immediately |
| | `deleteCloneJob` | Delete clone job |
| **Schedules** | `listSchedules` | List all schedules |
| | `getSchedule` | Get schedule by ID |
| | `manageSchedule` | Create/modify schedule |
| | `deleteSchedule` | Delete schedule |
| **Account Filters** | `listAccountFilters` | List all account filters |
| | `getAccountFilter` | Get filter by ID |
| | `manageAccountFilter` | Create/modify filter |
| | `deleteAccountFilter` | Delete filter |
| | `listAccountFilterGroups` | List filter groups |
| | `getAccountFilterGroups` | Get filter group by ID |
| **Backups** | `listBackups` | List all backup snapshots |
| | `listBackupForAccounts` | List backups per account |
| | `listBackupForType` | List backups by type |
| | `listBackupForTypeName` | List backups by type name |
| | `listAccountsByFilters` | Accounts matching filter with backups |
| | `getBackupItems` | List items in a snapshot |
| | `getBackupItem` | Get single item in snapshot |
| | `manageBackupLock` | Lock/unlock snapshot |
| **Downloads** | `addQueueItems` | Queue items for download |
| | `listDownloads` | List all downloads |
| | `getDownload` | Get download by ID |
| | `manageDownloadNotes` | Add notes to download |
| **Queues** | `addQueueItems` | Queue restore/backup/download items |
| | `addMultiAccountQueueItems` | Queue for multiple accounts |
| | `listQueueGroups` | List all queue groups |
| | `getQueueGroup` | Get queue group by ID |
| | `listQueueItems` | List queue items |
| | `getQueueItem` | Get queue item by ID |
| | `stopQueueGroup` | Stop a running queue group |
| | `stopAllQueueGroup` | Stop all running queue groups |
| | `clearQueue` | Clear pending queue items |
| | `rerunFailedQueueGroup` | Retry a failed queue group |
| | `manageQueuePriority` | Create/modify priority rule |
| | `listQueuePriorities` | List all priority rules |
| | `getQueuePriority` | Get priority rule by ID |
| | `deleteQueuePriority` | Delete priority rule |
| **Alerts** | `listAlerts` | List all alerts |
| | `getAlert` | Get alert by ID |
| | `clearAlerts` | Clear all or one alert |
| **Logs** | `listLogs` | List all log entries |
| | `getLog` | Get log by ID |
| | `listLogItems` | List detailed items in a log |
| | `getLogItem` | Get single log line item |
| | `deleteLog` | Delete a log entry |
| **Settings** | `getSettingsRestore` | Get restore settings |
| | `manageSettingsRestore` | Update restore settings |
| | `getSettingsSecurity` | Get security settings |
| | `manageSettingsSecurity` | Update security settings |
| | `getSettingsPrivacy` | Get privacy settings |
| | `manageSettingsPrivacy` | Update privacy settings |
| | `getSettingsPanel` | Get panel settings |
| | `manageSettingsPanel` | Update panel settings |
| | `getSettingsSnapshots` | Get snapshot retention settings |
| | `manageSettingsSnapshots` | Update snapshot retention settings |
| | `getSettingsBinary` | Get binary/path settings |
| | `manageSettingsBinary` | Update binary/path settings |
| | `getSettingsResource` | Get resource allocation settings |
| | `manageSettingsResource` | Update resource allocation settings |
| | `listNotificationIntegrationTypes` | List available notification types |
| | `listEnabledNotificationIntegrations` | List enabled notifications |
| | `getEnabledNotificationIntegration` | Get specific notification config |
| | `deleteEnabledNotificationIntegration` | Remove notification integration |
| **Permissions** | `listPermissions` | List current user permissions |
| **Restore Conditions** | `listRestoreConditions` | List all restore conditions |
| | `getRestoreCondition` | Get condition by ID |
| | `manageRestoreCondition` | Create/modify restore condition |
| | `deleteRestoreCondition` | Delete restore condition |
| **File Permissions** | `listFilePermissions` | List all file permission objects |
| | `getFilePermission` | Get file permission by ID |
| | `deleteFilePermission` | Delete file permission object |
| **Plugins** | `listPlugins` | List installed plugins |
| | `listPluginPackages` | List available plugin packages |
| | `listRepositories` | List plugin repositories |
| | `manageRepositories` | Add/modify repository |
| | `deleteRepository` | Remove repository |
| | `getPlugin` | Get plugin details |
| | `managePlugin` | Enable/disable plugin |
| | `installPlugin` | Install a plugin |
| | `uninstallPlugin` | Uninstall a plugin |
| | `updatePlugin` | Update an installed plugin |
| | `listPluginFiles` | List local plugin zip files |
| | `manageSecurityPlugin` | Enable/disable Imunify360 |

---

*Official documentation: https://docs.jetbackup.com/v5.3/api/*  
*JetBackup forum: https://forum.jetbackup.com/*  
*JetBackup support: https://billing.jetbackup.com*
