import { protectedProcedure, router } from "../../trpc";
import { RestoreCondition } from "../../types/nisc-backup";
import { z } from "zod";
import { extractList, idSchema, niscBackupCall, listSchema } from "./_helpers";

export const niscBackupRestoreConditionsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      const data = await niscBackupCall("listRestoreConditions", input);
      const conditions = extractList(data, ["conditions", "items"]) as RestoreCondition[];
      return { conditions, total: conditions.length };
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<RestoreCondition>("getRestoreCondition", input);
    }),

  manage: protectedProcedure
    .input(z.object({
      action: z.enum(["create", "modify"]),
      _id: z.string().optional(),
      condition: z.string().optional(),
      disabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("manageRestoreCondition", input);
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteRestoreCondition", input);
    }),
});
