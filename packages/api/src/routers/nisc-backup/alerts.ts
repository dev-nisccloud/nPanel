import { protectedProcedure, router } from "../../trpc";
import { Alert, NiscBackupListResponse } from "../../types/nisc-backup";
import { z } from "zod";
import {
  extractList,
  idSchema,
  jetBackupNewestFirst,
  niscBackupCall,
  listSchema,
  sortByDateDesc,
} from "./_helpers";

export const niscBackupAlertsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      const data = await niscBackupCall<NiscBackupListResponse<Alert>>(
        "listAlerts",
        jetBackupNewestFirst(input, "created"),
      );
      const alerts = sortByDateDesc(
        extractList(data, ["alerts", "items"]) as Alert[],
        (alert) => (alert as Record<string, unknown>).created
          ?? (alert as Record<string, unknown>).date,
      );
      return { alerts, total: alerts.length };
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
