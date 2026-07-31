import { protectedProcedure, router } from "../../trpc";
import { BackupJob, CloneJob, NiscBackupListResponse } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, listSchema } from "./_helpers";

export const niscBackupJobsRouter = router({
  listBackup: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<BackupJob>>("listBackupJobs", input);
    }),

  getBackup: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<BackupJob>("getBackupJob", input);
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
      return niscBackupCall("manageBackupJob", input);
    }),

  duplicateBackup: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("duplicateBackupJob", input);
    }),

  runBackupManually: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("runBackupJobManually", input);
    }),

  deleteBackup: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteBackupJob", input);
    }),

  listClone: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<CloneJob>>("listCloneJobs", input);
    }),

  getClone: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<CloneJob>("getCloneJob", input);
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
      return niscBackupCall("manageCloneJob", input);
    }),

  duplicateClone: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("duplicateCloneJob", input);
    }),

  runCloneManually: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("runCloneJobManually", input);
    }),

  deleteClone: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteCloneJob", input);
    }),
});
