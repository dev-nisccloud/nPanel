import { protectedProcedure, router } from "../../trpc";
import { AccountFilter, AccountFilterGroup, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";

export const jetbackupAccountFiltersRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<AccountFilter>>("listAccountFilters", input);
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return jetbackupCall<AccountFilter>("getAccountFilter", input);
    }),

  manage: protectedProcedure
    .input(z.object({
      action: z.enum(["create", "modify"]),
      _id: z.string().optional(),
      name: z.string().optional(),
      group_id: z.string().optional(),
      rules: z.array(z.record(z.string(), z.unknown())).optional(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("manageAccountFilter", input);
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("deleteAccountFilter", input);
    }),

  listGroups: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<AccountFilterGroup>>("listAccountFilterGroups", input);
    }),

  getGroup: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return jetbackupCall<AccountFilterGroup>("getAccountFilterGroups", input);
    }),
});
