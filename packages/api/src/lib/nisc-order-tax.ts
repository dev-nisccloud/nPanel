/** VAT rate applied to Nisc orders and auto-invoices (must match checkout / invoice). */
export const NISC_ORDER_VAT_PERCENTAGE = 16;

export function computeNiscOrderTotalsWithTax(subtotalNum: number): {
	subtotal: number;
	tax: number;
	total: number;
} {
	const tax = Math.round(subtotalNum * (NISC_ORDER_VAT_PERCENTAGE / 100) * 100) / 100;
	const total = Math.round((subtotalNum + tax) * 100) / 100;
	return { subtotal: subtotalNum, tax, total };
}

/** Allocate order total (incl. VAT) across line subtotals proportionally. */
export function allocateLineTotalWithTax(
	itemSubtotal: number,
	orderSubtotal: number,
	orderTotalWithTax: number,
): number {
	if (orderSubtotal <= 0) {
		const { total } = computeNiscOrderTotalsWithTax(itemSubtotal);
		return total;
	}
	return Math.round((itemSubtotal / orderSubtotal) * orderTotalWithTax * 100) / 100;
}

export function formatNiscMoney(amount: number, currency: string): string {
	const code = currency?.trim() || "KES";
	return `${code} ${amount.toLocaleString("en-KE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}
