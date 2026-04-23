import { z } from "zod";

export const reportFiltersSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  granularity: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional().default("MONTHLY"),

  // Entity dimensions
  teamIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  productCategories: z.array(z.enum(["CLOUD", "MARKETING", "CONSULTING", "CUSTOM", "AI"])).optional(),
  serviceTypes: z.array(z.string()).optional(),
  billingCycles: z.array(z.enum(["MONTHLY", "YEARLY", "BIENNIALLY", "CUSTOM"])).optional(),

  // Financial dimensions
  currency: z.string().optional(),

  // Status dimensions   when omitted ALL statuses are returned including DRAFT
  invoiceStatuses: z.array(z.string()).optional(),
  subscriptionStatuses: z.array(z.string()).optional(),
  orderStatuses: z.array(z.string()).optional(),
  quotationStatuses: z.array(z.string()).optional(),

  // Pagination
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(500).optional().default(50),

  // Sorting
  sortBy: z.string().optional(),
  sortDir: z.enum(["ASC", "DESC"]).optional().default("DESC"),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;

/** Helper: build a SQL status condition or undefined (meaning "all statuses"). */
export function toNum(v: string | null | undefined): number {
  if (!v) return 0;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Normalize agreedPrice to monthly MRR based on billingCycle. */
export function monthlyMrr(price: string | null, cycle: string | null): number {
  const p = toNum(price);
  if (p <= 0) return 0;
  switch (cycle) {
    case "MONTHLY": return p;
    case "YEARLY": return p / 12;
    case "BIENNIALLY": return p / 24;
    default: return p;
  }
}
