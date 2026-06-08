import { z } from "zod";
import { and, count, desc, eq, gte, inArray, isNotNull, lt, lte } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice, invoiceTransaction, creditNote } from "@npanel/db/schema/invoicing";
import { niscOrder, niscOrderItem } from "@npanel/db/schema/nisc-orders";
import { niscProduct } from "@npanel/db/schema/products";
import { protectedProcedure, router } from "../../trpc";
import { reportFiltersSchema, toNum } from "./filters";
import { differenceInDays } from "date-fns";
import { buildReportEntityScope, resolveReportReadScope } from "./access";
import { OPEN_AR_STATUSES, fetchCompletedPaymentsByInvoice, invoiceIssuedInPeriod, invoiceOutstandingAmount, sumCollectedCash, } from "./metrics";
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
const trendRow = z.object({
    period: z.string(),
    invoiced: z.number(),
    collected: z.number(),
    overdue: z.number(),
    draft: z.number(),
    creditNotes: z.number(),
    invoiceCount: z.number(),
});
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
        const entityScope = buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        });
        const allInvoices = await db
            .select({
            id: invoice.id,
            status: invoice.status,
            amount: invoice.amount,
            tax: invoice.tax,
            creditedAmount: invoice.creditedAmount,
            dueDate: invoice.dueDate,
        })
            .from(invoice)
            .where(and(invoiceIssuedInPeriod(from, to), entityScope, invoiceStatuses?.length ? inArray(invoice.status, invoiceStatuses) : undefined));
        const paidByInvoice = await fetchCompletedPaymentsByInvoice(allInvoices.map(i => i.id));
        const byStatusMap = new Map();
        let totalInvoiced = 0;
        let inDraft = 0;
        let billedUnpaid = 0;
        let taxCollected = 0;
        let billedCount = 0;
        let paidCount = 0;
        for (const inv of allInvoices) {
            const amt = toNum(inv.amount);
            const paid = paidByInvoice.get(inv.id) ?? 0;
            const due = invoiceOutstandingAmount(inv, paid);
            totalInvoiced += amt;
            const e = byStatusMap.get(inv.status) ?? { count: 0, amount: 0 };
            e.count += 1;
            e.amount += amt;
            byStatusMap.set(inv.status, e);
            if (inv.status === "DRAFT")
                inDraft += amt;
            if (OPEN_AR_STATUSES.includes(inv.status)) {
                billedUnpaid += due;
            }
            if (inv.status === "PAID") {
                taxCollected += toNum(inv.tax);
                paidCount += 1;
            }
            if (["SENT", "OVERDUE", "PARTIALLY_PAID", "PAID"].includes(inv.status)) {
                billedCount += 1;
            }
        }
        const collected = await sumCollectedCash({ from, to, scope });
        const cnRows = await db
            .select({ amount: creditNote.amount })
            .from(creditNote)
            .where(and(isNotNull(creditNote.appliedAt), gte(creditNote.appliedAt, from), lte(creditNote.appliedAt, to), buildReportEntityScope({
            teamColumn: creditNote.teamId,
            teamIds: scope.teamIds,
        })));
        const creditNoteTotal = cnRows.reduce((a, r) => a + toNum(r.amount), 0);
        const openArInvoices = await db
            .select({
            id: invoice.id,
            status: invoice.status,
            amount: invoice.amount,
            creditedAmount: invoice.creditedAmount,
            dueDate: invoice.dueDate,
        })
            .from(invoice)
            .where(and(inArray(invoice.status, [...OPEN_AR_STATUSES]), lt(invoice.dueDate, now), entityScope));
        const openPaid = await fetchCompletedPaymentsByInvoice(openArInvoices.map(i => i.id));
        let outstanding = 0;
        for (const inv of openArInvoices) {
            outstanding += invoiceOutstandingAmount(inv, openPaid.get(inv.id) ?? 0);
        }
        const nonCancelledCount = allInvoices.filter(i => i.status !== "CANCELLED").length;
        return {
            totalInvoiced,
            byStatus: Array.from(byStatusMap.entries()).map(([status, v]) => ({ status, ...v })),
            collected,
            billedUnpaid,
            inDraft,
            netCollected: Math.max(0, collected - creditNoteTotal),
            outstanding,
            taxCollected,
            avgInvoiceValue: nonCancelledCount > 0 ? totalInvoiced / nonCancelledCount : 0,
            paymentRate: billedCount > 0 ? (paidCount / billedCount) * 100 : 0,
            currency: "KES",
        };
    }),
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
        const entityScope = buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        });
        const now = new Date();
        const invoices = await db
            .select({
            issueDate: invoice.issueDate,
            createdAt: invoice.createdAt,
            amount: invoice.amount,
            status: invoice.status,
            dueDate: invoice.dueDate,
            creditedAmount: invoice.creditedAmount,
            paidAt: invoice.paidAt,
            id: invoice.id,
        })
            .from(invoice)
            .where(and(invoiceIssuedInPeriod(from, to), entityScope));
        const paidByInvoice = await fetchCompletedPaymentsByInvoice(invoices.map(i => i.id));
        const txRows = await db
            .select({
            invoiceId: invoiceTransaction.invoiceId,
            amount: invoiceTransaction.amount,
            paidAt: invoiceTransaction.paidAt,
        })
            .from(invoiceTransaction)
            .innerJoin(invoice, eq(invoiceTransaction.invoiceId, invoice.id))
            .where(and(eq(invoiceTransaction.status, "COMPLETED"), isNotNull(invoiceTransaction.paidAt), gte(invoiceTransaction.paidAt, from), lte(invoiceTransaction.paidAt, to), entityScope));
        const creditNotes = await db
            .select({ amount: creditNote.amount, appliedAt: creditNote.appliedAt })
            .from(creditNote)
            .where(and(isNotNull(creditNote.appliedAt), gte(creditNote.appliedAt, from), lte(creditNote.appliedAt, to), buildReportEntityScope({
            teamColumn: creditNote.teamId,
            teamIds: scope.teamIds,
        })));
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
        for (const inv of invoices) {
            const ref = inv.issueDate ?? inv.createdAt;
            const key = getKey(ref);
            const b = buckets.get(key) ?? { invoiced: 0, collected: 0, overdue: 0, draft: 0, creditNotes: 0, invoiceCount: 0 };
            const amt = toNum(inv.amount);
            const paid = paidByInvoice.get(inv.id) ?? 0;
            const due = invoiceOutstandingAmount(inv, paid);
            b.invoiced += amt;
            b.invoiceCount += 1;
            if (inv.status === "DRAFT")
                b.draft += amt;
            if (OPEN_AR_STATUSES.includes(inv.status) &&
                inv.dueDate &&
                inv.dueDate < now) {
                b.overdue += due;
            }
            buckets.set(key, b);
        }
        const txTotalsByInvoice = new Map();
        for (const tx of txRows) {
            if (!tx.paidAt)
                continue;
            const key = getKey(tx.paidAt);
            const b = buckets.get(key) ?? { invoiced: 0, collected: 0, overdue: 0, draft: 0, creditNotes: 0, invoiceCount: 0 };
            b.collected += toNum(tx.amount);
            buckets.set(key, b);
            txTotalsByInvoice.set(tx.invoiceId, (txTotalsByInvoice.get(tx.invoiceId) ?? 0) + toNum(tx.amount));
        }
        for (const inv of invoices) {
            if (inv.status !== "PAID" || !inv.paidAt || inv.paidAt < from || inv.paidAt > to)
                continue;
            const txPaid = txTotalsByInvoice.get(inv.id) ?? 0;
            const gap = Math.max(0, toNum(inv.amount) - txPaid);
            if (gap <= 0)
                continue;
            const key = getKey(inv.paidAt);
            const b = buckets.get(key) ?? { invoiced: 0, collected: 0, overdue: 0, draft: 0, creditNotes: 0, invoiceCount: 0 };
            b.collected += gap;
            buckets.set(key, b);
        }
        for (const cn of creditNotes) {
            if (!cn.appliedAt)
                continue;
            const key = getKey(cn.appliedAt);
            const b = buckets.get(key) ?? { invoiced: 0, collected: 0, overdue: 0, draft: 0, creditNotes: 0, invoiceCount: 0 };
            b.creditNotes += toNum(cn.amount);
            buckets.set(key, b);
        }
        return Array.from(buckets.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, v]) => ({ period, ...v }));
    }),
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
        const entityScope = buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        });
        const invoices = await db.query.invoice.findMany({
            where: and(invoiceIssuedInPeriod(from, to), entityScope),
            with: { team: { columns: { id: true, name: true } } },
            columns: {
                id: true, teamId: true, amount: true, status: true, dueDate: true,
                paidAt: true, sentAt: true, createdAt: true, issueDate: true,
                currency: true, customerName: true, creditedAmount: true,
            },
        });
        const paidByInvoice = await fetchCompletedPaymentsByInvoice(invoices.map(i => i.id));
        const txInPeriod = await db
            .select({ invoiceId: invoiceTransaction.invoiceId, amount: invoiceTransaction.amount })
            .from(invoiceTransaction)
            .innerJoin(invoice, eq(invoiceTransaction.invoiceId, invoice.id))
            .where(and(eq(invoiceTransaction.status, "COMPLETED"), gte(invoiceTransaction.paidAt, from), lte(invoiceTransaction.paidAt, to), entityScope));
        const collectedInPeriodByInvoice = new Map();
        for (const tx of txInPeriod) {
            collectedInPeriodByInvoice.set(tx.invoiceId, (collectedInPeriodByInvoice.get(tx.invoiceId) ?? 0) + toNum(tx.amount));
        }
        for (const inv of invoices) {
            if (inv.status === "PAID" &&
                inv.paidAt &&
                inv.paidAt >= from &&
                inv.paidAt <= to) {
                const txCol = collectedInPeriodByInvoice.get(inv.id) ?? 0;
                const full = toNum(inv.amount);
                if (txCol < full) {
                    collectedInPeriodByInvoice.set(inv.id, full);
                }
            }
        }
        const clientMap = new Map();
        for (const inv of invoices) {
            const tid = inv.teamId ?? "__no_team__";
            const name = inv.customerName || inv.team?.name || "No company";
            const amt = toNum(inv.amount);
            const paid = paidByInvoice.get(inv.id) ?? 0;
            const due = invoiceOutstandingAmount(inv, paid);
            const issued = inv.issueDate ?? inv.createdAt;
            const entry = clientMap.get(tid) ?? {
                teamName: name, totalInvoiced: 0, totalCollected: 0, outstanding: 0,
                overdueAmount: 0, invoiceCount: 0, lastInvoiceDate: null, daysToPay: [], currency: inv.currency,
            };
            entry.invoiceCount += 1;
            entry.totalInvoiced += amt;
            entry.totalCollected += collectedInPeriodByInvoice.get(inv.id) ?? 0;
            if (!entry.lastInvoiceDate || issued > entry.lastInvoiceDate)
                entry.lastInvoiceDate = issued;
            if (OPEN_AR_STATUSES.includes(inv.status)) {
                entry.outstanding += due;
                if (inv.status === "OVERDUE" || (inv.dueDate && inv.dueDate < now)) {
                    entry.overdueAmount += due;
                }
            }
            if (inv.status === "PAID" && inv.paidAt) {
                const start = inv.sentAt ?? inv.issueDate ?? inv.createdAt;
                if (start)
                    entry.daysToPay.push(differenceInDays(inv.paidAt, start));
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
        const { from, to, teamIds } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: teamIds,
        });
        const entityScope = buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        });
        const invoices = await db
            .select({ id: invoice.id, status: invoice.status, amount: invoice.amount })
            .from(invoice)
            .where(and(invoiceIssuedInPeriod(from, to), entityScope));
        const orderLinks = await db
            .select({
            invoiceId: niscOrder.invoiceId,
            category: niscProduct.category,
            itemSubtotal: niscOrderItem.itemSubtotal,
        })
            .from(niscOrder)
            .innerJoin(niscOrderItem, eq(niscOrderItem.niscOrderId, niscOrder.id))
            .innerJoin(niscProduct, eq(niscOrderItem.productId, niscProduct.id))
            .where(isNotNull(niscOrder.invoiceId));
        const invoiceCategory = new Map();
        const categoryWeight = new Map();
        for (const row of orderLinks) {
            if (!row.invoiceId)
                continue;
            const weight = toNum(row.itemSubtotal);
            const perInv = categoryWeight.get(row.invoiceId) ?? new Map();
            perInv.set(row.category, (perInv.get(row.category) ?? 0) + weight);
            categoryWeight.set(row.invoiceId, perInv);
        }
        for (const [invId, weights] of categoryWeight) {
            let best = "MANUAL";
            let bestW = -1;
            for (const [cat, w] of weights) {
                if (w > bestW) {
                    bestW = w;
                    best = cat;
                }
            }
            invoiceCategory.set(invId, best);
        }
        const catMap = new Map();
        for (const inv of invoices) {
            const cat = invoiceCategory.get(inv.id) ?? "MANUAL";
            const amt = toNum(inv.amount);
            const e = catMap.get(cat) ?? { totalInvoiced: 0, totalCollected: 0, inDraft: 0, invoiceCount: 0 };
            e.totalInvoiced += amt;
            e.invoiceCount += 1;
            if (inv.status === "PAID")
                e.totalCollected += amt;
            if (inv.status === "DRAFT")
                e.inDraft += amt;
            catMap.set(cat, e);
        }
        return Array.from(catMap.entries())
            .map(([category, v]) => ({ category, ...v }))
            .sort((a, b) => b.totalInvoiced - a.totalInvoiced);
    }),
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
        const entityScope = buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        });
        const outstandingInvs = await db
            .select({
            id: invoice.id,
            status: invoice.status,
            amount: invoice.amount,
            creditedAmount: invoice.creditedAmount,
            dueDate: invoice.dueDate,
        })
            .from(invoice)
            .where(and(inArray(invoice.status, [...OPEN_AR_STATUSES]), entityScope));
        const paidByInvoice = await fetchCompletedPaymentsByInvoice(outstandingInvs.map(i => i.id));
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
            const amt = invoiceOutstandingAmount(inv, paidByInvoice.get(inv.id) ?? 0);
            if (amt <= 0)
                continue;
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
        const statuses = invoiceStatuses?.length ? invoiceStatuses : [...OPEN_AR_STATUSES];
        const offset = (page - 1) * pageSize;
        const entityScope = buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        });
        const rows = await db.query.invoice.findMany({
            where: and(inArray(invoice.status, statuses), entityScope),
            with: { team: { columns: { name: true } } },
            columns: {
                id: true, invoiceNumber: true, amount: true, currency: true, status: true,
                issueDate: true, dueDate: true, customerName: true, creditedAmount: true,
            },
            orderBy: [desc(invoice.dueDate)],
            limit: pageSize,
            offset,
        });
        const paidByInvoice = await fetchCompletedPaymentsByInvoice(rows.map(r => r.id));
        const [cntRow] = await db
            .select({ c: count() })
            .from(invoice)
            .where(and(inArray(invoice.status, statuses), entityScope));
        return {
            rows: rows
                .map(inv => {
                const due = invoiceOutstandingAmount(inv, paidByInvoice.get(inv.id) ?? 0);
                return {
                    id: inv.id,
                    invoiceNumber: inv.invoiceNumber,
                    teamName: inv.customerName || inv.team?.name || "No company",
                    issueDate: inv.issueDate,
                    dueDate: inv.dueDate,
                    amount: due,
                    currency: inv.currency,
                    status: inv.status,
                    daysOverdue: inv.dueDate && inv.dueDate < now ? differenceInDays(now, inv.dueDate) : 0,
                };
            })
                .filter(r => r.amount > 0),
            total: Number(cntRow?.c ?? 0),
        };
    }),
});
