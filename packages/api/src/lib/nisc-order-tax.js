import { computeCeilVatTotals } from "./convert-price";
/** VAT rate applied to Nisc orders and auto-invoices (must match checkout / invoice). */
export const NISC_ORDER_VAT_PERCENTAGE = 16;
/**
 * Order/invoice totals with ceil VAT  same formula as checkout M-Pesa amounts
 * (`computeCeilVatTotals`) so paid total, order.total, and invoice.total stay aligned.
 */
export function computeNiscOrderTotalsWithTax(subtotalNum) {
    const { subtotalExVat, vatAmount, totalIncVat } = computeCeilVatTotals(subtotalNum, NISC_ORDER_VAT_PERCENTAGE / 100);
    return { subtotal: subtotalExVat, tax: vatAmount, total: totalIncVat };
}
/** Allocate order total (incl. VAT) across line subtotals proportionally. */
export function allocateLineTotalWithTax(itemSubtotal, orderSubtotal, orderTotalWithTax) {
    if (orderSubtotal <= 0) {
        const { total } = computeNiscOrderTotalsWithTax(itemSubtotal);
        return total;
    }
    return Math.round((itemSubtotal / orderSubtotal) * orderTotalWithTax * 100) / 100;
}
export function formatNiscMoney(amount, currency) {
    const code = currency?.trim() || "KES";
    return `${code} ${amount.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
