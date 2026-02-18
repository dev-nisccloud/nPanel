import { z } from "zod";

export const salesReportSnapshotSchema = z.object({
    id: z.string(),
    period: z.string(),
    date: z.date(),
    totalSales: z.number(),
    orderCount: z.number(),
    avgOrderValue: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const revenueByServiceSnapshotSchema = z.object({
    id: z.string(),
    period: z.string(),
    date: z.date(),
    serviceName: z.string(),
    revenue: z.number(),
    orderCount: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
