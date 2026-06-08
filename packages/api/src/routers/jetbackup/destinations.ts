import { protectedProcedure, router } from "../../trpc";
import { Destination, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";

export const jetbackupDestinationsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<Destination>>("listDestinations", input);
    }),

  listTypes: protectedProcedure.query(async () => {
    return jetbackupCall("listDestinationsTypes");
  }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return jetbackupCall<Destination>("getDestination", input);
    }),

  manage: protectedProcedure
    .input(z.object({
      action: z.enum(["create", "modify"]),
      _id: z.string().optional(),
      name: z.string().optional(),
      type: z.string().optional(),
      threads: z.number().optional(),
      disk_limit: z.number().optional(),
      options: z.record(z.string(), z.unknown()).optional(),
      dr: z.number().optional(),
      readonly: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("manageDestination", input);
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("deleteDestination", input);
    }),

  validate: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("validateDestination", input);
    }),

  reindex: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("reindexDestination", input);
    }),

  runIntegrityCheck: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return jetbackupCall("runIntegrityCheck", input);
    }),
});
