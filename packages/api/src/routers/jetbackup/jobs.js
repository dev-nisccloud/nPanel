import { publicProcedure, router } from "../../trpc";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
import { BackupJob, CloneJob, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";
const listSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    orderby: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
});
export const jetbackupJobsRouter = router({
    // Backup Jobs
    listBackup: publicProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("listBackupJob", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    getBackup: publicProcedure
        .input(z.object({ _id: z.string() }))
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("getBackupJob", { _id: input._id });
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    manageBackup: publicProcedure
        .input(z.object({
        action: z.enum(["create", "modify"]),
        _id: z.string().optional(),
        name: z.string().optional(),
        destination_id: z.string().optional(),
        type: z.number().optional(),
        enabled: z.number().optional(),
        schedule_id: z.string().optional(),
        account_filter_id: z.string().optional(),
        retain: z.number().optional(),
        ttl: z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("manageBackupJob", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    runBackupManually: publicProcedure
        .input(z.object({ _id: z.string() }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("runBackupJobManually", { _id: input._id });
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    // Clone Jobs
    listClone: publicProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("listCloneJobs", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    getClone: publicProcedure
        .input(z.object({ _id: z.string() }))
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("getCloneJob", { _id: input._id });
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    manageClone: publicProcedure
        .input(z.object({
        action: z.enum(["create", "modify"]),
        _id: z.string().optional(),
        name: z.string().optional(),
        destination_id: z.string().optional(),
        type: z.number().optional(),
        enabled: z.number().optional(),
        schedule_id: z.string().optional(),
        account_filter_id: z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("manageCloneJob", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    runCloneManually: publicProcedure
        .input(z.object({ _id: z.string() }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("runCloneJobManually", { _id: input._id });
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
});
