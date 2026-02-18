import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@nPanel/db";
import { aggregateSales } from "./utils";
import { subDays } from "date-fns";
import { revenueByServiceSnapshotSchema, salesReportSnapshotSchema } from "./schemas";

export const salesReportsRouter = router({
    getRevenueTrends: protectedProcedure
        .input(z.object({
            from: z.coerce.date().optional(),
            to: z.coerce.date().optional(),
            limit: z.number().optional().default(30),
        }))
        .output(z.array(salesReportSnapshotSchema))
        .query(async ({ input }) => {
            const startDate = input.from || subDays(new Date(), 30);
            const endDate = input.to || new Date();

            const results = await prisma.salesReportSnapshot.findMany({
                where: {
                    period: "DAILY",
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: { date: "desc" },
                take: input.limit,
            });

            // If empty, try to aggregate daily snapshots
            if (results.length === 0) {
                await aggregateSales("DAILY");
                return prisma.salesReportSnapshot.findMany({
                    where: {
                        period: "DAILY",
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    orderBy: { date: "desc" },
                    take: input.limit,
                });
            }

            return results;
        }),

    getRevenueByService: protectedProcedure
        .input(z.object({
            from: z.coerce.date().optional(),
            to: z.coerce.date().optional(),
            limit: z.number().optional().default(10),
        }))
        .output(z.array(revenueByServiceSnapshotSchema))
        .query(async ({ input }) => {
            const startDate = input.from || subDays(new Date(), 30);
            const endDate = input.to || new Date();

            const results = await prisma.revenueByServiceSnapshot.findMany({
                where: {
                    period: "DAILY",
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: { date: "desc" },
                take: input.limit,
            });

            if (results.length === 0) {
                await aggregateSales("DAILY");
                return prisma.revenueByServiceSnapshot.findMany({
                    where: {
                        period: "DAILY",
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    orderBy: { date: "desc" },
                    take: input.limit,
                });
            }

            return results;
        }),

    sync: protectedProcedure
        .input(z.object({
            period: z.enum(["DAILY", "MONTHLY"]).optional().default("DAILY"),
        }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
            await aggregateSales(input.period);
            return { success: true };
        }),
});
