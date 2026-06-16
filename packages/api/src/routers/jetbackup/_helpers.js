import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
/** JetBackup 5.3 backup type: Accounts */
export const JETBACKUP_BACKUP_TYPE_ACCOUNTS = 1;
/** JetBackup 5.3 contains: full account (all components) */
export const JETBACKUP_CONTAINS_FULL_ACCOUNT = 511;
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
export async function jetbackupCall(functionName, params = {}) {
    const result = await sendJetBackupRequest(functionName, params);
    if (!result.success) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.message || `JetBackup ${functionName} failed`,
        });
    }
    return result.data;
}
export async function jetbackupCallSafe(functionName, params = {}) {
    return sendJetBackupRequest(functionName, params);
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
