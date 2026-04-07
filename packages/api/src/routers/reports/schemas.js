import { z } from "zod";
export const salesReportSnapshotSchema = z.object({
    id: z.string(),
    period: z.string(),
    date: z.date(),
    totalRevenue: z.coerce.number(),
    totalInvoiced: z.coerce.number(),
    totalPaid: z.coerce.number(),
    taxableAmount: z.coerce.number(),
    taxAmount: z.coerce.number(),
    pendingAmount: z.coerce.number(),
    invoiceCount: z.number(),
    paidInvoiceCount: z.number(),
    currency: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const revenueByServiceSnapshotSchema = z.object({
    id: z.string(),
    period: z.string(),
    date: z.date(),
    serviceType: z.string(),
    amount: z.coerce.number(),
    currency: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const revenueByTeamSnapshotSchema = z.object({
    id: z.string(),
    period: z.string(),
    date: z.date(),
    teamId: z.string(),
    teamName: z.string(),
    amount: z.coerce.number(),
    currency: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const creativeProductionSnapshotSchema = z.object({
    id: z.string(),
    period: z.string(),
    date: z.date(),
    assetsCreated: z.number(),
    assetsApproved: z.number(),
    versionsCreated: z.number(),
    avgVelocityDays: z.number().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
