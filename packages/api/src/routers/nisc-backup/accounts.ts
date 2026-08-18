import { protectedProcedure, router } from "../../trpc";
import { NiscBackupAccount, NiscBackupListResponse, Tag } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, jetBackupNewestFirst, niscBackupCall, listSchema } from "./_helpers";

export const niscBackupAccountsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<NiscBackupAccount>>(
        "listAccounts",
        jetBackupNewestFirst(input, "created"),
      );
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupAccount>("getAccount", input);
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
      return niscBackupCall("manageAccount", input);
    }),

  listTags: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<Tag>>("listTags", input);
    }),

  manageTag: protectedProcedure
    .input(z.object({
      action: z.enum(["create", "modify", "delete"]),
      _id: z.string().optional(),
      name: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("manageTag", input);
    }),

  listAssignable: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      return niscBackupCall("listAssignableAccounts", input);
    }),

  reassign: protectedProcedure
    .input(z.object({
      username: z.string(),
      assignable_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("reassignAccount", input);
    }),

  reassignMulti: protectedProcedure
    .input(z.object({
      usernames: z.array(z.string()),
      assignable_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("reassignAccountMulti", input);
    }),

  createOnDemand: protectedProcedure
    .input(z.object({
      account_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("createBackupOnDemand", input);
    }),

  manageExcludeList: protectedProcedure
    .input(z.object({
      action: z.enum(["add", "remove"]),
      username: z.string(),
      paths: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("manageAccountExecludeList", input);
    }),

  getExcludeList: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      return niscBackupCall("getAccountExcludeList", input);
    }),

  listPackages: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall("listAccountPackages", input);
    }),

  deleteSnapshots: protectedProcedure
    .input(z.object({
      username: z.string(),
      destination_id: z.string(),
      type: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteAccountSnapshots", input);
    }),
});
