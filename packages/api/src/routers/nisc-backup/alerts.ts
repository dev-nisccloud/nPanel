import { protectedProcedure, router } from "../../trpc";
import { Alert, NiscBackupListResponse } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, listSchema } from "./_helpers";

export const niscBackupAlertsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<Alert>>("listAlerts", input);
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<Alert>("getAlert", input);
    }),

  clear: protectedProcedure
    .input(z.object({ _id: z.string().optional() }))
    .mutation(async ({ input }) => {
      return niscBackupCall("clearAlerts", input);
    }),
});
