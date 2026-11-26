"use client";

import { formatInvoiceMoney, resolveInvoicePaymentTotals } from "@/lib/invoice-payment-totals";

type InvoicePaymentSummaryProps = {
	amount?: string | null;
	amountPaid?: string | null;
	amountRemaining?: string | null;
	creditBalance?: string | null;
	status?: string | null;
	dueDate?: string | Date | null;
	currency?: string | null;
	transactions?: Array<{ amount?: string | null; status?: string | null }>;
};

function Stat({
	label,
	value,
	tone,
}: {
	label: string;
	value: string;
	tone?: "default" | "success" | "warning" | "danger";
}) {
	const toneClass =
		tone === "success"
			? "text-emerald-700 dark:text-emerald-400"
			: tone === "warning"
				? "text-amber-700 dark:text-amber-400"
				: tone === "danger"
					? "text-destructive"
					: "text-foreground";

	return (
		<div className="rounded-lg border bg-card px-4 py-3">
			<p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
			<p className={`mt-1 text-sm font-semibold tabular-nums break-words ${toneClass}`}>{value}</p>
		</div>
	);
}

export function InvoicePaymentSummary(props: InvoicePaymentSummaryProps) {
	const totals = resolveInvoicePaymentTotals(props);
	const currency = props.currency || "KES";
	const remainingLabel = totals.isOverdue ? "Overdue" : "Remaining";

	return (
		<div className="w-full space-y-3">
			<div className="flex flex-col gap-1">
				<h2 className="text-sm font-semibold tracking-tight">Payments</h2>
				<p className="text-xs text-muted-foreground">
					Amount paid, remaining balance, and any credit on this invoice.
				</p>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<Stat label="Invoice total" value={formatInvoiceMoney(totals.total, currency)} />
				<Stat
					label="Amount paid"
					value={formatInvoiceMoney(totals.paid, currency)}
					tone={totals.paid > 0 ? "success" : "default"}
				/>
				<Stat
					label={remainingLabel}
					value={formatInvoiceMoney(totals.remaining, currency)}
					tone={totals.remaining <= 0 ? "success" : "warning"}
				/>
				<Stat
					label="Credit"
					value={formatInvoiceMoney(totals.credit, currency)}
					tone={totals.credit > 0 ? "success" : "default"}
				/>
			</div>
		</div>
	);
}
