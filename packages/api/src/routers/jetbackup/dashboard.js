import { protectedProcedure, router } from "../../trpc";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
import { DashboardDetails, SystemInfo } from "../../types/jetbackup";
import { z } from "zod";
import { jetbackupCall } from "./_helpers";
export const jetbackupDashboardRouter = router({
    getDetails: protectedProcedure.query(async () => {
        return jetbackupCall("getDashboardDetails");
    }),
    testConnection: protectedProcedure.query(async () => {
        const result = await sendJetBackupRequest("getInfo");
        return {
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString(),
            system: result.system ?? null,
            data: result.data,
        };
    }),
    getInfo: protectedProcedure.query(async () => {
        return jetbackupCall("getInfo");
    }),
    getStatistics: protectedProcedure
        .input(z.object({
        range: z.string().optional().default("7d"),
    }))
        .query(async ({ input }) => {
        return jetbackupCall("getStatistics", { range: input.range });
    }),
    listShowcase: protectedProcedure.query(async () => {
        return jetbackupCall("listShowcase");
    }),
});
