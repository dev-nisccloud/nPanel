import { protectedProcedure, router } from "../../trpc";
import { NiscBackupListResponse, Schedule } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, listSchema } from "./_helpers";

export const niscBackupSchedulesRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<Schedule>>("listSchedules", input);
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<Schedule>("getSchedule", input);
    }),

  manage: protectedProcedure
    .input(z.object({
      action: z.enum(["create", "modify"]),
      _id: z.string().optional(),
      name: z.string().optional(),
      cron: z.string().optional(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("manageSchedule", input);
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteSchedule", input);
    }),
});
