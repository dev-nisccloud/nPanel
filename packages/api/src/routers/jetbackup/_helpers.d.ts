import { z } from "zod";
/** JetBackup 5.3 backup type: Accounts */
export declare const JETBACKUP_BACKUP_TYPE_ACCOUNTS = 1;
/** JetBackup 5.3 contains: full account (all components) */
export declare const JETBACKUP_CONTAINS_FULL_ACCOUNT = 511;
/** JetBackup queue group type: restore */
export declare const JETBACKUP_QUEUE_TYPE_RESTORE = 2;
/** JetBackup queue group type: download */
export declare const JETBACKUP_QUEUE_TYPE_DOWNLOAD = 4;
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
export declare function jetbackupCall<T = unknown>(functionName: string, params?: Record<string, unknown>): Promise<T>;
export declare function jetbackupCallSafe<T = unknown>(functionName: string, params?: Record<string, unknown>): Promise<import("../../lib/jetbackup/client").JetBackupResult<T>>;
export declare function extractList(data: unknown, keys: string[]): unknown[];
