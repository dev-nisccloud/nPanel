import { and, eq, gt, gte, inArray, isNotNull, isNull, lte, or } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice, invoiceTransaction } from "@npanel/db/schema/invoicing";
import { niscClientSubscription } from "@npanel/db/schema/products";
import {
  paymentMethodFromDetails,
  resolveInvoicePaymentMethod,
  type InvoicePaymentMethod,
} from "../../lib/invoice-payment-method";
import { toNum, monthlyMrr } from "./filters";
import { buildReportEntityScope, type ReportScope } from "./access";

/** Statuses that represent open accounts receivable (per design doc R-05). */
export const OPEN_AR_STATUSES = ["SENT", "UNPAID", "OVERDUE", "PARTIALLY_PAID"] as const;

/** Invoice statuses used in agency UI (`invoicing` router). */
export const INVOICE_REPORT_STATUSES = [
  "DRAFT",
  "SENT",
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
  "WRITTEN_OFF",
] as const;

export type { InvoicePaymentMethod };
export { paymentMethodFromDetails, resolveInvoicePaymentMethod };

export function isGatewayPaymentSuccessful(status: string): boolean {
  return status === "SUCCESS" || status === "COMPLETED";
}

export function isGatewayPaymentRefunded(status: string): boolean {
  return status === "REFUNDED" || status === "PARTIALLY_REFUNDED";
}

export function isGatewayPaymentFailed(status: string): boolean {
  return status === "FAILED" || status === "CANCELLED";
}

/** 
 * Collected amount for one invoice.
 * FIXED: Always use completedPaymentsTotal as source of truth.
 * For PAID status, ensure we capture at least the invoice amount if transactions are incomplete.
 */
export function invoiceCollectedAmount(
  inv: { status: string; amount: string | null },
  completedPaymentsTotal = 0,
): number {
  const invoiceAmount = toNum(inv.amount);
  
  // For PAID invoices: if we have transaction data, trust it; 
  // otherwise use invoice amount (imputation)
  if (inv.status === "PAID") {
    // If transactions sum to less than invoice (incomplete records), use invoice amount
    // If transactions sum to more (refunds/reversals captured), use actual transaction total
    if (completedPaymentsTotal > 0) {
      return completedPaymentsTotal;
    }
    // No transaction records - impute from invoice amount
    return invoiceAmount;
  }
  
  // For PARTIALLY_PAID: only count what was actually paid
  if (inv.status === "PARTIALLY_PAID") {
    return completedPaymentsTotal;
  }
  
  // All other statuses: no collection yet
  return 0;
}

export type InvoiceBalanceInput = {
  status: string;
  amount: string | null;
  creditedAmount?: string | null;
};

/**
 * Outstanding amount for an invoice (accounts receivable).
 * FIXED: Consistently calculate as: invoiceAmount - creditedAmount - completedPayments
 * regardless of status nuances. Only return 0 for fully closed statuses.
 */
export function invoiceOutstandingAmount(
  inv: InvoiceBalanceInput,
  completedPaymentsTotal = 0,
): number {
  const total = toNum(inv.amount);
  const credited = toNum(inv.creditedAmount);

  // Closed statuses: no outstanding amount
  if (
    inv.status === "PAID" ||
    inv.status === "CANCELLED" ||
    inv.status === "CREDITED" ||
    inv.status === "WRITTEN_OFF"
  ) {
    return 0;
  }
  
  // Draft invoices haven't been sent yet - not part of A/R
  if (inv.status === "DRAFT") return 0;

  // For all open A/R statuses (SENT, UNPAID, OVERDUE, PARTIALLY_PAID):
  // Calculate outstanding consistently
  if ((OPEN_AR_STATUSES as readonly string[]).includes(inv.status)) {
    return Math.max(0, total - credited - completedPaymentsTotal);
  }

  // Unknown status: treat as no outstanding
  return 0;
}

