import { publicProcedure, router } from "../../trpc";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
import { LogEntry, LogItem, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";
const listSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    orderby: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    type: z.number().optional(),
    username: z.string().optional(),
});
export const jetbackupLogsRouter = router({
    list: publicProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("listLogs", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    get: publicProcedure
        .input(z.object({ _id: z.string() }))
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("getLog", { _id: input._id });
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    listItems: publicProcedure
        .input(z.object({
        log_id: z.string(),
        page: z.number().optional(),
        limit: z.number().optional(),
    }))
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("listLogItems", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    delete: publicProcedure
        .input(z.object({ _id: z.string() }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("deleteLog", { _id: input._id });
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
});
