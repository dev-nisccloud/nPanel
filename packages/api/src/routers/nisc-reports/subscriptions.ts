import { z } from "zod";
import { and, addDays, count, desc, eq, gte, inArray, isNull, lte } from "@npanel/db";
import { db } from "@npanel/db";
import {
  niscClientSubscription,
  niscClientSubscriptionRenewal,
  niscProduct,
} from "@npanel/db/schema/products";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema } from "./filters";
import { differenceInDays } from "date-fns";
import { buildReportEntityScope, resolveReportReadScope } from "./access";
import {
  countSubscriptionsActiveAtDate,
  mrrDeltaBetweenSubscriptions,
  subscriptionMrr,
} from "./metrics";

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
          buildReportEntityScope({
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
        const mrr = subscriptionMrr(s);
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
          buildReportEntityScope({
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
      });
      let newMrr = 0;
      for (const s of newSubs) {
        newMrr += subscriptionMrr(s);
      }

      const churnedSubs = await db.query.niscClientSubscription.findMany({
        where: and(
          inArray(niscClientSubscription.status, [CANCELLED, EXPIRED]),
          gte(niscClientSubscription.updatedAt, from),
          lte(niscClientSubscription.updatedAt, to),
          buildReportEntityScope({
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
      });
      let churnedMrr = 0;
      for (const s of churnedSubs) {
        churnedMrr += subscriptionMrr(s);
      }

      const upgradedSubs = await db.query.niscClientSubscription.findMany({
        where: and(
          eq(niscClientSubscription.status, UPGRADED),
          gte(niscClientSubscription.upgradedAt, from),
          lte(niscClientSubscription.upgradedAt, to),
          buildReportEntityScope({
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        columns: {
          id: true,
          pricingModel: true,
          agreedPrice: true,
          billingCycle: true,
          upgradedToSubscriptionId: true,
        },
      });
      let expansionMrr = 0;
      for (const s of upgradedSubs) {
        if (!s.upgradedToSubscriptionId) {
          expansionMrr += subscriptionMrr(s);
          continue;
        }
        const replacement = await db.query.niscClientSubscription.findFirst({
          where: eq(niscClientSubscription.id, s.upgradedToSubscriptionId),
          columns: { pricingModel: true, agreedPrice: true, billingCycle: true },
        });
        if (replacement) {
          expansionMrr += Math.max(0, mrrDeltaBetweenSubscriptions(s, replacement));
        }
      }

      const downgradedSubs = await db.query.niscClientSubscription.findMany({
        where: and(
          eq(niscClientSubscription.status, DOWNGRADED),
          gte(niscClientSubscription.downgradedAt, from),
          lte(niscClientSubscription.downgradedAt, to),
          buildReportEntityScope({
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        columns: {
          id: true,
          pricingModel: true,
          agreedPrice: true,
          billingCycle: true,
          downgradedToSubscriptionId: true,
        },
      });
      let contractionMrr = 0;
      for (const s of downgradedSubs) {
        if (!s.downgradedToSubscriptionId) {
          contractionMrr += subscriptionMrr(s);
          continue;
        }
        const replacement = await db.query.niscClientSubscription.findFirst({
          where: eq(niscClientSubscription.id, s.downgradedToSubscriptionId),
          columns: { pricingModel: true, agreedPrice: true, billingCycle: true },
        });
        if (replacement) {
          contractionMrr += Math.max(0, -mrrDeltaBetweenSubscriptions(s, replacement));
        }
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
        where: buildReportEntityScope({
          teamColumn: niscClientSubscription.teamId,
          teamIds: scope.teamIds,
        }),
        with: { product: { columns: { category: true } } },
      });

      const map = new Map<string, { count: number; mrr: number }>();
      for (const s of subs) {
        const cat = s.product?.category;
        if (productCategories?.length && cat && !productCategories.includes(cat as NiscProductCategory)) continue;
        const mrr = subscriptionMrr(s);
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
          buildReportEntityScope({
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
          buildReportEntityScope({
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
          agreedPrice: subscriptionMrr(s),
          billingCycle: s.billingCycle,
          status: s.status,
          subscriptionDate: s.subscriptionDate,
          nextRenewalDate: s.nextRenewalDate,
          expiryDate: s.expiryDate,
          mrr: subscriptionMrr(s),
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
          buildReportEntityScope({
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
        expectedPrice: subscriptionMrr(s),
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
          buildReportEntityScope({
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: {
          team:    { columns: { name: true } },
          product: { columns: { name: true } },
        },
      });

      const activeAtStart = await countSubscriptionsActiveAtDate({ asOf: from, scope });

      let totalChurnedMrr = 0;
      const rows = churned.map(s => {
        const mrrLost = subscriptionMrr(s);
        totalChurnedMrr += mrrLost;
        const start = s.subscriptionDate ?? s.createdAt;
        return {
          id: s.id,
          teamName: (s as any).team?.name ?? null,
          productName: (s as any).product?.name ?? null,
          agreedPrice: subscriptionMrr(s),
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
          gte(niscClientSubscription.upgradedAt, from),
          lte(niscClientSubscription.upgradedAt, to),
          buildReportEntityScope({
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
          gte(niscClientSubscription.downgradedAt, from),
          lte(niscClientSubscription.downgradedAt, to),
          buildReportEntityScope({
            teamColumn: niscClientSubscription.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: {
          team:    { columns: { name: true } },
          product: { columns: { name: true } },
        },
      });

      const upgradeRows = await Promise.all(upgraded.map(async s => {
        let priceDelta = subscriptionMrr(s);
        if (s.upgradedToSubscriptionId) {
          const replacement = await db.query.niscClientSubscription.findFirst({
            where: eq(niscClientSubscription.id, s.upgradedToSubscriptionId),
            columns: { pricingModel: true, agreedPrice: true, billingCycle: true },
          });
          if (replacement) priceDelta = mrrDeltaBetweenSubscriptions(s, replacement);
        }
        return {
          id: s.id,
          teamName: (s as { team?: { name: string } }).team?.name ?? null,
          productName: (s as { product?: { name: string } }).product?.name ?? null,
          changeType: "UPGRADE" as const,
          priceDelta,
          eventDate: s.upgradedAt ?? s.updatedAt,
        };
      }));

      const downgradeRows = await Promise.all(downgraded.map(async s => {
        let priceDelta = -subscriptionMrr(s);
        if (s.downgradedToSubscriptionId) {
          const replacement = await db.query.niscClientSubscription.findFirst({
            where: eq(niscClientSubscription.id, s.downgradedToSubscriptionId),
            columns: { pricingModel: true, agreedPrice: true, billingCycle: true },
          });
          if (replacement) priceDelta = mrrDeltaBetweenSubscriptions(s, replacement);
        }
        return {
          id: s.id,
          teamName: (s as { team?: { name: string } }).team?.name ?? null,
          productName: (s as { product?: { name: string } }).product?.name ?? null,
          changeType: "DOWNGRADE" as const,
          priceDelta,
          eventDate: s.downgradedAt ?? s.updatedAt,
        };
      }));

      return [...upgradeRows, ...downgradeRows].sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
    }),
});
