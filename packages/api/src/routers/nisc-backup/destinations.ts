import { protectedProcedure, router } from "../../trpc";
import { Destination, NiscBackupListResponse } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, listSchema } from "./_helpers";

export const niscBackupDestinationsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<Destination>>("listDestinations", input);
    }),

  listTypes: protectedProcedure.query(async () => {
    return niscBackupCall("listDestinationsTypes");
  }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<Destination>("getDestination", input);
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
      return niscBackupCall("manageDestination", input);
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteDestination", input);
    }),

  validate: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("validateDestination", input);
    }),

  reindex: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("reindexDestination", input);
    }),

  runIntegrityCheck: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("runIntegrityCheck", input);
    }),
});
