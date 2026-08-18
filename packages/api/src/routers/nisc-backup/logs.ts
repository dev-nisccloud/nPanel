import { protectedProcedure, router } from "../../trpc";
import { NiscBackupListResponse, LogEntry, LogItem } from "../../types/nisc-backup";
import { z } from "zod";
import {
  extractList,
  idSchema,
  jetBackupNewestFirst,
  niscBackupCall,
  listSchema,
  sortByDateDesc,
} from "./_helpers";

const logListSchema = listSchema.extend({
  type: z.number().optional(),
  username: z.string().optional(),
});

export const niscBackupLogsRouter = router({
  list: protectedProcedure
    .input(logListSchema)
    .query(async ({ input }) => {
      const { username, type, ...rest } = input;
      const params = jetBackupNewestFirst(rest, "start_time");
      const find: Record<string, unknown> = {};
      if (type != null) find.type = type;
      if (username) find["info.Account"] = username;
      if (Object.keys(find).length > 0) params.find = find;

      const data = await niscBackupCall<NiscBackupListResponse<LogEntry>>("listLogs", params);
      const logs = sortByDateDesc(
        extractList(data, ["logs", "items"]) as LogEntry[],
        (log) => (log as Record<string, unknown>).start_time
          ?? (log as Record<string, unknown>).created,
      );
      return { logs, total: logs.length };
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<LogEntry>("getLog", input);
    }),

  listItems: protectedProcedure
    .input(z.object({
      log_id: z.string(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<LogItem>>("listLogItems", input);
    }),

  getItem: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<LogItem>("getLogItem", input);
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteLog", input);
    }),
});
