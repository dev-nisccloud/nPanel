import { z } from "zod";
export declare const reportFiltersSchema: z.ZodObject<{
    from: z.ZodCoercedDate<unknown>;
    to: z.ZodCoercedDate<unknown>;
    granularity: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        MONTHLY: "MONTHLY";
        YEARLY: "YEARLY";
        DAILY: "DAILY";
        WEEKLY: "WEEKLY";
        QUARTERLY: "QUARTERLY";
    }>>>;
    teamIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    productIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    productCategories: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        AI: "AI";
        CUSTOM: "CUSTOM";
        CLOUD: "CLOUD";
        MARKETING: "MARKETING";
        CONSULTING: "CONSULTING";
    }>>>;
    serviceTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    billingCycles: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        MONTHLY: "MONTHLY";
        YEARLY: "YEARLY";
        BIENNIALLY: "BIENNIALLY";
        CUSTOM: "CUSTOM";
    }>>>;
    currency: z.ZodOptional<z.ZodString>;
    invoiceStatuses: z.ZodOptional<z.ZodArray<z.ZodString>>;
    subscriptionStatuses: z.ZodOptional<z.ZodArray<z.ZodString>>;
    orderStatuses: z.ZodOptional<z.ZodArray<z.ZodString>>;
    quotationStatuses: z.ZodOptional<z.ZodArray<z.ZodString>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ASC: "ASC";
        DESC: "DESC";
    }>>>;
}, z.core.$strip>;
export type ReportFilters = z.infer<typeof reportFiltersSchema>;
/** Helper: build a SQL status condition or undefined (meaning "all statuses"). */
export declare function toNum(v: string | null | undefined): number;
/** Normalize agreedPrice to monthly MRR based on billingCycle. */
export declare function monthlyMrr(price: string | null, cycle: string | null): number;
