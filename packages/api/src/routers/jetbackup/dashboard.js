import { publicProcedure, router } from "../../trpc";
import { sendJetBackupRequest } from "../../lib/jetbackup/client";
import { DashboardDetails, SystemInfo } from "../../types/jetbackup";
import { z } from "zod";
export const jetbackupDashboardRouter = router({
    getDetails: publicProcedure.query(async () => {
        const result = await sendJetBackupRequest("getDashboardDetails");
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    testConnection: publicProcedure.query(async () => {
        const result = await sendJetBackupRequest("getInfo");
        return {
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString(),
        };
    }),
    getInfo: publicProcedure.query(async () => {
        const result = await sendJetBackupRequest("getInfo");
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
    getStatistics: publicProcedure
        .input(z.object({
        range: z.string().optional().default("7d"),
    }))
        .query(async ({ input }) => {
        const result = await sendJetBackupRequest("getStatistics", {
            range: input.range,
        });
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    }),
});
