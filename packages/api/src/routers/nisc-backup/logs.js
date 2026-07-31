import { protectedProcedure, router } from "../../trpc";
import { NiscBackupListResponse, LogEntry, LogItem } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, listSchema } from "./_helpers";
const logListSchema = listSchema.extend({
    type: z.number().optional(),
    username: z.string().optional(),
});
export const niscBackupLogsRouter = router({
    list: protectedProcedure
        .input(logListSchema)
        .query(async ({ input }) => {
        return niscBackupCall("listLogs", input);
    }),
    get: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return niscBackupCall("getLog", input);
    }),
    listItems: protectedProcedure
        .input(z.object({
        log_id: z.string(),
        page: z.number().optional(),
        limit: z.number().optional(),
    }))
        .query(async ({ input }) => {
        return niscBackupCall("listLogItems", input);
    }),
    getItem: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return niscBackupCall("getLogItem", input);
    }),
    delete: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return niscBackupCall("deleteLog", input);
    }),
});
