import { protectedProcedure, router } from "../../trpc";
import { JetBackupListResponse, LogEntry, LogItem } from "../../types/jetbackup";
import { z } from "zod";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";

const logListSchema = listSchema.extend({
  type: z.number().optional(),
  username: z.string().optional(),
});

export const jetbackupLogsRouter = router({
  list: protectedProcedure
    .input(logListSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<LogEntry>>("listLogs", input);
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return jetbackupCall<LogEntry>("getLog", input);
    }),

  listItems: protectedProcedure
    .input(z.object({
      log_id: z.string(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<LogItem>>("listLogItems", input);
    }),

  getItem: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return jetbackupCall<LogItem>("getLogItem", input);
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("deleteLog", input);
    }),
});
