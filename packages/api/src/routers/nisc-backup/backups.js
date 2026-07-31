import { protectedProcedure, router } from "../../trpc";
import { BackupItem, BackupSnapshot, NiscBackupListResponse } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, NISC_BACKUP_BACKUP_TYPE_ACCOUNTS, NISC_BACKUP_CONTAINS_FULL_ACCOUNT, listSchema, queueItemSchema, } from "./_helpers";
const backupListSchema = listSchema.extend({
    type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
    contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
    account_id: z.string().optional(),
    destination_id: z.string().optional(),
});
export const niscBackupBackupsRouter = router({
    list: protectedProcedure
        .input(backupListSchema)
        .query(async ({ input }) => {
        return niscBackupCall("listBackups", input);
    }),
    listForAccount: protectedProcedure
        .input(listSchema.extend({
        account_id: z.string(),
        type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
        contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
        destination_id: z.string().optional(),
    }))
        .query(async ({ input }) => {
        return niscBackupCall("listBackups", input);
    }),
    listLatestForAccounts: protectedProcedure
        .input(z.object({
        account_id: z.string().optional(),
        username: z.string().optional(),
        type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
        contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
        destination_id: z.string().optional(),
    }))
        .query(async ({ input }) => {
        return niscBackupCall("listBackupForAccounts", input);
    }),
    listForType: protectedProcedure
        .input(z.object({
        type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
        contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
    }))
        .query(async ({ input }) => {
        return niscBackupCall("listBackupForType", input);
    }),
    listForTypeName: protectedProcedure
        .input(listSchema.extend({
        account_id: z.string(),
        name: z.string(),
        type: z.number().default(NISC_BACKUP_BACKUP_TYPE_ACCOUNTS),
        contains: z.number().default(NISC_BACKUP_CONTAINS_FULL_ACCOUNT),
    }))
        .query(async ({ input }) => {
        return niscBackupCall("listBackupForTypeName", input);
    }),
    listAccountsByFilters: protectedProcedure
        .input(z.object({
        filter: z.record(z.string(), z.unknown()),
    }))
        .query(async ({ input }) => {
        return niscBackupCall("listAccountsByFilters", input);
    }),
    getItems: protectedProcedure
        .input(z.object({
        parent_id: z.string(),
        type: z.number(),
    }))
        .query(async ({ input }) => {
        return niscBackupCall("getBackupItems", input);
    }),
    getItem: protectedProcedure
        .input(z.object({
        _id: z.string(),
        parent_id: z.string(),
    }))
        .query(async ({ input }) => {
        return niscBackupCall("getBackupItem", input);
    }),
    addQueueItems: protectedProcedure
        .input(z.object({
        items: z.array(queueItemSchema),
    }))
        .mutation(async ({ input }) => {
        return niscBackupCall("addQueueItems", input);
    }),
    manageLock: protectedProcedure
        .input(z.object({
        _id: z.string(),
        lock: z.number(),
    }))
        .mutation(async ({ input }) => {
        return niscBackupCall("manageBackupLock", input);
    }),
});
