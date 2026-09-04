/**
 * Canonical paid / remaining / status for an invoice.
 * Auto-created Nisc invoices were historically inserted as PAID with remaining 0
 * even when the linked payment was a partial STK amount.
 */

export function parseInvoiceMoney(value: string | number | null | undefined): number {
	if (value == null || value === "") return 0;
	const n = typeof value === "number" ? value : Number.parseFloat(String(value));
	return Number.isFinite(n) ? n : 0;
}

export function roundInvoiceMoney(value: number): number {
	return Math.round(value * 100) / 100;
}

export function sumCompletedInvoicePayments(
	transactions: Array<{ amount?: string | number | null; status?: string | null }>,
): number {
	return roundInvoiceMoney(
		transactions
			.filter((tx) => (tx.status ?? "").trim().toUpperCase() === "COMPLETED")
			.reduce((sum, tx) => sum + parseInvoiceMoney(tx.amount), 0),
	);
}

export type InvoicePaymentState = {
	paid: number;
	remaining: number;
	credit: number;
	status: string;
	fullyPaid: boolean;
	amountPaid: string;
	amountRemaining: string;
	creditBalance: string;
};

export function computeInvoicePaymentState(input: {
	amount?: string | number | null;
	amountPaid?: string | number | null;
	creditBalance?: string | number | null;
	status?: string | null;
	transactions?: Array<{ amount?: string | number | null; status?: string | null }>;
}): InvoicePaymentState {
	const total = roundInvoiceMoney(parseInvoiceMoney(input.amount));
	const paidFromTx = sumCompletedInvoicePayments(input.transactions ?? []);
	const paidFromColumn = roundInvoiceMoney(parseInvoiceMoney(input.amountPaid));
	const paid = paidFromTx > 0 ? paidFromTx : paidFromColumn;
	const remaining = Math.max(0, roundInvoiceMoney(total - paid));
	const creditFromColumn = roundInvoiceMoney(parseInvoiceMoney(input.creditBalance));
	const credit = Math.max(creditFromColumn, roundInvoiceMoney(Math.max(0, paid - total)));
	const currentStatus = input.status ?? "SENT";
	const locked =
		currentStatus === "CANCELLED" ||
		currentStatus === "WRITTEN_OFF" ||
		currentStatus === "DRAFT";

	let status = currentStatus;
	if (!locked) {
		if (remaining <= 0 && paid > 0) status = "PAID";
		else if (paid > 0) status = "PARTIALLY_PAID";
		else if (currentStatus === "PAID" || currentStatus === "PARTIALLY_PAID") status = "SENT";
	}

	return {
		paid,
		remaining,
		credit,
		status,
		fullyPaid: remaining <= 0 && paid > 0,
		amountPaid: String(paid),
		amountRemaining: String(remaining),
		creditBalance: String(credit),
	};
}
