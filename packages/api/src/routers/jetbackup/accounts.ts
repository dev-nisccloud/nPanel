import { protectedProcedure, router } from "../../trpc";
import { JetBackupAccount, JetBackupListResponse, Tag } from "../../types/jetbackup";
import { z } from "zod";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";

export const jetbackupAccountsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<JetBackupAccount>>("listAccounts", input);
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupAccount>("getAccount", input);
    }),

  manage: protectedProcedure
    .input(z.object({
      action: z.enum(["create", "modify"]),
      _id: z.string().optional(),
      username: z.string().optional(),
      backup_job: z.string().optional(),
      excluded: z.number().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("manageAccount", input);
    }),

  listTags: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<Tag>>("listTags", input);
    }),

  manageTag: protectedProcedure
    .input(z.object({
      action: z.enum(["create", "modify", "delete"]),
      _id: z.string().optional(),
      name: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("manageTag", input);
    }),

  listAssignable: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      return jetbackupCall("listAssignableAccounts", input);
    }),

  reassign: protectedProcedure
    .input(z.object({
      username: z.string(),
      assignable_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("reassignAccount", input);
    }),

  reassignMulti: protectedProcedure
    .input(z.object({
      usernames: z.array(z.string()),
      assignable_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("reassignAccountMulti", input);
    }),

  createOnDemand: protectedProcedure
    .input(z.object({
      account_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("createBackupOnDemand", input);
    }),

  manageExcludeList: protectedProcedure
    .input(z.object({
      action: z.enum(["add", "remove"]),
      username: z.string(),
      paths: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("manageAccountExecludeList", input);
    }),

  getExcludeList: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      return jetbackupCall("getAccountExcludeList", input);
    }),

  listPackages: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return jetbackupCall("listAccountPackages", input);
    }),

  deleteSnapshots: protectedProcedure
    .input(z.object({
      username: z.string(),
      destination_id: z.string(),
      type: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("deleteAccountSnapshots", input);
    }),
});
