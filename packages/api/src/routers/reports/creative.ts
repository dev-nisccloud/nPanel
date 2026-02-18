import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@nPanel/db";
import { aggregateCreative } from "./utils";
import { subDays } from "date-fns";

export const creativeReportsRouter = router({
    getProductionStats: protectedProcedure
        .input(z.object({
            from: z.coerce.date().optional(),
            to: z.coerce.date().optional(),
            limit: z.number().optional().default(30),
        }))
        .query(async ({ input }) => {
            const startDate = input.from || subDays(new Date(), 30);
            const endDate = input.to || new Date();

            const results = await prisma.creativeProductionSnapshot.findMany({
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
                await aggregateCreative("DAILY");
                return prisma.creativeProductionSnapshot.findMany({
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
        .mutation(async ({ input }) => {
            await aggregateCreative(input.period);
            return { success: true };
        }),
});
