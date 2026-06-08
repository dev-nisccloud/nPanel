import { publicProcedure, router } from "../../trpc";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
import { BackupSnapshot, BackupItem, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";
const listSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    orderby: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    type: z.number().optional(),
    destination_id: z.string().optional(),
});
export const jetbackupBackupsRouter = router({
    list: publicProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("listBackups", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    listForAccount: publicProcedure
        .input(z.object({
        username: z.string().optional(),
        type: z.number(),
        contains: z.number().optional(),
        destination_id: z.string().optional(),
    }))
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("listBackupForAccounts", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    getItems: publicProcedure
        .input(z.object({
        parent_id: z.string(),
        type: z.number(),
    }))
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("getBackupItems", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    addQueueItems: publicProcedure
        .input(z.object({
        items: z.array(z.object({
            parent_id: z.string(),
            type: z.number(), // 1=Backup, 2=Restore, 3=Download
            item_id: z.string().optional(),
            username: z.string().optional(),
        })),
    }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("addQueueItems", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    manageLock: publicProcedure
        .input(z.object({
        _id: z.string(),
        lock: z.number(), // 1 to lock, 0 to unlock
    }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("manageBackupLock", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
});
