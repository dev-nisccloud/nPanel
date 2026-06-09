import { protectedProcedure, router } from "../../trpc";
import { BackupJob, CloneJob, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";

export const jetbackupJobsRouter = router({
  listBackup: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<BackupJob>>("listBackupJobs", input);
    }),

  getBackup: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return jetbackupCall<BackupJob>("getBackupJob", input);
    }),

  manageBackup: protectedProcedure
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
      notify: z.number().optional(),
      compress: z.number().optional(),
      encrypt: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("manageBackupJob", input);
    }),

  duplicateBackup: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("duplicateBackupJob", input);
    }),

  runBackupManually: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("runBackupJobManually", input);
    }),

  deleteBackup: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("deleteBackupJob", input);
    }),

  listClone: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<CloneJob>>("listCloneJobs", input);
    }),

  getClone: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return jetbackupCall<CloneJob>("getCloneJob", input);
    }),

  manageClone: protectedProcedure
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
      return jetbackupCall("manageCloneJob", input);
    }),

  duplicateClone: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("duplicateCloneJob", input);
    }),

  runCloneManually: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("runCloneJobManually", input);
    }),

  deleteClone: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("deleteCloneJob", input);
    }),
});
