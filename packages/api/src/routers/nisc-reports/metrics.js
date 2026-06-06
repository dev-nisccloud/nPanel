import { and, eq, gt, gte, inArray, isNotNull, isNull, lte, or } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice, invoiceTransaction } from "@npanel/db/schema/invoicing";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { paymentMethodFromDetails, resolveInvoicePaymentMethod, } from "../../lib/invoice-payment-method";
import { toNum, monthlyMrr } from "./filters";
import { buildReportEntityScope } from "./access";
/** Statuses that represent open accounts receivable (per design doc R-05). */
export const OPEN_AR_STATUSES = ["SENT", "OVERDUE", "PARTIALLY_PAID"];
/** Invoice statuses used in agency UI (`invoicing` router). */
export const INVOICE_REPORT_STATUSES = [
    "DRAFT",
    "SENT",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
    "CANCELLED",
    "WRITTEN_OFF",
];
export { paymentMethodFromDetails, resolveInvoicePaymentMethod };
export function isGatewayPaymentSuccessful(status) {
    return status === "SUCCESS" || status === "COMPLETED";
}
export function isGatewayPaymentRefunded(status) {
    return status === "REFUNDED" || status === "PARTIALLY_REFUNDED";
}
export function isGatewayPaymentFailed(status) {
    return status === "FAILED" || status === "CANCELLED";
}
/** Collected amount for one invoice - matches agency list (PAID = full invoice amount). */
export function invoiceCollectedAmount(inv, completedPaymentsTotal = 0) {
    if (inv.status === "PAID") {
        return Math.max(completedPaymentsTotal, toNum(inv.amount));
    }
    if (inv.status === "PARTIALLY_PAID") {
        return completedPaymentsTotal;
    }
    return 0;
}
export function invoiceOutstandingAmount(inv, completedPaymentsTotal = 0) {
    const total = toNum(inv.amount);
    const credited = toNum(inv.creditedAmount);
    if (inv.status === "PAID" ||
        inv.status === "CANCELLED" ||
        inv.status === "CREDITED" ||
        inv.status === "WRITTEN_OFF") {
        return 0;
    }
    if (inv.status === "DRAFT")
        return 0;
    if (OPEN_AR_STATUSES.includes(inv.status)) {
        if (inv.status === "PARTIALLY_PAID" || completedPaymentsTotal > 0) {
            return Math.max(0, total - credited - completedPaymentsTotal);
        }
        return Math.max(0, total - credited);
    }
    return 0;
}
/** Period filter by issue date, falling back to createdAt when issue date is unset. */
export function invoiceIssuedInPeriod(from, to) {
    return or(and(isNotNull(invoice.issueDate), gte(invoice.issueDate, from), lte(invoice.issueDate, to)), and(isNull(invoice.issueDate), gte(invoice.createdAt, from), lte(invoice.createdAt, to)));
}
export async function sumCollectedCash(params) {
    const { from, to, scope } = params;
    const entityScope = buildReportEntityScope({ teamColumn: invoice.teamId, teamIds: scope.teamIds });
    const txRows = await db
        .select({ invoiceId: invoiceTransaction.invoiceId, amount: invoiceTransaction.amount })
        .from(invoiceTransaction)
        .innerJoin(invoice, eq(invoiceTransaction.invoiceId, invoice.id))
        .where(and(eq(invoiceTransaction.status, "COMPLETED"), gte(invoiceTransaction.paidAt, from), lte(invoiceTransaction.paidAt, to), entityScope));
    let total = 0;
    const txByInvoice = new Map();
    for (const r of txRows) {
        const amt = toNum(r.amount);
        total += amt;
        txByInvoice.set(r.invoiceId, (txByInvoice.get(r.invoiceId) ?? 0) + amt);
    }
    // Impute PAID invoices marked via status when no (or incomplete) transaction rows exist.
    const paidInvoices = await db
        .select({ id: invoice.id, amount: invoice.amount, status: invoice.status })
        .from(invoice)
        .where(and(eq(invoice.status, "PAID"), isNotNull(invoice.paidAt), gte(invoice.paidAt, from), lte(invoice.paidAt, to), entityScope));
    for (const inv of paidInvoices) {
        const txPaid = txByInvoice.get(inv.id) ?? 0;
        const invAmount = toNum(inv.amount);
        if (txPaid < invAmount) {
            total += invAmount - txPaid;
        }
    }
    return total;
}
/** Payment method aggregation aligned with agency invoice payment instructions. */
export async function aggregatePaymentMethodBreakdown(params) {
    const { from, to, scope } = params;
    const entityScope = buildReportEntityScope({ teamColumn: invoice.teamId, teamIds: scope.teamIds });
    const map = new Map();
    const add = (method, amount, countInc = 1) => {
        if (amount <= 0)
            return;
        const e = map.get(method) ?? { count: 0, amount: 0 };
        e.count += countInc;
        e.amount += amount;
        map.set(method, e);
    };
    const txRows = await db
        .select({
        invoiceId: invoiceTransaction.invoiceId,
        method: invoiceTransaction.method,
        amount: invoiceTransaction.amount,
        paymentDetails: invoice.paymentDetails,
    })
        .from(invoiceTransaction)
        .innerJoin(invoice, eq(invoiceTransaction.invoiceId, invoice.id))
        .where(and(eq(invoiceTransaction.status, "COMPLETED"), gte(invoiceTransaction.paidAt, from), lte(invoiceTransaction.paidAt, to), entityScope));
    const txByInvoice = new Map();
    for (const r of txRows) {
        const amt = toNum(r.amount);
        add(resolveInvoicePaymentMethod(r.method, r.paymentDetails), amt);
        txByInvoice.set(r.invoiceId, (txByInvoice.get(r.invoiceId) ?? 0) + amt);
    }
    const paidInvoices = await db
        .select({
        id: invoice.id,
        amount: invoice.amount,
        paymentDetails: invoice.paymentDetails,
    })
        .from(invoice)
        .where(and(eq(invoice.status, "PAID"), isNotNull(invoice.paidAt), gte(invoice.paidAt, from), lte(invoice.paidAt, to), entityScope));
    for (const inv of paidInvoices) {
        const txPaid = txByInvoice.get(inv.id) ?? 0;
        const gap = Math.max(0, toNum(inv.amount) - txPaid);
        if (gap > 0) {
            add(resolveInvoicePaymentMethod(null, inv.paymentDetails), gap);
        }
    }
    let grandTotal = 0;
    for (const v of map.values())
        grandTotal += v.amount;
    return Array.from(map.entries())
        .map(([method, v]) => ({
        method,
        count: v.count,
        amount: v.amount,
        percentOfTotal: grandTotal > 0 ? (v.amount / grandTotal) * 100 : 0,
    }))
        .sort((a, b) => b.amount - a.amount);
}
/** Sum completed payments per invoice (amounts are text - aggregate in JS). */
export async function fetchCompletedPaymentsByInvoice(invoiceIds) {
    const map = new Map();
    if (invoiceIds.length === 0)
        return map;
    const chunkSize = 500;
    for (let i = 0; i < invoiceIds.length; i += chunkSize) {
        const chunk = invoiceIds.slice(i, i + chunkSize);
        const rows = await db
            .select({
            invoiceId: invoiceTransaction.invoiceId,
            amount: invoiceTransaction.amount,
        })
            .from(invoiceTransaction)
            .where(and(inArray(invoiceTransaction.invoiceId, chunk), eq(invoiceTransaction.status, "COMPLETED")));
        for (const r of rows) {
            map.set(r.invoiceId, (map.get(r.invoiceId) ?? 0) + toNum(r.amount));
        }
    }
    return map;
}
export function subscriptionMrr(sub) {
    if (sub.pricingModel !== "FIXED")
        return 0;
    return monthlyMrr(sub.agreedPrice, sub.billingCycle);
}
export function mrrDeltaBetweenSubscriptions(oldSub, newSub) {
    return subscriptionMrr(newSub) - subscriptionMrr(oldSub);
}
export async function countSubscriptionsActiveAtDate(params) {
    const { asOf, scope } = params;
    const rows = await db
        .select({ id: niscClientSubscription.id })
        .from(niscClientSubscription)
        .where(and(or(and(isNotNull(niscClientSubscription.subscriptionDate), lte(niscClientSubscription.subscriptionDate, asOf)), and(isNull(niscClientSubscription.subscriptionDate), lte(niscClientSubscription.createdAt, asOf))), buildReportEntityScope({
        teamColumn: niscClientSubscription.teamId,
        teamIds: scope.teamIds,
    }), or(eq(niscClientSubscription.status, "ACTIVE"), and(inArray(niscClientSubscription.status, ["CANCELLED", "EXPIRED"]), gt(niscClientSubscription.updatedAt, asOf)))));
    return rows.length;
}
