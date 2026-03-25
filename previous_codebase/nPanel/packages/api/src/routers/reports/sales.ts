import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@npanel/db";
import { subDays } from "date-fns";
import { aggregateSales } from "./utils";
import { computeSalesReportOverview } from "./sales-overview";
import {
	revenueByServiceSnapshotSchema,
	revenueByTeamSnapshotSchema,
	salesReportSnapshotSchema,
} from "./schemas";
import {
	salesReportOverviewInputSchema,
	salesReportOverviewSchema,
} from "./sales-overview-schemas";

/** Aggregate daily team snapshots into one row per team (total amount), sorted by amount desc, top N. */
function aggregateRevenueByTeam(
    rows: { teamId: string; teamName: string; amount: unknown; date: Date; period: string; currency: string }[],
    limit: number
) {
    const byTeam = new Map<string, { teamId: string; teamName: string; amount: number; date: Date; period: string; currency: string }>();
    for (const r of rows) {
        const amount = Number(r.amount);
        const existing = byTeam.get(r.teamId);
        if (existing) {
            existing.amount += amount;
        } else {
            byTeam.set(r.teamId, {
                teamId: r.teamId,
                teamName: r.teamName,
                amount,
                date: r.date,
                period: r.period,
                currency: r.currency,
            });
        }
    }
    return Array.from(byTeam.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, limit)
        .map(({ teamId, teamName, amount, date, period, currency }) => ({
            id: `${teamId}-${date.toISOString()}`,
            teamId,
            teamName,
            amount,
            date,
            period,
            currency,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
}

export const salesReportsRouter = router({
	getSalesReportOverview: protectedProcedure
		.input(salesReportOverviewInputSchema)
		.output(salesReportOverviewSchema)
		.query(async ({ input }) => {
			const from =
				input.from ?? subDays(new Date(), 30);
			const to = input.to ?? new Date();
			return computeSalesReportOverview({
				from,
				to,
				monthsTrend: input.monthsTrend,
				topTeamsLimit: input.topTeamsLimit,
			});
		}),

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
                const newResults = await prisma.salesReportSnapshot.findMany({
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
                return newResults.map(r => ({
                    ...r,
                    totalRevenue: Number(r.totalRevenue),
                    totalInvoiced: Number(r.totalInvoiced),
                    totalPaid: Number(r.totalPaid),
                    taxableAmount: Number(r.taxableAmount),
                    taxAmount: Number(r.taxAmount),
                    pendingAmount: Number(r.pendingAmount),
                }));
            }

            return results.map(r => ({
                ...r,
                totalRevenue: Number(r.totalRevenue),
                totalInvoiced: Number(r.totalInvoiced),
                totalPaid: Number(r.totalPaid),
                taxableAmount: Number(r.taxableAmount),
                taxAmount: Number(r.taxAmount),
                pendingAmount: Number(r.pendingAmount),
            }));
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
                const newResults = await prisma.revenueByServiceSnapshot.findMany({
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
                return newResults.map(r => ({
                    ...r,
                    amount: Number(r.amount),
                }));
            }

            return results.map(r => ({
                ...r,
                amount: Number(r.amount),
            }));
        }),

    getRevenueByCompany: protectedProcedure
        .input(z.object({
            from: z.coerce.date().optional(),
            to: z.coerce.date().optional(),
            limit: z.number().optional().default(10),
        }))
        .output(z.array(revenueByTeamSnapshotSchema))
        .query(async ({ input }) => {
            const startDate = input.from || subDays(new Date(), 30);
            const endDate = input.to || new Date();

            const results = await prisma.revenueByTeamSnapshot.findMany({
                where: {
                    period: "DAILY",
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: { date: "desc" },
            });

            if (results.length === 0) {
                await aggregateSales("DAILY");
                const newResults = await prisma.revenueByTeamSnapshot.findMany({
                    where: {
                        period: "DAILY",
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    orderBy: { date: "desc" },
                });
                return aggregateRevenueByTeam(newResults, input.limit);
            }

            return aggregateRevenueByTeam(results, input.limit);
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
