import { publicProcedure, router } from "../../trpc";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
import { JetBackupAccount, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";
const listSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    orderby: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
});
export const jetbackupAccountsRouter = router({
    list: publicProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("listAccounts", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    get: publicProcedure
        .input(z.object({ _id: z.string() }))
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("getAccount", { _id: input._id });
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    manage: publicProcedure
        .input(z.object({
        action: z.enum(["create", "modify"]),
        _id: z.string().optional(),
        username: z.string().optional(),
        backup_job: z.string().optional(),
        excluded: z.number().optional(),
        tags: z.array(z.string()).optional(),
    }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("manageAccount", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    createOnDemand: publicProcedure
        .input(z.object({
        username: z.string(),
        type: z.number(),
        destination_id: z.string().optional(),
        notify: z.number().optional().default(1),
    }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("createBackupOnDemand", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    deleteSnapshots: publicProcedure
        .input(z.object({
        username: z.string(),
        destination_id: z.string(),
        type: z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const result = await sendJetBackupRequest("deleteAccountSnapshots", input);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
});
