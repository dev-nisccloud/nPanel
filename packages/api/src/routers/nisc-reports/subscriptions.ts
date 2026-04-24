import { z } from "zod";
import { and, addDays, count, desc, eq, gte, inArray, isNull, lte } from "@npanel/db";
import { db } from "@npanel/db";
import {
  niscClientSubscription,
  niscClientSubscriptionRenewal,
  niscProduct,
} from "@npanel/db/schema/products";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, monthlyMrr } from "./filters";
import { differenceInDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { buildOwnerOrTeamReadScope, resolveReportReadScope } from "./access";

const FIXED = "FIXED";
const ACTIVE = "ACTIVE";
const CANCELLED = "CANCELLED";
const EXPIRED = "EXPIRED";
const UPGRADED = "UPGRADED";
const DOWNGRADED = "DOWNGRADED";

type NiscProductCategory = "CLOUD" | "MARKETING" | "CONSULTING" | "CUSTOM" | "AI";

export const niscSubscriptionsRouter = router({
  // ─── S-01 MRR / ARR Dashboard ─────────────────────────────────────────────
  mrrDashboard: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      mrr:         z.number(),
      arr:         z.number(),
      currency:    z.string(),
      byCategory:  z.array(z.object({ category: z.string(), mrr: z.number(), count: z.number() })),
      byClient:    z.array(z.object({ teamId: z.string(), teamName: z.string(), mrr: z.number(), count: z.number() })),
      totalActive: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { teamIds, subscriptionStatuses, productCategories } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });
      const statuses = subscriptionStatuses?.length ? subscriptionStatuses : [ACTIVE];

      const subs = await db.query.niscClientSubscription.findMany({
        where: and(
          inArray(niscClientSubscription.status, statuses),
          isNull(niscClientSubscription.upgradedToSubscriptionId),
          isNull(niscClientSubscription.downgradedToSubscriptionId),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: {
          product: { columns: { category: true, name: true } },
          team:    { columns: { id: true, name: true } },
        },
      });

      const byCatMap = new Map<string, { mrr: number; count: number }>();
      const byClientMap = new Map<string, { teamName: string; mrr: number; count: number }>();
      let totalMrr = 0;

      for (const s of subs) {
        const cat = s.product?.category ?? "CUSTOM";
        if (productCategories?.length && !productCategories.includes(cat as NiscProductCategory)) continue;
        const mrr = s.pricingModel === FIXED ? monthlyMrr(s.agreedPrice, s.billingCycle) : 0;
        totalMrr += mrr;

        const ce = byCatMap.get(cat) ?? { mrr: 0, count: 0 };
        ce.mrr += mrr; ce.count += 1;
        byCatMap.set(cat, ce);

        const tid = s.teamId ?? "__none__";
        const tname = s.team?.name ?? "Unknown";
        const te = byClientMap.get(tid) ?? { teamName: tname, mrr: 0, count: 0 };
        te.mrr += mrr; te.count += 1;
        byClientMap.set(tid, te);
      }

      const byCategory = Array.from(byCatMap.entries())
        .map(([category, v]) => ({ category, ...v }))
        .sort((a, b) => b.mrr - a.mrr);

      const byClient = Array.from(byClientMap.entries())
        .map(([teamId, v]) => ({ teamId, ...v }))
        .sort((a, b) => b.mrr - a.mrr)
        .slice(0, 50);

      return { mrr: totalMrr, arr: totalMrr * 12, currency: "KES", byCategory, byClient, totalActive: subs.length };
    }),

  // ─── S-02 MRR Movement Waterfall ─────────────────────────────────────────
  mrrMovement: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      newMrr:        z.number(),
      expansionMrr:  z.number(),
      contractionMrr:z.number(),
      churnedMrr:    z.number(),
      netChange:     z.number(),
      periodLabel:   z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
      });

      const newSubs = await db.query.niscClientSubscription.findMany({
        where: and(
          gte(niscClientSubscription.subscriptionDate, from),
          lte(niscClientSubscription.subscriptionDate, to),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
      });
      let newMrr = 0;
      for (const s of newSubs) {
        if (s.pricingModel === FIXED) newMrr += monthlyMrr(s.agreedPrice, s.billingCycle);
      }

      const churnedSubs = await db.query.niscClientSubscription.findMany({
        where: and(
          inArray(niscClientSubscription.status, [CANCELLED, EXPIRED]),
          gte(niscClientSubscription.updatedAt, from),
          lte(niscClientSubscription.updatedAt, to),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
      });
      let churnedMrr = 0;
      for (const s of churnedSubs) {
        if (s.pricingModel === FIXED) churnedMrr += monthlyMrr(s.agreedPrice, s.billingCycle);
      }

      const upgradedSubs = await db.query.niscClientSubscription.findMany({
        where: and(
          eq(niscClientSubscription.status, UPGRADED),
          gte(niscClientSubscription.updatedAt, from),
          lte(niscClientSubscription.updatedAt, to),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
      });
      let expansionMrr = 0;
      for (const s of upgradedSubs) {
        if (s.pricingModel === FIXED) expansionMrr += monthlyMrr(s.agreedPrice, s.billingCycle);
      }

      const downgradedSubs = await db.query.niscClientSubscription.findMany({
        where: and(
          eq(niscClientSubscription.status, DOWNGRADED),
          gte(niscClientSubscription.updatedAt, from),
          lte(niscClientSubscription.updatedAt, to),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
      });
      let contractionMrr = 0;
      for (const s of downgradedSubs) {
        if (s.pricingModel === FIXED) contractionMrr += monthlyMrr(s.agreedPrice, s.billingCycle);
      }

      return {
        newMrr, expansionMrr, contractionMrr, churnedMrr,
        netChange: newMrr + expansionMrr - contractionMrr - churnedMrr,
        periodLabel: `${from.toLocaleDateString("en-CA", { month: "short", year: "numeric" })} – ${to.toLocaleDateString("en-CA", { month: "short", year: "numeric" })}`,
      };
    }),

  // ─── S-03 Status Summary ──────────────────────────────────────────────────
  statusSummary: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.array(z.object({
      status:  z.string(),
      count:   z.number(),
      mrr:     z.number(),
    })))
    .query(async ({ input, ctx }) => {
      const { teamIds, productCategories } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });
      const allStatuses = ["ACTIVE", "PENDING", "CANCELLED", "EXPIRED", "SUSPENDED", "UPGRADED", "DOWNGRADED"];

      const subs = await db.query.niscClientSubscription.findMany({
        where: buildOwnerOrTeamReadScope({
          isAgencyUser: scope.isAgencyUser,
          ownerCondition: eq(niscClientSubscription.userId, scope.userId),
          teamColumn: niscClientSubscription.teamId,
          teamIds: scope.teamIds,
        }),
        with: { product: { columns: { category: true } } },
      });

      const map = new Map<string, { count: number; mrr: number }>();
      for (const s of subs) {
        const cat = s.product?.category;
        if (productCategories?.length && cat && !productCategories.includes(cat as NiscProductCategory)) continue;
        const mrr = s.pricingModel === FIXED ? monthlyMrr(s.agreedPrice, s.billingCycle) : 0;
        const e = map.get(s.status) ?? { count: 0, mrr: 0 };
        e.count += 1; e.mrr += mrr;
        map.set(s.status, e);
      }

      return allStatuses.map(status => ({
        status,
        count: map.get(status)?.count ?? 0,
        mrr:   map.get(status)?.mrr ?? 0,
      }));
    }),

  // ─── S-04 Subscription List ───────────────────────────────────────────────
  list: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:               z.string(),
        teamName:         z.string().nullable(),
        productName:      z.string().nullable(),
        pricingModel:     z.string(),
        agreedPrice:      z.number(),
        billingCycle:     z.string().nullable(),
        status:           z.string(),
        subscriptionDate: z.date().nullable(),
        nextRenewalDate:  z.date().nullable(),
        expiryDate:       z.date().nullable(),
        mrr:              z.number(),
      })),
      total: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { teamIds, subscriptionStatuses, productCategories, page, pageSize } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });
      const offset = (page - 1) * pageSize;

      const rows = await db.query.niscClientSubscription.findMany({
        where: and(
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
          subscriptionStatuses?.length ? inArray(niscClientSubscription.status, subscriptionStatuses) : undefined,
        ),
        with: {
          team:    { columns: { name: true } },
          product: { columns: { name: true, category: true } },
        },
        orderBy: [desc(niscClientSubscription.createdAt)],
        limit: pageSize,
        offset,
      });

      const [cntRow] = await db
        .select({ c: count() })
        .from(niscClientSubscription)
        .where(and(
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
          subscriptionStatuses?.length ? inArray(niscClientSubscription.status, subscriptionStatuses) : undefined,
        ));

      return {
        rows: rows.map(s => ({
          id: s.id,
          teamName: (s as any).team?.name ?? null,
          productName: (s as any).product?.name ?? null,
          pricingModel: s.pricingModel,
          agreedPrice: s.pricingModel === FIXED ? monthlyMrr(s.agreedPrice, s.billingCycle) : 0,
          billingCycle: s.billingCycle,
          status: s.status,
          subscriptionDate: s.subscriptionDate,
          nextRenewalDate: s.nextRenewalDate,
          expiryDate: s.expiryDate,
          mrr: s.pricingModel === FIXED ? monthlyMrr(s.agreedPrice, s.billingCycle) : 0,
        })),
        total: Number(cntRow?.c ?? 0),
      };
    }),

  // ─── S-05 Renewal Forecast ────────────────────────────────────────────────
  renewalForecast: protectedProcedure
    .input(reportFiltersSchema.extend({ withinDays: z.number().int().optional().default(90) }))
    .output(z.array(z.object({
      id:              z.string(),
      teamName:        z.string().nullable(),
      productName:     z.string().nullable(),
      renewalDate:     z.date().nullable(),
      expectedPrice:   z.number(),
      billingCycle:    z.string().nullable(),
      autoRenew:       z.boolean(),
      status:          z.string(),
      daysUntilRenewal:z.number(),
    })))
    .query(async ({ input, ctx }) => {
      const { teamIds, withinDays } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });
      const now = new Date();
      const future = new Date(now.getTime() + withinDays * 86400000);

      const subs = await db.query.niscClientSubscription.findMany({
        where: and(
          eq(niscClientSubscription.status, ACTIVE),
          gte(niscClientSubscription.nextRenewalDate, now),
          lte(niscClientSubscription.nextRenewalDate, future),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: {
          team:    { columns: { name: true } },
          product: { columns: { name: true } },
        },
        orderBy: [niscClientSubscription.nextRenewalDate],
      });

      return subs.map(s => ({
        id: s.id,
        teamName: (s as any).team?.name ?? null,
        productName: (s as any).product?.name ?? null,
        renewalDate: s.nextRenewalDate,
        expectedPrice: monthlyMrr(s.agreedPrice, s.billingCycle),
        billingCycle: s.billingCycle,
        autoRenew: s.autoRenew ?? false,
        status: s.status,
        daysUntilRenewal: s.nextRenewalDate ? differenceInDays(s.nextRenewalDate, now) : 0,
      }));
    }),

  // ─── S-06 Churn Analysis ─────────────────────────────────────────────────
  churn: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:               z.string(),
        teamName:         z.string().nullable(),
        productName:      z.string().nullable(),
        agreedPrice:      z.number(),
        billingCycle:     z.string().nullable(),
        subscriptionDate: z.date().nullable(),
        churnDate:        z.date(),
        mrrLost:          z.number(),
        tenureDays:       z.number(),
      })),
      totalChurnedMrr: z.number(),
      churnRate:       z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, teamIds } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });

      const churned = await db.query.niscClientSubscription.findMany({
        where: and(
          inArray(niscClientSubscription.status, [CANCELLED, EXPIRED]),
          gte(niscClientSubscription.updatedAt, from),
          lte(niscClientSubscription.updatedAt, to),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: {
          team:    { columns: { name: true } },
          product: { columns: { name: true } },
        },
      });

      const [activeAtStartRow] = await db
        .select({ c: count() })
        .from(niscClientSubscription)
        .where(and(
          eq(niscClientSubscription.status, ACTIVE),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ));
      const activeAtStart = Number(activeAtStartRow?.c ?? 0) + churned.length;

      let totalChurnedMrr = 0;
      const rows = churned.map(s => {
        const mrrLost = s.pricingModel === FIXED ? monthlyMrr(s.agreedPrice, s.billingCycle) : 0;
        totalChurnedMrr += mrrLost;
        const start = s.subscriptionDate ?? s.createdAt;
        return {
          id: s.id,
          teamName: (s as any).team?.name ?? null,
          productName: (s as any).product?.name ?? null,
          agreedPrice: monthlyMrr(s.agreedPrice, s.billingCycle),
          billingCycle: s.billingCycle,
          subscriptionDate: s.subscriptionDate,
          churnDate: s.updatedAt,
          mrrLost,
          tenureDays: differenceInDays(s.updatedAt, start),
        };
      });

      return {
        rows,
        totalChurnedMrr,
        churnRate: activeAtStart > 0 ? (churned.length / activeAtStart) * 100 : 0,
      };
    }),

  // ─── S-07 Upgrade / Downgrade ────────────────────────────────────────────
  upgrades: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.array(z.object({
      id:          z.string(),
      teamName:    z.string().nullable(),
      productName: z.string().nullable(),
      changeType:  z.string(),
      priceDelta:  z.number(),
      eventDate:   z.date(),
    })))
    .query(async ({ input, ctx }) => {
      const { from, to, teamIds } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });

      const upgraded = await db.query.niscClientSubscription.findMany({
        where: and(
          eq(niscClientSubscription.status, UPGRADED),
          gte(niscClientSubscription.updatedAt, from),
          lte(niscClientSubscription.updatedAt, to),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: {
          team:    { columns: { name: true } },
          product: { columns: { name: true } },
        },
      });
      const downgraded = await db.query.niscClientSubscription.findMany({
        where: and(
          eq(niscClientSubscription.status, DOWNGRADED),
          gte(niscClientSubscription.updatedAt, from),
          lte(niscClientSubscription.updatedAt, to),
          buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(niscClientSubscription.userId, scope.userId),
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: {
          team:    { columns: { name: true } },
          product: { columns: { name: true } },
        },
      });

      return [
        ...upgraded.map(s => ({
          id: s.id,
          teamName: (s as any).team?.name ?? null,
          productName: (s as any).product?.name ?? null,
          changeType: "UPGRADE",
          priceDelta: monthlyMrr(s.agreedPrice, s.billingCycle),
          eventDate: s.updatedAt,
        })),
        ...downgraded.map(s => ({
          id: s.id,
          teamName: (s as any).team?.name ?? null,
          productName: (s as any).product?.name ?? null,
          changeType: "DOWNGRADE",
          priceDelta: -monthlyMrr(s.agreedPrice, s.billingCycle),
          eventDate: s.updatedAt,
        })),
      ].sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
    }),
});
