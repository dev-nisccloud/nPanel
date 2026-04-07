import { z } from "zod";
export declare const salesReportSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    period: z.ZodString;
    date: z.ZodDate;
    totalRevenue: z.ZodCoercedNumber<unknown>;
    totalInvoiced: z.ZodCoercedNumber<unknown>;
    totalPaid: z.ZodCoercedNumber<unknown>;
    taxableAmount: z.ZodCoercedNumber<unknown>;
    taxAmount: z.ZodCoercedNumber<unknown>;
    pendingAmount: z.ZodCoercedNumber<unknown>;
    invoiceCount: z.ZodNumber;
    paidInvoiceCount: z.ZodNumber;
    currency: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const revenueByServiceSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    period: z.ZodString;
    date: z.ZodDate;
    serviceType: z.ZodString;
    amount: z.ZodCoercedNumber<unknown>;
    currency: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const revenueByTeamSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    period: z.ZodString;
    date: z.ZodDate;
    teamId: z.ZodString;
    teamName: z.ZodString;
    amount: z.ZodCoercedNumber<unknown>;
    currency: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const creativeProductionSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    period: z.ZodString;
    date: z.ZodDate;
    assetsCreated: z.ZodNumber;
    assetsApproved: z.ZodNumber;
    versionsCreated: z.ZodNumber;
    avgVelocityDays: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
