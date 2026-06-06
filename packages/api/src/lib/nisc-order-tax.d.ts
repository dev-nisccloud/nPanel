/** VAT rate applied to Nisc orders and auto-invoices (must match checkout / invoice). */
export declare const NISC_ORDER_VAT_PERCENTAGE = 16;
export declare function computeNiscOrderTotalsWithTax(subtotalNum: number): {
    subtotal: number;
    tax: number;
    total: number;
};
/** Allocate order total (incl. VAT) across line subtotals proportionally. */
export declare function allocateLineTotalWithTax(itemSubtotal: number, orderSubtotal: number, orderTotalWithTax: number): number;
export declare function formatNiscMoney(amount: number, currency: string): string;
