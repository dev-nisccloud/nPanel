export type InvoicePaymentTotals = {
	total: number;
	paid: number;
	remaining: number;
	credit: number;
	isOverdue: boolean;
};

function parseMoney(value: string | number | null | undefined): number {
	if (value == null || value === "") return 0;
	const n = typeof value === "number" ? value : Number.parseFloat(value);
	return Number.isFinite(n) ? n : 0;
}

function roundMoney(value: number): number {
	return Math.round(value * 100) / 100;
}

export function formatInvoiceMoney(amount: number, currency: string): string {
	try {
		return new Intl.NumberFormat("en-KE", {
			style: "currency",
			currency: currency || "KES",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	} catch {
		return `${currency} ${amount.toFixed(2)}`;
	}
}

export function resolveInvoicePaymentTotals(invoice: {
	amount?: string | null;
	amountPaid?: string | null;
	amountRemaining?: string | null;
	creditBalance?: string | null;
	status?: string | null;
	dueDate?: string | Date | null;
	transactions?: Array<{ amount?: string | null; status?: string | null }>;
}): InvoicePaymentTotals {
	const total = roundMoney(parseMoney(invoice.amount));
	const paidFromTx = roundMoney(
		(invoice.transactions ?? [])
			.filter((tx) => tx.status === "COMPLETED")
			.reduce((sum, tx) => sum + parseMoney(tx.amount), 0),
	);
	const paidFromColumn = roundMoney(parseMoney(invoice.amountPaid));
	const paid = paidFromTx > 0 ? paidFromTx : paidFromColumn;

	const remaining = Math.max(0, roundMoney(total - paid));
	const creditFromColumn = roundMoney(parseMoney(invoice.creditBalance));
	const credit = Math.max(creditFromColumn, roundMoney(Math.max(0, paid - total)));

	const due =
		invoice.dueDate instanceof Date
			? invoice.dueDate
			: invoice.dueDate
				? new Date(invoice.dueDate)
				: null;
	const duePassed = !!due && !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
	const isOverdue =
		invoice.status === "OVERDUE" ||
		(remaining > 0 && duePassed && invoice.status !== "CANCELLED" && invoice.status !== "WRITTEN_OFF" && invoice.status !== "REFUNDED");

	return { total, paid, remaining, credit, isOverdue };
}
