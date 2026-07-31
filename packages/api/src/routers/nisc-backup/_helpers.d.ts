import { z } from "zod";
/** Nisc Backup backup type: Accounts */
export declare const NISC_BACKUP_BACKUP_TYPE_ACCOUNTS = 1;
/** Nisc Backup contains: full account (all components) */
export declare const NISC_BACKUP_CONTAINS_FULL_ACCOUNT = 511;
/** NiscBackup queue group type: restore */
export declare const NISC_BACKUP_QUEUE_TYPE_RESTORE = 2;
/** NiscBackup queue group type: download */
export declare const NISC_BACKUP_QUEUE_TYPE_DOWNLOAD = 4;
export declare const listSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    orderby: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export declare const idSchema: z.ZodObject<{
    _id: z.ZodString;
}, z.core.$strip>;
export declare const queueItemSchema: z.ZodObject<{
    parent_id: z.ZodString;
    type: z.ZodNumber;
    item_id: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function niscBackupCall<T = unknown>(functionName: string, params?: Record<string, unknown>): Promise<T>;
export declare function niscBackupCallSafe<T = unknown>(functionName: string, params?: Record<string, unknown>): Promise<import("../../lib/nisc-backup/client").NiscBackupResult<T>>;
export declare function extractList(data: unknown, keys: string[]): unknown[];
