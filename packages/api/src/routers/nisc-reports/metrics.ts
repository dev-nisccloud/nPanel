import { and, eq, gt, gte, inArray, isNotNull, isNull, lte, or } from "@npanel/db";
import { db } from "@npanel/db";
import { invoice, invoiceTransaction } from "@npanel/db/schema/invoicing";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { toNum, monthlyMrr } from "./filters";
import { buildReportEntityScope, type ReportScope } from "./access";

/** Statuses that represent open accounts receivable (per design doc R-05). */
export const OPEN_AR_STATUSES = ["SENT", "OVERDUE", "PARTIALLY_PAID"] as const;

export type InvoiceBalanceInput = {
  status: string;
  amount: string | null;
  creditedAmount?: string | null;
};

export function invoiceOutstandingAmount(
  inv: InvoiceBalanceInput,
  completedPaymentsTotal = 0,
): number {
  const total = toNum(inv.amount);
  const credited = toNum(inv.creditedAmount);

  if (
    inv.status === "PAID" ||
    inv.status === "CANCELLED" ||
    inv.status === "CREDITED" ||
    inv.status === "WRITTEN_OFF"
  ) {
    return 0;
  }
  if (inv.status === "DRAFT") return 0;

  if ((OPEN_AR_STATUSES as readonly string[]).includes(inv.status)) {
    if (inv.status === "PARTIALLY_PAID" || completedPaymentsTotal > 0) {
      return Math.max(0, total - credited - completedPaymentsTotal);
    }
    return Math.max(0, total - credited);
  }

  return 0;
}

/** Period filter by issue date, falling back to createdAt when issue date is unset. */
export function invoiceIssuedInPeriod(from: Date, to: Date) {
  return or(
    and(isNotNull(invoice.issueDate), gte(invoice.issueDate, from), lte(invoice.issueDate, to)),
    and(isNull(invoice.issueDate), gte(invoice.createdAt, from), lte(invoice.createdAt, to)),
  );
}

export async function sumCollectedCash(params: {
  from: Date;
  to: Date;
  scope: ReportScope;
}): Promise<number> {
  const { from, to, scope } = params;
  const rows = await db
    .select({ amount: invoiceTransaction.amount })
    .from(invoiceTransaction)
    .innerJoin(invoice, eq(invoiceTransaction.invoiceId, invoice.id))
    .where(
      and(
        eq(invoiceTransaction.status, "COMPLETED"),
        gte(invoiceTransaction.paidAt, from),
        lte(invoiceTransaction.paidAt, to),
        buildReportEntityScope({ teamColumn: invoice.teamId, teamIds: scope.teamIds }),
      ),
    );
  return rows.reduce((a, r) => a + toNum(r.amount), 0);
}

/** Sum completed payments per invoice (amounts are text — aggregate in JS). */
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
