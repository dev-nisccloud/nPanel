import { publicProcedure, router } from "../../trpc";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
import { Destination, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";

const listSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  orderby: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const jetbackupDestinationsRouter = router({
  list: publicProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      const result = await sendJetBackupRequest<JetBackupListResponse<Destination>>("listDestinations", input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  get: publicProcedure
    .input(z.object({ _id: z.string() }))
    .query(async ({ input }) => {
      const result = await sendJetBackupRequest<Destination>("getDestination", { _id: input._id });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  manage: publicProcedure
    .input(z.object({
      action: z.enum(["create", "modify"]),
      _id: z.string().optional(),
      name: z.string().optional(),
      type: z.string().optional(),
      threads: z.number().optional(),
      disk_limit: z.number().optional(),
      options: z.record(z.any()).optional(),
      dr: z.number().optional(),
      readonly: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await sendJetBackupRequest<any>("manageDestination", input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  delete: publicProcedure
    .input(z.object({ _id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await sendJetBackupRequest<any>("deleteDestination", { _id: input._id });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  validate: publicProcedure
    .input(z.object({ _id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await sendJetBackupRequest<any>("validateDestination", { _id: input._id });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  reindex: publicProcedure
    .input(z.object({ _id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await sendJetBackupRequest<any>("reindexDestination", { _id: input._id });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),

  runIntegrityCheck: publicProcedure
    .input(z.object({ _id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await sendJetBackupRequest<any>("runIntegrityCheck", { _id: input._id });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    }),
});
