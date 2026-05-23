import { z } from "zod";
import { and, count, desc, eq, gte, inArray, lte } from "@npanel/db";
import { db } from "@npanel/db";
import { quotation } from "@npanel/db/schema/quotations";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, toNum } from "./filters";
import { differenceInDays } from "date-fns";
import { resolveReportReadScope } from "./access";

export const niscQuotationsRouter = router({
  // ─── Q-01 Pipeline Overview ────────────────────────────────────────────────
  pipeline: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      inPreparation:       z.number(), // DRAFT value
      activePipeline:      z.number(), // SENT value
      wonValue:            z.number(), // ACCEPTED
      lostValue:           z.number(), // REJECTED
      expiredValue:        z.number(), // EXPIRED
      winRate:             z.number(),
      avgQuoteValue:       z.number(),
      avgTimeToDecision:   z.number(),
      avgTimeToSend:       z.number(),
      byStatus:            z.array(z.object({ status: z.string(), count: z.number(), amount: z.number() })),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, quotationStatuses } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
      });

      const rows = await db
        .select({
          status:    quotation.status,
          amount:    quotation.amount,
          createdAt: quotation.createdAt,
          updatedAt: quotation.updatedAt,
          issueDate: quotation.issueDate,
        })
        .from(quotation)
        .where(and(
          gte(quotation.createdAt, from),
          lte(quotation.createdAt, to),
          quotationStatuses?.length ? inArray(quotation.status, quotationStatuses) : undefined,
        ));

      const byStatusMap = new Map<string, { count: number; amount: number }>();
      let wonValue = 0, lostValue = 0, expiredValue = 0, activePipeline = 0, inPreparation = 0;
      const decisionDays: number[] = [];
      const acceptedAmounts: number[] = [];

      for (const q of rows) {
        const amt = toNum(q.amount);
        const e = byStatusMap.get(q.status) ?? { count: 0, amount: 0 };
        e.count += 1; e.amount += amt;
        byStatusMap.set(q.status, e);

        if (q.status === "DRAFT") inPreparation += amt;
        else if (q.status === "SENT") activePipeline += amt;
        else if (q.status === "ACCEPTED") {
          wonValue += amt;
          acceptedAmounts.push(amt);
          const ref = q.issueDate ?? q.createdAt;
          decisionDays.push(differenceInDays(q.updatedAt, ref));
        }
        else if (q.status === "REJECTED") {
          lostValue += amt;
          const ref = q.issueDate ?? q.createdAt;
          decisionDays.push(differenceInDays(q.updatedAt, ref));
        }
        else if (q.status === "EXPIRED") {
          expiredValue += amt;
        }
      }

      const decisions = (byStatusMap.get("ACCEPTED")?.count ?? 0) +
                        (byStatusMap.get("REJECTED")?.count ?? 0) +
                        (byStatusMap.get("EXPIRED")?.count ?? 0);
      const accepted = byStatusMap.get("ACCEPTED")?.count ?? 0;
      const winRate = decisions > 0 ? (accepted / decisions) * 100 : 0;
      const avgDecision = decisionDays.length > 0 ? decisionDays.reduce((a, b) => a + b, 0) / decisionDays.length : 0;
      const avgAccepted = acceptedAmounts.length > 0 ? acceptedAmounts.reduce((a, b) => a + b, 0) / acceptedAmounts.length : 0;

      const allStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];
      const byStatus = allStatuses.map(s => ({
        status: s,
        count:  byStatusMap.get(s)?.count ?? 0,
        amount: byStatusMap.get(s)?.amount ?? 0,
      }));

      return {
        inPreparation,
        activePipeline,
        wonValue,
        lostValue,
        expiredValue,
        winRate,
        avgQuoteValue:     avgAccepted,
        avgTimeToDecision: Math.round(avgDecision * 10) / 10,
        avgTimeToSend:     0, // quotation schema has no sentAt field
        byStatus,
      };
    }),

  // ─── Q-02 Conversion Funnel ────────────────────────────────────────────────
  conversionFunnel: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.array(z.object({
      stage:      z.string(),
      count:      z.number(),
      amount:     z.number(),
      dropOffPct: z.number(),
    })))
    .query(async ({ input, ctx }) => {
      const { from, to } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
      });

      const rows = await db
        .select({ status: quotation.status, amount: quotation.amount })
        .from(quotation)
        .where(and(
          gte(quotation.createdAt, from),
          lte(quotation.createdAt, to),
        ));

      const stages: Record<string, { count: number; amount: number }> = {
        DRAFT: { count: 0, amount: 0 },
        SENT:  { count: 0, amount: 0 },
        ACCEPTED: { count: 0, amount: 0 },
        REJECTED: { count: 0, amount: 0 },
        EXPIRED:  { count: 0, amount: 0 },
      };

      for (const q of rows) {
        const s = stages[q.status];
        if (s) { s.count += 1; s.amount += toNum(q.amount); }
      }

      const total = Object.values(stages).reduce((s, v) => s + v.count, 0);
      return Object.entries(stages).map(([stage, v]) => ({
        stage,
        count:      v.count,
        amount:     v.amount,
        dropOffPct: total > 0 ? ((total - v.count) / total) * 100 : 0,
      }));
    }),

  // ─── Q-03 Quotation List ───────────────────────────────────────────────────
  list: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:              z.string(),
        quotationNumber: z.string().nullable(),
        customerName:    z.string().nullable(),
        customerEmail:   z.string().nullable(),
        amount:          z.number(),
        currency:        z.string(),
        status:          z.string(),
        issueDate:       z.date().nullable(),
        createdBy:       z.string(),
        createdAt:       z.date(),
      })),
      total: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, quotationStatuses, page, pageSize } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
      });
      const offset = (page - 1) * pageSize;

      const rows = await db.query.quotation.findMany({
        where: and(
          gte(quotation.createdAt, from),
          lte(quotation.createdAt, to),
          quotationStatuses?.length ? inArray(quotation.status, quotationStatuses) : undefined,
        ),
        columns: {
          id: true, quotationNumber: true, customerName: true, customerEmail: true,
          amount: true, currency: true, status: true, issueDate: true,
          createdBy: true, createdAt: true,
        },
        orderBy: [desc(quotation.createdAt)],
        limit: pageSize,
        offset,
      });

      const [cntRow] = await db
        .select({ c: count() })
        .from(quotation)
        .where(and(
          gte(quotation.createdAt, from),
          lte(quotation.createdAt, to),
          quotationStatuses?.length ? inArray(quotation.status, quotationStatuses) : undefined,
        ));

      return {
        rows: rows.map(r => ({ ...r, amount: toNum(r.amount) })),
        total: Number(cntRow?.c ?? 0),
      };
    }),
});
