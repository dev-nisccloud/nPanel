import { z } from "zod";
import { and, count, desc, eq, gte, inArray, isNotNull, lt, lte, notInArray, sql, sum } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice, invoiceTransaction, creditNote } from "@npanel/db/schema/invoicing";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, toNum } from "./filters";
import { differenceInDays } from "date-fns";
import { team } from "@npanel/db/schema/teams";
import { buildOwnerOrTeamReadScope, resolveReportReadScope } from "./access";
// ─── R-01: Revenue Overview KPIs ─────────────────────────────────────────────
const overviewOutput = z.object({
    totalInvoiced: z.number(),
    byStatus: z.array(z.object({ status: z.string(), count: z.number(), amount: z.number() })),
    collected: z.number(),
    billedUnpaid: z.number(),
    inDraft: z.number(),
    netCollected: z.number(),
    outstanding: z.number(),
    taxCollected: z.number(),
    avgInvoiceValue: z.number(),
    paymentRate: z.number(),
    currency: z.string(),
});
// ─── R-02: Revenue Trend ─────────────────────────────────────────────────────
const trendRow = z.object({
    period: z.string(),
    invoiced: z.number(),
    collected: z.number(),
    overdue: z.number(),
    draft: z.number(),
    creditNotes: z.number(),
    invoiceCount: z.number(),
});
// ─── R-03: Revenue by Client ─────────────────────────────────────────────────
const clientRevenueRow = z.object({
    teamId: z.string(),
    teamName: z.string(),
    totalInvoiced: z.number(),
    totalCollected: z.number(),
    outstanding: z.number(),
    overdueAmount: z.number(),
    invoiceCount: z.number(),
    lastInvoiceDate: z.date().nullable(),
    avgDaysToPay: z.number(),
    currency: z.string(),
});
// ─── R-05 / R-06: A/R Aging ──────────────────────────────────────────────────
const agingBucket = z.object({ count: z.number(), amount: z.number() });
const agingOutput = z.object({
    current: agingBucket,
    days1_30: agingBucket,
    days31_60: agingBucket,
    days61_90: agingBucket,
    days91_120: agingBucket,
    days120plus: agingBucket,
    total: agingBucket,
});
const outstandingInvoiceRow = z.object({
    id: z.string(),
    invoiceNumber: z.string().nullable(),
    teamName: z.string().nullable(),
    issueDate: z.date().nullable(),
    dueDate: z.date().nullable(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    daysOverdue: z.number(),
});
export const niscRevenueRouter = router({
    // ─── R-01 Overview ─────────────────────────────────────────────────────────
    overview: protectedProcedure
        .input(reportFiltersSchema)
        .output(overviewOutput)
        .query(async ({ input, ctx }) => {
        const { from, to, teamIds, invoiceStatuses } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: teamIds,
        });
        const now = new Date();
        // All invoices in period
        const whereBase = and(gte(invoice.createdAt, from), lte(invoice.createdAt, to), buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(invoice.createdBy, scope.userId),
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        }), invoiceStatuses?.length ? inArray(invoice.status, invoiceStatuses) : undefined);
        const allInvoices = await db
            .select({ status: invoice.status, amount: invoice.amount, tax: invoice.tax, currency: invoice.currency })
            .from(invoice)
            .where(whereBase);
        const byStatusMap = new Map();
        let totalInvoiced = 0;
        let inDraft = 0;
        let billedUnpaid = 0;
        let taxCollected = 0;
        for (const inv of allInvoices) {
            const amt = toNum(inv.amount);
            totalInvoiced += amt;
            const e = byStatusMap.get(inv.status) ?? { count: 0, amount: 0 };
            e.count += 1;
            e.amount += amt;
            byStatusMap.set(inv.status, e);
            if (inv.status === "DRAFT")
                inDraft += amt;
            if (inv.status === "SENT" || inv.status === "OVERDUE" || inv.status === "PARTIALLY_PAID")
                billedUnpaid += amt;
            if (inv.status === "PAID")
                taxCollected += toNum(inv.tax);
        }
        const byStatus = Array.from(byStatusMap.entries()).map(([status, v]) => ({ status, ...v }));
        // Collected cash = sum of COMPLETED invoice_transaction.amount in period
        const txRows = await db
            .select({ amount: invoiceTransaction.amount })
            .from(invoiceTransaction)
            .where(and(eq(invoiceTransaction.status, "COMPLETED"), gte(invoiceTransaction.paidAt, from), lte(invoiceTransaction.paidAt, to)));
        const collected = txRows.reduce((a, r) => a + toNum(r.amount), 0);
        // Credit notes applied in period
        const cnRows = await db
            .select({ amount: creditNote.amount })
            .from(creditNote)
            .where(and(isNotNull(creditNote.appliedAt), gte(creditNote.appliedAt, from), lte(creditNote.appliedAt, to), buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(creditNote.createdBy, scope.userId),
            teamColumn: creditNote.teamId,
            teamIds: scope.teamIds,
        })));
        const creditNoteTotal = cnRows.reduce((a, r) => a + toNum(r.amount), 0);
        // Outstanding (SENT + OVERDUE with dueDate < now)
        const overdueRows = await db
            .select({ amount: invoice.amount })
            .from(invoice)
            .where(and(inArray(invoice.status, ["SENT", "OVERDUE"]), lt(invoice.dueDate, now), buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(invoice.createdBy, scope.userId),
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        })));
        const outstanding = overdueRows.reduce((s, r) => s + toNum(r.amount), 0);
        const nonCancelledCount = allInvoices.filter(i => i.status !== "CANCELLED").length;
        const sentCount = allInvoices.filter(i => i.status === "SENT").length;
        const paidCount = allInvoices.filter(i => i.status === "PAID").length;
        return {
            totalInvoiced,
            byStatus,
            collected,
            billedUnpaid,
            inDraft,
            netCollected: Math.max(0, collected - creditNoteTotal),
            outstanding,
            taxCollected,
            avgInvoiceValue: nonCancelledCount > 0 ? totalInvoiced / nonCancelledCount : 0,
            paymentRate: sentCount > 0 ? (paidCount / sentCount) * 100 : 0,
            currency: "KES",
        };
    }),
    // ─── R-02 Trend ────────────────────────────────────────────────────────────
    trend: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.array(trendRow))
        .query(async ({ input, ctx }) => {
        const { from, to, granularity, teamIds } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: teamIds,
        });
        const invoices = await db
            .select({
            createdAt: invoice.createdAt,
            amount: invoice.amount,
            status: invoice.status,
            paidAt: invoice.paidAt,
            dueDate: invoice.dueDate,
        })
            .from(invoice)
            .where(and(gte(invoice.createdAt, from), lte(invoice.createdAt, to), buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(invoice.createdBy, scope.userId),
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        })));
        // Credit notes in period
        const creditNotes = await db
            .select({ amount: creditNote.amount, issuedAt: creditNote.issuedAt })
            .from(creditNote)
            .where(and(gte(creditNote.issuedAt, from), lte(creditNote.issuedAt, to), buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(creditNote.createdBy, scope.userId),
            teamColumn: creditNote.teamId,
            teamIds: scope.teamIds,
        })));
        // Build per-period buckets
        const getKey = (d) => {
            if (granularity === "DAILY")
                return d.toISOString().slice(0, 10);
            if (granularity === "WEEKLY") {
                const week = Math.ceil(d.getDate() / 7);
                return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
            }
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        };
        const buckets = new Map();
        const now = new Date();
        for (const inv of invoices) {
            const key = getKey(inv.createdAt);
            const b = buckets.get(key) ?? { invoiced: 0, collected: 0, overdue: 0, draft: 0, creditNotes: 0, invoiceCount: 0 };
            const amt = toNum(inv.amount);
            b.invoiced += amt;
            b.invoiceCount += 1;
            if (inv.status === "PAID")
                b.collected += amt;
            if (inv.status === "DRAFT")
                b.draft += amt;
            if ((inv.status === "OVERDUE" || inv.status === "SENT") && inv.dueDate && inv.dueDate < now)
                b.overdue += amt;
            buckets.set(key, b);
        }
        for (const cn of creditNotes) {
            if (!cn.issuedAt)
                continue;
            const key = getKey(cn.issuedAt);
            const b = buckets.get(key) ?? { invoiced: 0, collected: 0, overdue: 0, draft: 0, creditNotes: 0, invoiceCount: 0 };
            b.creditNotes += toNum(cn.amount);
            buckets.set(key, b);
        }
        return Array.from(buckets.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, v]) => ({ period, ...v }));
    }),
    // ─── R-03 By Client ────────────────────────────────────────────────────────
    byClient: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.array(clientRevenueRow))
        .query(async ({ input, ctx }) => {
        const { from, to, teamIds } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: teamIds,
        });
        const now = new Date();
        const invoices = await db.query.invoice.findMany({
            where: and(gte(invoice.createdAt, from), lte(invoice.createdAt, to), buildOwnerOrTeamReadScope({
                isAgencyUser: scope.isAgencyUser,
                ownerCondition: eq(invoice.createdBy, scope.userId),
                teamColumn: invoice.teamId,
                teamIds: scope.teamIds,
            })),
            with: { team: { columns: { id: true, name: true } } },
            columns: { id: true, teamId: true, amount: true, status: true, dueDate: true, paidAt: true, sentAt: true, createdAt: true, invoiceNumber: true, currency: true, customerName: true, issueDate: true },
        });
        const clientMap = new Map();
        for (const inv of invoices) {
            const tid = inv.teamId ?? "__no_team__";
            const name = inv.customerName || inv.team?.name || "No company";
            const amt = toNum(inv.amount);
            const entry = clientMap.get(tid) ?? {
                teamName: name, totalInvoiced: 0, totalCollected: 0, outstanding: 0,
                overdueAmount: 0, invoiceCount: 0, lastInvoiceDate: null, daysToPay: [], currency: inv.currency,
            };
            entry.invoiceCount += 1;
            entry.totalInvoiced += amt;
            if (!entry.lastInvoiceDate || inv.createdAt > entry.lastInvoiceDate)
                entry.lastInvoiceDate = inv.createdAt;
            if (inv.status === "PAID") {
                entry.totalCollected += amt;
                const start = inv.sentAt ?? inv.issueDate ?? inv.createdAt;
                if (inv.paidAt && start)
                    entry.daysToPay.push(differenceInDays(inv.paidAt, start));
            }
            if (inv.status === "SENT" || inv.status === "OVERDUE" || inv.status === "PARTIALLY_PAID") {
                entry.outstanding += amt;
                if (inv.status === "OVERDUE" || (inv.dueDate && inv.dueDate < now))
                    entry.overdueAmount += amt;
            }
            clientMap.set(tid, entry);
        }
        return Array.from(clientMap.entries())
            .map(([teamId, v]) => ({
            teamId,
            teamName: v.teamName,
            totalInvoiced: v.totalInvoiced,
            totalCollected: v.totalCollected,
            outstanding: v.outstanding,
            overdueAmount: v.overdueAmount,
            invoiceCount: v.invoiceCount,
            lastInvoiceDate: v.lastInvoiceDate,
            avgDaysToPay: v.daysToPay.length > 0 ? v.daysToPay.reduce((a, b) => a + b, 0) / v.daysToPay.length : 0,
            currency: v.currency,
        }))
            .sort((a, b) => b.totalInvoiced - a.totalInvoiced);
    }),
    // ─── R-04 By Category ──────────────────────────────────────────────────────
    byCategory: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.array(z.object({
        category: z.string(),
        totalInvoiced: z.number(),
        totalCollected: z.number(),
        inDraft: z.number(),
        invoiceCount: z.number(),
    })))
        .query(async ({ input, ctx }) => {
        const { from, to } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
        });
        // Invoice data grouped by category from line items / subscriptions is complex  
        // for now we return a flat breakdown by invoice status as a proxy
        const invoices = await db
            .select({ status: invoice.status, amount: invoice.amount })
            .from(invoice)
            .where(and(gte(invoice.createdAt, from), lte(invoice.createdAt, to), buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(invoice.createdBy, scope.userId),
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        })));
        // Simplified: one "Invoices" category   will be expanded when order → subscription link is added
        let totalInvoiced = 0, totalCollected = 0, inDraft = 0, invoiceCount = 0;
        for (const inv of invoices) {
            const amt = toNum(inv.amount);
            totalInvoiced += amt;
            invoiceCount += 1;
            if (inv.status === "PAID")
                totalCollected += amt;
            if (inv.status === "DRAFT")
                inDraft += amt;
        }
        return [{ category: "ALL", totalInvoiced, totalCollected, inDraft, invoiceCount }];
    }),
    // ─── R-05 A/R Aging ────────────────────────────────────────────────────────
    aging: protectedProcedure
        .input(reportFiltersSchema)
        .output(agingOutput)
        .query(async ({ input, ctx }) => {
        const { teamIds } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: teamIds,
        });
        const now = new Date();
        const outstandingInvs = await db
            .select({ amount: invoice.amount, dueDate: invoice.dueDate })
            .from(invoice)
            .where(and(inArray(invoice.status, ["SENT", "OVERDUE", "PARTIALLY_PAID"]), buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(invoice.createdBy, scope.userId),
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        })));
        const buckets = {
            current: { count: 0, amount: 0 },
            days1_30: { count: 0, amount: 0 },
            days31_60: { count: 0, amount: 0 },
            days61_90: { count: 0, amount: 0 },
            days91_120: { count: 0, amount: 0 },
            days120plus: { count: 0, amount: 0 },
            total: { count: 0, amount: 0 },
        };
        for (const inv of outstandingInvs) {
            const amt = toNum(inv.amount);
            buckets.total.count += 1;
            buckets.total.amount += amt;
            if (!inv.dueDate || inv.dueDate >= now) {
                buckets.current.count += 1;
                buckets.current.amount += amt;
            }
            else {
                const days = differenceInDays(now, inv.dueDate);
                if (days <= 30) {
                    buckets.days1_30.count += 1;
                    buckets.days1_30.amount += amt;
                }
                else if (days <= 60) {
                    buckets.days31_60.count += 1;
                    buckets.days31_60.amount += amt;
                }
                else if (days <= 90) {
                    buckets.days61_90.count += 1;
                    buckets.days61_90.amount += amt;
                }
                else if (days <= 120) {
                    buckets.days91_120.count += 1;
                    buckets.days91_120.amount += amt;
                }
                else {
                    buckets.days120plus.count += 1;
                    buckets.days120plus.amount += amt;
                }
            }
        }
        return buckets;
    }),
    // ─── R-06 Outstanding List ─────────────────────────────────────────────────
    outstandingList: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.object({ rows: z.array(outstandingInvoiceRow), total: z.number() }))
        .query(async ({ input, ctx }) => {
        const { teamIds, invoiceStatuses, page, pageSize } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: teamIds,
        });
        const now = new Date();
        const statuses = invoiceStatuses?.length ? invoiceStatuses : ["SENT", "OVERDUE", "PARTIALLY_PAID"];
        const offset = (page - 1) * pageSize;
        const rows = await db.query.invoice.findMany({
            where: and(inArray(invoice.status, statuses), buildOwnerOrTeamReadScope({
                isAgencyUser: scope.isAgencyUser,
                ownerCondition: eq(invoice.createdBy, scope.userId),
                teamColumn: invoice.teamId,
                teamIds: scope.teamIds,
            })),
            with: { team: { columns: { name: true } } },
            columns: { id: true, invoiceNumber: true, amount: true, currency: true, status: true, issueDate: true, dueDate: true, customerName: true },
            orderBy: [desc(invoice.dueDate)],
            limit: pageSize,
            offset,
        });
        const [cntRow] = await db
            .select({ c: count() })
            .from(invoice)
            .where(and(inArray(invoice.status, statuses), buildOwnerOrTeamReadScope({
            isAgencyUser: scope.isAgencyUser,
            ownerCondition: eq(invoice.createdBy, scope.userId),
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        })));
        return {
            rows: rows.map(inv => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                teamName: inv.customerName || inv.team?.name || "No company",
                issueDate: inv.issueDate,
                dueDate: inv.dueDate,
                amount: toNum(inv.amount),
                currency: inv.currency,
                status: inv.status,
                daysOverdue: inv.dueDate && inv.dueDate < now ? differenceInDays(now, inv.dueDate) : 0,
            })),
            total: Number(cntRow?.c ?? 0),
        };
    }),
});
