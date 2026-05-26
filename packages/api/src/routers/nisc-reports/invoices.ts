import { z } from "zod";
import { and, avg, count, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, sql, sum } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice, invoiceTransaction, creditNote, invoiceActivityLog } from "@npanel/db/schema/invoicing";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, toNum } from "./filters";
import { differenceInDays } from "date-fns";
import { buildReportEntityScope, resolveReportReadScope } from "./access";
import { invoiceIssuedInPeriod, INVOICE_REPORT_STATUSES } from "./metrics";

export const niscInvoicesRouter = router({
  // ─── I-01 Status Summary ───────────────────────────────────────────────────
  statusSummary: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.array(z.object({
      status: z.string(),
      count: z.number(),
      amount: z.number(),
      currency: z.string(),
    })))
    .query(async ({ input, ctx }) => {
      const { from, to, teamIds } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });

      const rows = await db
        .select({ status: invoice.status, amount: invoice.amount })
        .from(invoice)
        .where(and(
          invoiceIssuedInPeriod(from, to),
          buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
          }),
        ));

      const map = new Map<string, { count: number; amount: number }>();
      for (const r of rows) {
        const e = map.get(r.status) ?? { count: 0, amount: 0 };
        e.count += 1;
        e.amount += toNum(r.amount);
        map.set(r.status, e);
      }

      const allStatuses = [...INVOICE_REPORT_STATUSES];
      return allStatuses.map(status => ({
        status,
        count:  map.get(status)?.count  ?? 0,
        amount: map.get(status)?.amount ?? 0,
        currency: "KES",
      }));
    }),

  // ─── I-02 Invoice List ─────────────────────────────────────────────────────
  list: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:            z.string(),
        invoiceNumber: z.string().nullable(),
        teamName:      z.string().nullable(),
        amount:        z.number(),
        currency:      z.string(),
        status:        z.string(),
        issueDate:     z.date().nullable(),
        dueDate:       z.date().nullable(),
        paidAt:        z.date().nullable(),
        sentAt:        z.date().nullable(),
        createdBy:     z.string(),
        kraStatus:     z.string().nullable(),
        createdAt:     z.date(),
      })),
      total: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, teamIds, invoiceStatuses, page, pageSize } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });
      const offset = (page - 1) * pageSize;

      const rows = await db.query.invoice.findMany({
        where: and(
          invoiceIssuedInPeriod(from, to),
          buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
          }),
          invoiceStatuses?.length ? inArray(invoice.status, invoiceStatuses) : undefined,
        ),
        with: { team: { columns: { name: true } } },
        columns: {
          id: true, invoiceNumber: true, amount: true, currency: true, status: true,
          issueDate: true, dueDate: true, paidAt: true, sentAt: true,
          createdBy: true, kraStatus: true, createdAt: true, customerName: true,
        },
        orderBy: [desc(invoice.createdAt)],
        limit: pageSize,
        offset,
      });

      const [cntRow] = await db
        .select({ c: count() })
        .from(invoice)
        .where(and(
          invoiceIssuedInPeriod(from, to),
          buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
          }),
          invoiceStatuses?.length ? inArray(invoice.status, invoiceStatuses) : undefined,
        ));

      return {
        rows: rows.map(r => ({
          ...r,
          teamName: r.customerName || (r as any).team?.name || "No company",
          amount: toNum(r.amount),
        })),
        total: Number(cntRow?.c ?? 0),
      };
    }),

  // ─── I-03 Cycle Time ──────────────────────────────────────────────────────
  cycleTime: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      avgTimeInDraftDays:     z.number(),
      avgTimeToPay:           z.number(),
      paidOnTimePercent:      z.number(),
      currentlyInDraftCount:  z.number(),
      currentlyInDraftAmount: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, teamIds } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });

      const rows = await db
        .select({
          status:    invoice.status,
          createdAt: invoice.createdAt,
          sentAt:    invoice.sentAt,
          paidAt:    invoice.paidAt,
          dueDate:   invoice.dueDate,
          amount:    invoice.amount,
        })
        .from(invoice)
        .where(and(
          invoiceIssuedInPeriod(from, to),
          buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
          }),
        ));

      const draftDays: number[] = [];
      const payDays: number[] = [];
      let paidOnTime = 0, paidTotal = 0;
      let draftCount = 0, draftAmount = 0;

      for (const r of rows) {
        if (r.sentAt) draftDays.push(differenceInDays(r.sentAt, r.createdAt));
        if (r.status === "PAID" && r.paidAt && r.sentAt) {
          const days = differenceInDays(r.paidAt, r.sentAt);
          payDays.push(days);
          paidTotal += 1;
          if (r.dueDate && r.paidAt <= r.dueDate) paidOnTime += 1;
        }
        if (r.status === "DRAFT") {
          draftCount += 1;
          draftAmount += toNum(r.amount);
        }
      }

      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      return {
        avgTimeInDraftDays:     Math.round(avg(draftDays) * 10) / 10,
        avgTimeToPay:           Math.round(avg(payDays) * 10) / 10,
        paidOnTimePercent:      paidTotal > 0 ? (paidOnTime / paidTotal) * 100 : 0,
        currentlyInDraftCount:  draftCount,
        currentlyInDraftAmount: draftAmount,
      };
    }),

  // ─── I-04 Credit Notes ────────────────────────────────────────────────────
  creditNotes: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:           z.string(),
        creditNumber: z.string().nullable(),
        invoiceId:    z.string(),
        teamName:     z.string().nullable(),
        amount:       z.number(),
        currency:     z.string(),
        reason:       z.string().nullable(),
        status:       z.string(),
        issuedAt:     z.date().nullable(),
        appliedAt:    z.date().nullable(),
      })),
      totalIssued:  z.number(),
      totalApplied: z.number(),
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

      const rows = await db.query.creditNote.findMany({
        where: and(
          gte(creditNote.issuedAt, from),
          lte(creditNote.issuedAt, to),
          buildReportEntityScope({
            teamColumn: creditNote.teamId,
            teamIds: scope.teamIds,
          }),
        ),
        with: { team: { columns: { name: true } } },
        orderBy: [desc(creditNote.issuedAt)],
        limit: pageSize,
        offset,
      });

      // Aggregates
      const all = await db
        .select({ amount: creditNote.amount, appliedAt: creditNote.appliedAt })
        .from(creditNote)
        .where(and(
          gte(creditNote.issuedAt, from),
          lte(creditNote.issuedAt, to),
          buildReportEntityScope({
            teamColumn: creditNote.teamId,
            teamIds: scope.teamIds,
          }),
        ));

      let totalIssued = 0, totalApplied = 0;
      for (const r of all) {
        const amt = toNum(r.amount);
        totalIssued += amt;
        if (r.appliedAt) totalApplied += amt;
      }

      return {
        rows: rows.map(r => ({
          id: r.id,
          creditNumber: r.creditNumber,
          invoiceId: r.invoiceId,
          teamName: (r as any).team?.name ?? null,
          amount: toNum(r.amount),
          currency: r.currency,
          reason: r.reason,
          status: r.status,
          issuedAt: r.issuedAt,
          appliedAt: r.appliedAt,
        })),
        totalIssued,
        totalApplied,
        totalPending: totalIssued - totalApplied,
      };
    }),

  // ─── I-05 KRA Compliance ──────────────────────────────────────────────────
  kraCompliance: protectedProcedure
    .input(reportFiltersSchema)
    .output(z.object({
      rows: z.array(z.object({
        id:               z.string(),
        invoiceNumber:    z.string().nullable(),
        teamName:         z.string().nullable(),
        amount:           z.number(),
        currency:         z.string(),
        kraStatus:        z.string().nullable(),
        kraInvoiceNumber: z.string().nullable(),
        kraReceiptNumber: z.string().nullable(),
        kraError:         z.string().nullable(),
        kraVerifiedDate:  z.date().nullable(),
        issueDate:        z.date().nullable(),
      })),
      buckets: z.object({
        VERIFIED:      z.number(),
        PENDING:       z.number(),
        FAILED:        z.number(),
        NOT_SUBMITTED: z.number(),
      }),
    }))
    .query(async ({ input, ctx }) => {
      const { from, to, teamIds, page, pageSize } = input;
      const scope = await resolveReportReadScope({
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        requestedTeamIds: teamIds,
      });
      const offset = (page - 1) * pageSize;

      const bucketWhere = and(
        invoiceIssuedInPeriod(from, to),
        buildReportEntityScope({
          teamColumn: invoice.teamId,
          teamIds: scope.teamIds,
        }),
      );

      const bucketRows = await db
        .select({ status: invoice.status, kraStatus: invoice.kraStatus })
        .from(invoice)
        .where(bucketWhere);

      const buckets = { VERIFIED: 0, PENDING: 0, FAILED: 0, NOT_SUBMITTED: 0 };
      for (const r of bucketRows) {
        if (r.status === "CANCELLED") continue;
        if (r.kraStatus === "VERIFIED") buckets.VERIFIED += 1;
        else if (r.kraStatus === "PENDING") buckets.PENDING += 1;
        else if (r.kraStatus === "FAILED" || r.kraStatus === "ERROR") buckets.FAILED += 1;
        else buckets.NOT_SUBMITTED += 1;
      }

      const rows = await db.query.invoice.findMany({
        where: bucketWhere,
        with: { team: { columns: { name: true } } },
        columns: {
          id: true, invoiceNumber: true, amount: true, currency: true,
          kraStatus: true, kraInvoiceNumber: true, kraReceiptNumber: true,
          kraError: true, kraVerifiedDate: true, issueDate: true, status: true, customerName: true,
        },
        orderBy: [desc(invoice.createdAt)],
        limit: pageSize,
        offset,
      });

      return {
        rows: rows.map(r => ({
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          teamName: r.customerName || (r as any).team?.name || "No company",
          amount: toNum(r.amount),
          currency: r.currency,
          kraStatus: r.kraStatus,
          kraInvoiceNumber: r.kraInvoiceNumber,
          kraReceiptNumber: r.kraReceiptNumber,
          kraError: r.kraError,
          kraVerifiedDate: r.kraVerifiedDate,
          issueDate: r.issueDate,
        })),
        buckets,
      };
    }),
});
