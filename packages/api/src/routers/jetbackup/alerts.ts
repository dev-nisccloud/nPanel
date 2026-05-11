import { publicProcedure, router } from "../../trpc";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
import { Alert, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";

const listSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  orderby: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const jetbackupAlertsRouter = router({
  list: publicProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      const result = await sendJetBackupRequest<JetBackupListResponse<Alert>>("listAlerts", input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  get: publicProcedure
    .input(z.object({ _id: z.string() }))
    .query(async ({ input }) => {
      const result = await sendJetBackupRequest<Alert>("getAlert", { _id: input._id });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  clear: publicProcedure
    .input(z.object({ _id: z.string().optional() }))
    .mutation(async ({ input }) => {
      const result = await sendJetBackupRequest<any>("clearAlerts", input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),
});