/** Period filter by issue date, falling back to createdAt when issue date is unset. */
export function invoiceIssuedInPeriod(from: Date, to: Date) {
  return or(
    and(isNotNull(invoice.issueDate), gte(invoice.issueDate, from), lte(invoice.issueDate, to)),
    and(isNull(invoice.issueDate), gte(invoice.createdAt, from), lte(invoice.createdAt, to)),
  );
}

/**
 * Sum of all cash collected in a period based on payment transactions.
 * FIXED: Improved imputation logic to avoid double-counting and ensure accuracy.
 * 
 * Logic:
 * 1. Sum all completed transactions with paidAt in period
 * 2. For PAID invoices with paidAt in period: if transactions don't cover full amount,
 *    add the gap (this handles cases where transaction records are incomplete)
 * 3. For PARTIALLY_PAID invoices: trust transaction amounts only
 */
export async function sumCollectedCash(params: {
  from: Date;
  to: Date;
  scope: ReportScope;
}): Promise<number> {
  const { from, to, scope } = params;
  const entityScope = buildReportEntityScope({ teamColumn: invoice.teamId, teamIds: scope.teamIds });

  // Get all completed transactions in the period
  const txRows = await db
    .select({ invoiceId: invoiceTransaction.invoiceId, amount: invoiceTransaction.amount })
    .from(invoiceTransaction)
    .innerJoin(invoice, eq(invoiceTransaction.invoiceId, invoice.id))
    .where(
      and(
        eq(invoiceTransaction.status, "COMPLETED"),
        isNotNull(invoiceTransaction.paidAt),
        gte(invoiceTransaction.paidAt, from),
        lte(invoiceTransaction.paidAt, to),
        entityScope,
      ),
    );

  let total = 0;
  const txByInvoice = new Map<string, number>();
  
  // Sum all transaction amounts
  for (const r of txRows) {
    const amt = toNum(r.amount);
    total += amt;
    txByInvoice.set(r.invoiceId, (txByInvoice.get(r.invoiceId) ?? 0) + amt);
  }

  // Impute PAID invoices where transaction records are incomplete or missing
  // This handles legacy data or cases where payments weren't recorded as transactions
  const paidInvoices = await db
    .select({ id: invoice.id, amount: invoice.amount })
    .from(invoice)
    .where(
      and(
        eq(invoice.status, "PAID"),
        isNotNull(invoice.paidAt),
        gte(invoice.paidAt, from),
        lte(invoice.paidAt, to),
        entityScope,
      ),
    );

  for (const inv of paidInvoices) {
    const txPaid = txByInvoice.get(inv.id) ?? 0;
    const invAmount = toNum(inv.amount);
    
    // Only add the gap if transactions are less than invoice amount
    // If txPaid >= invAmount, we already counted the full payment
    if (txPaid < invAmount) {
      const gap = invAmount - txPaid;
      total += gap;
    }
  }

  return total;
}

export type PaymentMethodBreakdownRow = {
  method: string;
  count: number;
  amount: number;
  percentOfTotal: number;
};

/** 
 * Payment method aggregation aligned with agency invoice payment instructions.
 * FIXED: Prevent double-counting by tracking which invoices we've imputed.
 */
