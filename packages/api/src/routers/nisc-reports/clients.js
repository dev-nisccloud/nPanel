import { z } from "zod";
import { and, count, eq, gte, inArray, isNotNull, lte, or } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice, invoiceTransaction } from "@npanel/db/schema/invoicing";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
import { quotation } from "@npanel/db/schema/quotations";
import { team } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../../trpc";
import { quotationReportAmount, reportFiltersSchema, toNum } from "./filters";
import { buildReportEntityScope, resolveReportReadScope } from "./access";
import { OPEN_AR_STATUSES, fetchCompletedPaymentsByInvoice, invoiceCollectedAmount, invoiceIssuedInPeriod, invoiceOutstandingAmount, subscriptionMrr, } from "./metrics";
const FIXED = "FIXED";
const ACTIVE = "ACTIVE";
export const niscClientsRouter = router({
    // ─── C-01 Client Revenue Summary ──────────────────────────────────────────
    summary: protectedProcedure
        .input(reportFiltersSchema.extend({ specificTeamId: z.string().optional() }))
        .output(z.array(z.object({
        teamId: z.string(),
        teamName: z.string(),
        totalInvoiced: z.number(),
        totalPaid: z.number(),
        outstanding: z.number(),
        activeSubs: z.number(),
        mrr: z.number(),
        totalOrders: z.number(),
        pipelineValue: z.number(),
        lastActivity: z.date().nullable(),
    })))
        .query(async ({ input, ctx }) => {
        const { from, to, teamIds, specificTeamId } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
            requestedTeamIds: specificTeamId ? [specificTeamId] : teamIds,
        });
        const filterTeams = scope.teamIds;
        // Get all teams
        const teamRows = await db.query.team.findMany({
            where: filterTeams?.length ? inArray(team.id, filterTeams) : undefined,
            columns: { id: true, name: true },
            limit: 200,
        });
        const results = await Promise.all(teamRows.map(async (t) => {
            // Invoices
            const invoices = await db
                .select({
                id: invoice.id,
                status: invoice.status,
                amount: invoice.amount,
                creditedAmount: invoice.creditedAmount,
                createdAt: invoice.createdAt,
                issueDate: invoice.issueDate,
            })
                .from(invoice)
                .where(and(eq(invoice.teamId, t.id), invoiceIssuedInPeriod(from, to)));
            const paidByInvoice = await fetchCompletedPaymentsByInvoice(invoices.map(i => i.id));
            let totalInvoiced = 0, totalPaid = 0, outstanding = 0;
            let lastActivity = null;
            for (const inv of invoices) {
                const amt = toNum(inv.amount);
                const paid = paidByInvoice.get(inv.id) ?? 0;
                const issued = inv.issueDate ?? inv.createdAt;
                totalInvoiced += amt;
                totalPaid += invoiceCollectedAmount(inv, paid);
                if (OPEN_AR_STATUSES.includes(inv.status)) {
                    outstanding += invoiceOutstandingAmount(inv, paid);
                }
                if (!lastActivity || issued > lastActivity)
                    lastActivity = issued;
            }
            // Active subscriptions
            const subs = await db.query.niscClientSubscription.findMany({
                where: and(eq(niscClientSubscription.teamId, t.id), eq(niscClientSubscription.status, ACTIVE)),
            });
            let mrr = 0;
            for (const s of subs) {
                mrr += subscriptionMrr(s);
            }
            // Orders
            const [ordRow] = await db.select({ c: count() }).from(niscOrder)
                .where(and(eq(niscOrder.teamId, t.id), gte(niscOrder.createdAt, from), lte(niscOrder.createdAt, to)));
            // Quotations
            const quotes = await db
                .select({ amount: quotation.amount, subtotal: quotation.subtotal, status: quotation.status })
                .from(quotation)
                .where(and(gte(quotation.createdAt, from), lte(quotation.createdAt, to), inArray(quotation.status, ["DRAFT", "SENT"])));
            const pipelineValue = quotes.reduce((s, q) => s + quotationReportAmount(q), 0);
            return {
                teamId: t.id,
                teamName: t.name,
                totalInvoiced,
                totalPaid,
                outstanding,
                activeSubs: subs.length,
                mrr,
                totalOrders: Number(ordRow?.c ?? 0),
                pipelineValue,
                lastActivity,
            };
        }));
        return results.sort((a, b) => b.totalInvoiced - a.totalInvoiced);
    }),
    // ─── C-02 Cohort Retention ────────────────────────────────────────────────
    cohortRetention: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.array(z.object({
        cohortMonth: z.string(),
        startCount: z.number(),
        at1Month: z.number(),
        at3Months: z.number(),
        at6Months: z.number(),
        at12Months: z.number(),
    })))
        .query(async ({ input, ctx }) => {
        const { from, to } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
        });
        const subs = await db.query.niscClientSubscription.findMany({
            where: and(gte(niscClientSubscription.subscriptionDate, from), lte(niscClientSubscription.subscriptionDate, to), buildReportEntityScope({
                teamColumn: niscClientSubscription.teamId,
                teamIds: scope.teamIds,
            })),
            columns: {
                id: true, teamId: true, subscriptionDate: true, status: true,
                expiryDate: true, createdAt: true, updatedAt: true,
            },
        });
        // Group by cohort month
        const cohortMap = new Map();
        for (const s of subs) {
            const d = s.subscriptionDate ?? s.createdAt;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const c = cohortMap.get(key) ?? [];
            c.push(s);
            cohortMap.set(key, c);
        }
        const now = new Date();
        return Array.from(cohortMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cohortMonth, cohortSubs]) => {
            const startDate = new Date(cohortMonth + "-01");
            function activeAt(months) {
                const cutoff = new Date(startDate.getTime() + months * 30 * 86400000);
                if (cutoff > now)
                    return -1; // not enough time has passed
                return cohortSubs.filter(s => {
                    const expiry = s.expiryDate ?? s.updatedAt;
                    return expiry >= cutoff;
                }).length;
            }
            return {
                cohortMonth,
                startCount: cohortSubs.length,
                at1Month: Math.max(0, activeAt(1)),
                at3Months: Math.max(0, activeAt(3)),
                at6Months: Math.max(0, activeAt(6)),
                at12Months: Math.max(0, activeAt(12)),
            };
        });
    }),
    // ─── C-03 New vs. Returning Clients ──────────────────────────────────────
    newVsReturning: protectedProcedure
        .input(reportFiltersSchema)
        .output(z.object({
        newClients: z.number(),
        returningClients: z.number(),
        newClientsRevenue: z.number(),
        returningClientsRevenue: z.number(),
        periodLabel: z.string(),
    }))
        .query(async ({ input, ctx }) => {
        const { from, to } = input;
        const scope = await resolveReportReadScope({
            userId: ctx.session.user.id,
            role: ctx.session.user.role,
        });
        // Get all invoices ever (to determine "new" vs "returning")
        const allInvoices = await db
            .select({ teamId: invoice.teamId, createdAt: invoice.createdAt, amount: invoice.amount, status: invoice.status })
            .from(invoice)
            .where(and(inArray(invoice.status, ["DRAFT", "SENT", "PAID", "OVERDUE", "PARTIALLY_PAID"])));
        const periodTx = await db
            .select({
            teamId: invoice.teamId,
            amount: invoiceTransaction.amount,
            invoiceId: invoiceTransaction.invoiceId,
        })
            .from(invoiceTransaction)
            .innerJoin(invoice, eq(invoiceTransaction.invoiceId, invoice.id))
            .where(and(eq(invoiceTransaction.status, "COMPLETED"), gte(invoiceTransaction.paidAt, from), lte(invoiceTransaction.paidAt, to), buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        })));
        const paidInvoicesInPeriod = await db
            .select({ teamId: invoice.teamId, id: invoice.id, amount: invoice.amount })
            .from(invoice)
            .where(and(eq(invoice.status, "PAID"), isNotNull(invoice.paidAt), gte(invoice.paidAt, from), lte(invoice.paidAt, to), buildReportEntityScope({
            teamColumn: invoice.teamId,
            teamIds: scope.teamIds,
        })));
        const periodTeams = new Map();
        for (const inv of allInvoices) {
            const tid = inv.teamId ?? "__none__";
            const issued = inv.createdAt;
            const e = periodTeams.get(tid);
            if (!e) {
                periodTeams.set(tid, { firstEver: issued, periodAmount: 0 });
            }
            else if (issued < e.firstEver) {
                e.firstEver = issued;
            }
        }
        for (const tx of periodTx) {
            const tid = tx.teamId ?? "__none__";
            const pe = periodTeams.get(tid);
            if (pe)
                pe.periodAmount += toNum(tx.amount);
            else
                periodTeams.set(tid, { firstEver: from, periodAmount: toNum(tx.amount) });
        }
        const txByInvoice = new Map();
        for (const tx of periodTx) {
            txByInvoice.set(tx.invoiceId, (txByInvoice.get(tx.invoiceId) ?? 0) + toNum(tx.amount));
        }
        for (const inv of paidInvoicesInPeriod) {
            const tid = inv.teamId ?? "__none__";
            const txPaid = txByInvoice.get(inv.id) ?? 0;
            const gap = Math.max(0, toNum(inv.amount) - txPaid);
            if (gap <= 0)
                continue;
            const pe = periodTeams.get(tid);
            if (pe)
                pe.periodAmount += gap;
            else
                periodTeams.set(tid, { firstEver: from, periodAmount: gap });
        }
        let newClients = 0, returningClients = 0, newRevenue = 0, returningRevenue = 0;
        for (const [, v] of periodTeams.entries()) {
            if (v.firstEver >= from) {
                newClients += 1;
                newRevenue += v.periodAmount;
            }
            else if (v.periodAmount > 0) {
                returningClients += 1;
                returningRevenue += v.periodAmount;
            }
        }
        return {
            newClients,
            returningClients,
            newClientsRevenue: newRevenue,
            returningClientsRevenue: returningRevenue,
            periodLabel: `${from.toLocaleDateString("en-CA", { month: "short", year: "numeric" })} – ${to.toLocaleDateString("en-CA", { month: "short", year: "numeric" })}`,
        };
    }),
});
