import { protectedProcedure, router } from "../../trpc";
import { sendNiscBackupRequest } from "../../lib/nisc-backup/client";
import { DashboardDetails, SystemInfo } from "../../types/nisc-backup";
import { z } from "zod";
import { niscBackupCall } from "./_helpers";

export const niscBackupDashboardRouter = router({
  getDetails: protectedProcedure.query(async () => {
    return niscBackupCall<DashboardDetails>("getDashboardDetails");
  }),

  testConnection: protectedProcedure.query(async () => {
    const result = await sendNiscBackupRequest<SystemInfo>("getInfo");
    return {
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
      system: result.system ?? null,
      data: result.data,
    };
  }),

  getInfo: protectedProcedure.query(async () => {
    return niscBackupCall<SystemInfo>("getInfo");
  }),

  getStatistics: protectedProcedure
    .input(z.object({
      range: z.string().optional().default("7d"),
    }))
    .query(async ({ input }) => {
      return niscBackupCall("getStatistics", { range: input.range });
    }),

  listShowcase: protectedProcedure.query(async () => {
    return niscBackupCall("listShowcase");
  }),
});
