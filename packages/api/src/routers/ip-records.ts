import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db, desc } from "@npanel/db";
import { ipRecords } from "@npanel/db/schema";
import { TRPCError } from "@trpc/server";

export const ipRecordsRouter = router({
  list: protectedProcedure
    .output(z.object({
      success: z.boolean(),
      data: z.array(z.object({
        id: z.string(),
        ipAddress: z.string(),
        timestamp: z.date(),
      })),
    }))
    .query(async ({ ctx }) => {
      const userRole = ctx.session?.user?.role;
      if (userRole !== "AGENCY_SUPER_ADMIN" && userRole !== "AGENCY_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agency admins can access IP records",
        });
      }

      try {
        const records = await db
          .select()
          .from(ipRecords)
          .orderBy(desc(ipRecords.timestamp))
          .limit(100);

        return {
          success: true,
          data: records,
        };
      } catch (error) {
        console.error("Failed to fetch IP records:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch IP records",
        });
      }
    }),
});
