import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sendNiscBackupRequest } from "../../lib/nisc-backup/client";
/** Nisc Backup backup type: Accounts */
export const NISC_BACKUP_BACKUP_TYPE_ACCOUNTS = 1;
/** Nisc Backup contains: full account (all components) */
export const NISC_BACKUP_CONTAINS_FULL_ACCOUNT = 511;
/** NiscBackup queue group type: restore */
export const NISC_BACKUP_QUEUE_TYPE_RESTORE = 2;
/** NiscBackup queue group type: download */
export const NISC_BACKUP_QUEUE_TYPE_DOWNLOAD = 4;
export const listSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    orderby: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
});
export const idSchema = z.object({ _id: z.string() });
export const queueItemSchema = z.object({
    parent_id: z.string(),
    type: z.number(),
    item_id: z.string().optional(),
    username: z.string().optional(),
});
export async function niscBackupCall(functionName, params = {}) {
    const result = await sendNiscBackupRequest(functionName, params);
    if (!result.success) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.message || `NiscBackup ${functionName} failed`,
        });
    }
    return result.data;
}
export async function niscBackupCallSafe(functionName, params = {}) {
    return sendNiscBackupRequest(functionName, params);
}
export function extractList(data, keys) {
    if (!data || typeof data !== "object")
        return [];
    const record = data;
    for (const key of keys) {
        const list = record[key];
        if (Array.isArray(list))
            return list;
    }
    return [];
}
