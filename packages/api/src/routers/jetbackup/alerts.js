import { protectedProcedure, router } from "../../trpc";
import { Alert, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";
export const jetbackupAlertsRouter = router({
    list: protectedProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        return jetbackupCall("listAlerts", input);
    }),
    get: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return jetbackupCall("getAlert", input);
    }),
    clear: protectedProcedure
        .input(z.object({ _id: z.string().optional() }))
        .mutation(async ({ input }) => {
        return jetbackupCall("clearAlerts", input);
    }),
});
