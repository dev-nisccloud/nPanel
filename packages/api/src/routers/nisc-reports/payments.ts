import { z } from "zod";
import { and, count, desc, eq, gt, gte, inArray, lte, sql, sum } from "@npanel/db";
import { db } from "@npanel/db";
import { invoiceTransaction } from "@npanel/db/schema/invoicing";
import { paymentTransaction } from "@npanel/db/schema/payment-transactions";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, toNum } from "./filters";
import { differenceInMinutes } from "date-fns";

export const niscPaymentsRouter = router({
  // ─── PY-01 Payment Method Breakdown ───────────────────────────────────────
  methodBreakdown: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.array(z.object({
      method:         z.string(),
      count:          z.number(),
      amount:         z.number(),
      percentOfTotal: z.number(),
    })))
    .query(async ({ input }) => {
      const { from, to } = input;

      const rows = await db
        .select({ method: invoiceTransaction.method, amount: invoiceTransaction.amount })
        .from(invoiceTransaction)
        .where(and(
          eq(invoiceTransaction.status, "COMPLETED"),
          gte(invoiceTransaction.paidAt, from),
          lte(invoiceTransaction.paidAt, to),
        ));

      const map = new Map<string, { count: number; amount: number }>();
      let grandTotal = 0;
      for (const r of rows) {
        const amt = toNum(r.amount);
        const e = map.get(r.method) ?? { count: 0, amount: 0 };
        e.count += 1; e.amount += amt;
        map.set(r.method, e);
        grandTotal += amt;
      }

      return Array.from(map.entries())
        .map(([method, v]) => ({
          method,
          count: v.count,
          amount: v.amount,
          percentOfTotal: grandTotal > 0 ? (v.amount / grandTotal) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    }),

  // ─── PY-02 Gateway Performance ────────────────────────────────────────────
  gatewayPerf: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.array(z.object({
      gateway:             z.string(),
      totalInitiated:      z.number(),
      totalCompleted:      z.number(),
      totalFailed:         z.number(),
      totalRefunded:       z.number(),
      successRate:         z.number(),
      avgProcessingMinutes:z.number(),
    })))
    .query(async ({ input }) => {
      const { from, to } = input;

      const rows = await db
        .select({
          gateway:     paymentTransaction.gateway,
          status:      paymentTransaction.status,
          initiatedAt: paymentTransaction.initiatedAt,
          processedAt: paymentTransaction.processedAt,
        })
        .from(paymentTransaction)
        .where(and(
          gte(paymentTransaction.initiatedAt, from),
          lte(paymentTransaction.initiatedAt, to),
        ));

      const map = new Map<string, {
        total: number; completed: number; failed: number; refunded: number; processingMinutes: number[];
      }>();

      for (const r of rows) {
        const e = map.get(r.gateway) ?? { total: 0, completed: 0, failed: 0, refunded: 0, processingMinutes: [] };
        e.total += 1;
        if (r.status === "COMPLETED") {
          e.completed += 1;
          if (r.processedAt) e.processingMinutes.push(differenceInMinutes(r.processedAt, r.initiatedAt));
        }
        if (r.status === "FAILED") e.failed += 1;
        if (r.status === "REFUNDED") e.refunded += 1;
        map.set(r.gateway, e);
      }

      return Array.from(map.entries()).map(([gateway, v]) => ({
        gateway,
        totalInitiated: v.total,
        totalCompleted: v.completed,
        totalFailed: v.failed,
        totalRefunded: v.refunded,
        successRate: v.total > 0 ? (v.completed / v.total) * 100 : 0,
        avgProcessingMinutes: v.processingMinutes.length > 0
          ? v.processingMinutes.reduce((a, b) => a + b, 0) / v.processingMinutes.length : 0,
      }));
    }),

  // ─── PY-03 Failed / Pending Transactions ─────────────────────────────────
  failedPending: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:          z.string(),
        teamName:    z.string().nullable(),
        gateway:     z.string(),
        amount:      z.number(),
        currency:    z.string(),
        status:      z.string(),
        initiatedAt: z.date(),
        phoneNumber: z.string().nullable(),
        flagged:     z.boolean(),
      })),
      total: z.number(),
    }))
    .query(async ({ input }) => {
      const { from, to, teamIds, page, pageSize } = input;
      const offset = (page - 1) * pageSize;
      const now = new Date();
      const threshold24h = new Date(now.getTime() - 24 * 3600000);

      const rows = await db.query.paymentTransaction.findMany({
        where: and(
          inArray(paymentTransaction.status, ["PENDING", "FAILED"]),
          gte(paymentTransaction.initiatedAt, from),
          lte(paymentTransaction.initiatedAt, to),
          teamIds?.length ? inArray(paymentTransaction.teamId, teamIds) : undefined,
        ),
        with: { team: { columns: { name: true } } },
        orderBy: [desc(paymentTransaction.initiatedAt)],
        limit: pageSize,
        offset,
      });

      const [cntRow] = await db
        .select({ c: count() })
        .from(paymentTransaction)
        .where(and(
          inArray(paymentTransaction.status, ["PENDING", "FAILED"]),
          gte(paymentTransaction.initiatedAt, from),
          lte(paymentTransaction.initiatedAt, to),
        ));

      return {
        rows: rows.map(r => ({
          id: r.id,
          teamName: (r as any).team?.name ?? null,
          gateway: r.gateway,
          amount: toNum(r.amount),
          currency: r.currency,
          status: r.status,
          initiatedAt: r.initiatedAt,
          phoneNumber: r.phoneNumber,
          flagged: r.status === "PENDING" && r.initiatedAt < threshold24h,
        })),
        total: Number(cntRow?.c ?? 0),
      };
    }),

  // ─── PY-04 Refund Report ──────────────────────────────────────────────────
  refunds: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:            z.string(),
        teamName:      z.string().nullable(),
        amount:        z.number(),
        currency:      z.string(),
        gateway:       z.string(),
        refundedAt:    z.date().nullable(),
        receiptNumber: z.string().nullable(),
      })),
      totalRefunded: z.number(),
    }))
    .query(async ({ input }) => {
      const { from, to, teamIds, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const rows = await db.query.paymentTransaction.findMany({
        where: and(
          eq(paymentTransaction.status, "REFUNDED"),
          gte(paymentTransaction.initiatedAt, from),
          lte(paymentTransaction.initiatedAt, to),
          teamIds?.length ? inArray(paymentTransaction.teamId, teamIds) : undefined,
        ),
        with: { team: { columns: { name: true } } },
        orderBy: [desc(paymentTransaction.refundedAt)],
        limit: pageSize,
        offset,
      });

      const all = await db
        .select({ amount: paymentTransaction.amount })
        .from(paymentTransaction)
        .where(and(
          eq(paymentTransaction.status, "REFUNDED"),
          gte(paymentTransaction.initiatedAt, from),
          lte(paymentTransaction.initiatedAt, to),
        ));
      const totalRefunded = all.reduce((s, r) => s + toNum(r.amount), 0);

      return {
        rows: rows.map(r => ({
          id: r.id,
          teamName: (r as any).team?.name ?? null,
          amount: toNum(r.amount),
          currency: r.currency,
          gateway: r.gateway,
          refundedAt: r.refundedAt,
          receiptNumber: r.receiptNumber,
        })),
        totalRefunded,
      };
    }),
});
