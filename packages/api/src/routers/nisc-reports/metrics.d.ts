import { paymentMethodFromDetails, resolveInvoicePaymentMethod, type InvoicePaymentMethod } from "../../lib/invoice-payment-method";
import { type ReportScope } from "./access";
/** Statuses that represent open accounts receivable (per design doc R-05). */
export declare const OPEN_AR_STATUSES: readonly ["SENT", "OVERDUE", "PARTIALLY_PAID"];
/** Invoice statuses used in agency UI (`invoicing` router). */
export declare const INVOICE_REPORT_STATUSES: readonly ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "WRITTEN_OFF"];
export type { InvoicePaymentMethod };
export { paymentMethodFromDetails, resolveInvoicePaymentMethod };
export declare function isGatewayPaymentSuccessful(status: string): boolean;
export declare function isGatewayPaymentRefunded(status: string): boolean;
export declare function isGatewayPaymentFailed(status: string): boolean;
/**
 * Collected amount for one invoice.
 * FIXED: Always use completedPaymentsTotal as source of truth.
 * For PAID status, ensure we capture at least the invoice amount if transactions are incomplete.
 */
export declare function invoiceCollectedAmount(inv: {
    status: string;
    amount: string | null;
}, completedPaymentsTotal?: number): number;
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
export declare function invoiceOutstandingAmount(inv: InvoiceBalanceInput, completedPaymentsTotal?: number): number;
/** Period filter by issue date, falling back to createdAt when issue date is unset. */
export declare function invoiceIssuedInPeriod(from: Date, to: Date): import("drizzle-orm").SQL<unknown> | undefined;
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
export declare function sumCollectedCash(params: {
    from: Date;
    to: Date;
    scope: ReportScope;
}): Promise<number>;
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
export declare function aggregatePaymentMethodBreakdown(params: {
    from: Date;
    to: Date;
    scope: ReportScope;
}): Promise<PaymentMethodBreakdownRow[]>;
/** Sum completed payments per invoice (amounts are text - aggregate in JS). */
export declare function fetchCompletedPaymentsByInvoice(invoiceIds: string[]): Promise<Map<string, number>>;
export declare function subscriptionMrr(sub: {
    pricingModel: string;
    agreedPrice: string | null;
    billingCycle: string | null;
}): number;
export declare function mrrDeltaBetweenSubscriptions(oldSub: {
    pricingModel: string;
    agreedPrice: string | null;
    billingCycle: string | null;
}, newSub: {
    pricingModel: string;
    agreedPrice: string | null;
    billingCycle: string | null;
}): number;
export declare function countSubscriptionsActiveAtDate(params: {
    asOf: Date;
    scope: ReportScope;
}): Promise<number>;
