import { publicProcedure, router } from "../../trpc";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
import { QueueGroup, QueueItem, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";

const listSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  orderby: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const jetbackupQueuesRouter = router({
  listGroups: publicProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      const result = await sendJetBackupRequest<JetBackupListResponse<QueueGroup>>("listQueueGroups", input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  getGroup: publicProcedure
    .input(z.object({ _id: z.string() }))
    .query(async ({ input }) => {
      const result = await sendJetBackupRequest<QueueGroup>("getQueueGroup", { _id: input._id });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  listItems: publicProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      const result = await sendJetBackupRequest<JetBackupListResponse<QueueItem>>("listQueueItems", input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  stopGroup: publicProcedure
    .input(z.object({ _id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await sendJetBackupRequest<any>("stopQueueGroup", { _id: input._id });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  stopAll: publicProcedure.mutation(async () => {
    const result = await sendJetBackupRequest<any>("stopAllQueueGroup");
    if (!result.success) {
      throw new Error(result.message);
    }
    return result.data;
  }),

  clear: publicProcedure
    .input(z.object({ type: z.number().optional() }))
    .mutation(async ({ input }) => {
      const result = await sendJetBackupRequest<any>("clearQueue", input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  rerunFailed: publicProcedure
    .input(z.object({ _id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await sendJetBackupRequest<any>("rerunFailedQueueGroup", { _id: input._id });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),
});
