import { protectedProcedure, router } from "../../trpc";
import { AccountFilter, AccountFilterGroup, NiscBackupListResponse } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, listSchema } from "./_helpers";

export const niscBackupAccountFiltersRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<AccountFilter>>("listAccountFilters", input);
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<AccountFilter>("getAccountFilter", input);
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
      return niscBackupCall("manageAccountFilter", input);
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteAccountFilter", input);
    }),

  listGroups: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<AccountFilterGroup>>("listAccountFilterGroups", input);
    }),

  getGroup: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<AccountFilterGroup>("getAccountFilterGroups", input);
    }),
});