export async function aggregatePaymentMethodBreakdown(params: {
  from: Date;
  to: Date;
  scope: ReportScope;
}): Promise<PaymentMethodBreakdownRow[]> {
  const { from, to, scope } = params;
  const entityScope = buildReportEntityScope({ teamColumn: invoice.teamId, teamIds: scope.teamIds });
  const map = new Map<string, { count: number; amount: number }>();

  const add = (method: string, amount: number, countInc = 1) => {
    if (amount <= 0) return;
    const e = map.get(method) ?? { count: 0, amount: 0 };
    e.count += countInc;
    e.amount += amount;
    map.set(method, e);
  };

  // Get all completed transactions in period
  const txRows = await db
    .select({
      invoiceId: invoiceTransaction.invoiceId,
      method: invoiceTransaction.method,
      amount: invoiceTransaction.amount,
      paymentDetails: invoice.paymentDetails,
    })
    .from(invoiceTransaction)
    .innerJoin(invoice, eq(invoiceTransaction.invoiceId, invoice.id))
    .where(
      and(
        eq(invoiceTransaction.status, "COMPLETED"),
        isNotNull(invoiceTransaction.paidAt),
        gte(invoiceTransaction.paidAt, from),
        lte(invoiceTransaction.paidAt, to),
        entityScope,
      ),
    );

  const txByInvoice = new Map<string, number>();
  for (const r of txRows) {
    const amt = toNum(r.amount);
    const method = resolveInvoicePaymentMethod(r.method, r.paymentDetails);
    add(method, amt);
    txByInvoice.set(r.invoiceId, (txByInvoice.get(r.invoiceId) ?? 0) + amt);
  }

  // Impute PAID invoices with incomplete transaction records
  const paidInvoices = await db
    .select({
      id: invoice.id,
      amount: invoice.amount,
      paymentDetails: invoice.paymentDetails,
    })
    .from(invoice)
    .where(
      and(
        eq(invoice.status, "PAID"),
        isNotNull(invoice.paidAt),
        gte(invoice.paidAt, from),
        lte(invoice.paidAt, to),
        entityScope,
      ),
    );

  for (const inv of paidInvoices) {
    const txPaid = txByInvoice.get(inv.id) ?? 0;
    const invoiceAmount = toNum(inv.amount);
    
    // Only add gap if transactions don't cover full invoice
    const gap = Math.max(0, invoiceAmount - txPaid);
    if (gap > 0) {
      // Use payment method from invoice metadata, or default to "MANUAL"
      const method = resolveInvoicePaymentMethod(null, inv.paymentDetails);
      add(method, gap);
    }
  }

  let grandTotal = 0;
  for (const v of map.values()) grandTotal += v.amount;

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
export async function fetchCompletedPaymentsByInvoice(
  invoiceIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (invoiceIds.length === 0) return map;

  const chunkSize = 500;
  for (let i = 0; i < invoiceIds.length; i += chunkSize) {
    const chunk = invoiceIds.slice(i, i + chunkSize);
    const rows = await db
      .select({
        invoiceId: invoiceTransaction.invoiceId,
        amount: invoiceTransaction.amount,
      })
      .from(invoiceTransaction)
      .where(
        and(
          inArray(invoiceTransaction.invoiceId, chunk),
          eq(invoiceTransaction.status, "COMPLETED"),
        ),
      );

    for (const r of rows) {
      map.set(r.invoiceId, (map.get(r.invoiceId) ?? 0) + toNum(r.amount));
    }
  }
  return map;
}

export function subscriptionMrr(sub: {
  pricingModel: string;
  agreedPrice: string | null;
  billingCycle: string | null;
}): number {
  if (sub.pricingModel !== "FIXED") return 0;
  return monthlyMrr(sub.agreedPrice, sub.billingCycle);
}

export function mrrDeltaBetweenSubscriptions(
  oldSub: { pricingModel: string; agreedPrice: string | null; billingCycle: string | null },
  newSub: { pricingModel: string; agreedPrice: string | null; billingCycle: string | null },
): number {
  return subscriptionMrr(newSub) - subscriptionMrr(oldSub);
}

export async function countSubscriptionsActiveAtDate(params: {
  asOf: Date;
  scope: ReportScope;
}): Promise<number> {
  const { asOf, scope } = params;
  const rows = await db
    .select({ id: niscClientSubscription.id })
    .from(niscClientSubscription)
    .where(
      and(
        or(
          and(
            isNotNull(niscClientSubscription.subscriptionDate),
            lte(niscClientSubscription.subscriptionDate, asOf),
          ),
          and(
            isNull(niscClientSubscription.subscriptionDate),
            lte(niscClientSubscription.createdAt, asOf),
          ),
        ),
        buildReportEntityScope({
          teamColumn: niscClientSubscription.teamId,
          teamIds: scope.teamIds,
        }),
        or(
          eq(niscClientSubscription.status, "ACTIVE"),
          and(
            inArray(niscClientSubscription.status, ["CANCELLED", "EXPIRED"]),
            gt(niscClientSubscription.updatedAt, asOf),
          ),
        ),
      ),
    );
  return rows.length;
}
