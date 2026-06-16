import { protectedProcedure, router } from "../../trpc";
import { JetBackupListResponse, Schedule } from "../../types/jetbackup";
import { z } from "zod";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";
export const jetbackupSchedulesRouter = router({
    list: protectedProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        return jetbackupCall("listSchedules", input);
    }),
    get: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return jetbackupCall("getSchedule", input);
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
        return jetbackupCall("manageSchedule", input);
    }),
    delete: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return jetbackupCall("deleteSchedule", input);
    }),
});
