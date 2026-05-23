import { z } from "zod";
import { and, count, desc, eq, gte, inArray, isNull, lte, sum } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription, niscCommissionEntry } from "@npanel/db/schema/products";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, monthlyMrr, toNum } from "./filters";
import { buildReportEntityScope, resolveReportReadScope } from "./access";
import { subscriptionMrr } from "./metrics";

const FIXED = "FIXED";

export const niscProfitabilityRouter = router({
  // ─── M-01 Gross Margin by Subscription ────────────────────────────────────
  grossMargin: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:           z.string(),
        teamName:     z.string().nullable(),
        productName:  z.string().nullable(),
        category:     z.string().nullable(),
        billingCycle: z.string().nullable(),
        revenue:      z.number(),
        cost:         z.number(),
        grossMargin:  z.number(),
        marginPct:    z.number(),
      })),
      totalRevenue:    z.number(),
      totalCost:       z.number(),
      avgMarginPct:    z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { teamIds, subscriptionStatuses, productCategories, page, pageSize } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });
      const offset = (page - 1) * pageSize;
      const statuses = subscriptionStatuses?.length ? subscriptionStatuses : ["ACTIVE"];

      const subs = await db.query.niscClientSubscription.findMany({
        where: and(
          inArray(niscClientSubscription.status, statuses),
          isNull(niscClientSubscription.upgradedToSubscriptionId),
          isNull(niscClientSubscription.downgradedToSubscriptionId),
          buildReportEntityScope({
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: {
          team:    { columns: { name: true } },
          product: { columns: { name: true, category: true } },
        },
        limit: pageSize,
        offset,
      });

      let totalRevenue = 0, totalCost = 0;
      const rows = subs
        .filter(s => s.pricingModel === FIXED)
        .map(s => {
          const cat = (s as any).product?.category;
          if (productCategories?.length && cat && !productCategories.includes(cat)) return null;
          const revenue = subscriptionMrr(s);
          const cost    = monthlyMrr(s.agreedCost ?? null, s.billingCycle);
          const grossMargin = revenue - cost;
          const marginPct   = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
          totalRevenue += revenue;
          totalCost    += cost;
          return {
            id: s.id,
            teamName:    (s as any).team?.name ?? null,
            productName: (s as any).product?.name ?? null,
            category:    cat ?? null,
            billingCycle: s.billingCycle,
            revenue, cost, grossMargin, marginPct,
          };
        })
        .filter(Boolean) as Array<{
          id: string; teamName: string | null; productName: string | null;
          category: string | null; billingCycle: string | null;
          revenue: number; cost: number; grossMargin: number; marginPct: number;
        }>;

      const avgMarginPct = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

      return { rows, totalRevenue, totalCost, avgMarginPct };
    }),

  // ─── M-02 Commission Report ────────────────────────────────────────────────
  commission: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:              z.string(),
        teamName:        z.string().nullable(),
        period:          z.string().nullable(),
        baseAmount:      z.number(),
        commissionRate:  z.number(),
        commissionAmount:z.number(),
        status:          z.string(),
        invoiceId:       z.string().nullable(),
      })),
      totalEarned:  z.number(),
      totalBilled:  z.number(),
      totalPaid:    z.number(),
      totalPending: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, teamIds, page, pageSize } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });
      const offset = (page - 1) * pageSize;

      const rows = await db.query.niscCommissionEntry.findMany({
        where: and(
          gte(niscCommissionEntry.createdAt, from),
          lte(niscCommissionEntry.createdAt, to),
          buildReportEntityScope({
            teamColumn: niscCommissionEntry.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: { team: { columns: { name: true } } },
        orderBy: [desc(niscCommissionEntry.createdAt)],
        limit: pageSize,
        offset,
      });

      // Aggregates
      const all = await db
        .select({ status: niscCommissionEntry.status, commissionAmount: niscCommissionEntry.commissionAmount })
        .from(niscCommissionEntry)
        .where(and(
          gte(niscCommissionEntry.createdAt, from),
          lte(niscCommissionEntry.createdAt, to),
          buildReportEntityScope({
            teamColumn: niscCommissionEntry.teamId,
            teamIds: scope.teamIds,
          }),
        ));

      let totalEarned = 0, totalBilled = 0, totalPaid = 0;
      for (const r of all) {
        const amt = toNum(r.commissionAmount);
        totalEarned += amt;
        if (r.status === "INVOICED") totalBilled += amt;
        if (r.status === "PAID") totalPaid += amt;
      }

      return {
        rows: rows.map(r => ({
          id: r.id,
          teamName: (r as any).team?.name ?? null,
          period: r.period,
          baseAmount: toNum(r.baseAmount),
          commissionRate: toNum(r.commissionRate),
          commissionAmount: toNum(r.commissionAmount),
          status: r.status,
          invoiceId: r.invoiceId,
        })),
        totalEarned,
        totalBilled,
        totalPaid,
        totalPending: totalEarned - totalBilled - totalPaid,
      };
    }),
});
