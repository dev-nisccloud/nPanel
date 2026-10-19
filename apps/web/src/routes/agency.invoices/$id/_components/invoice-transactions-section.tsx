"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InvoiceTransaction } from "@/routes/agency.invoices/create/api/schemas";
import { formatInvoiceDate } from "@/lib/invoice-date";

function formatDate(v: string | Date | null | undefined): string | null {
	if (!v) return null;
	const formatted = formatInvoiceDate(v, "");
	return formatted || null;
}

function formatCurrency(amount: string | null | undefined, currency: string): string {
	if (!amount) return "";
	const n = Number(amount);
	return Number.isFinite(n)
		? new Intl.NumberFormat("en-US", {
				style: "currency",
				currency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(n)
		: `${currency} ${amount}`;
}

function getStatusBadgeClass(status: string): string {
	switch (status) {
		case "COMPLETED":
			return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800";
		case "PENDING":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
		case "FAILED":
			return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800";
		case "REFUNDED":
			return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200";
		default:
			return "";
	}
}

function getMethodDisplay(method: string): string {
	switch (method) {
		case "BANK_TRANSFER":
			return "Bank Transfer";
		case "MPESA":
			return "M-Pesa";
		case "CHEQUE":
			return "Cheque";
		case "CASH":
			return "Cash";
		case "CARD":
			return "Card";
		default:
			return method.replace(/_/g, " ");
	}
}

export interface InvoiceTransactionsSectionProps {
	transactions: InvoiceTransaction[];
	onViewTransaction: (transaction: InvoiceTransaction) => void;
	emptyMessage?: string;
}

export function InvoiceTransactionsSection({
	transactions,
	onViewTransaction,
	emptyMessage = "No transactions yet. Use \"Update payment\" to record one.",
}: InvoiceTransactionsSectionProps) {
	return (
		<section className="w-full space-y-3 rounded-lg border bg-card p-4">
			<div className="flex items-baseline justify-between gap-3">
				<div className="min-w-0">
					<h2 className="text-sm font-semibold tracking-tight">Transactions</h2>
					<p className="text-xs text-muted-foreground">
						Payments recorded against this invoice.
					</p>
				</div>
				{transactions.length > 0 ? (
					<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
						{transactions.length}
					</span>
				) : null}
			</div>

			{transactions.length === 0 ? (
				<p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
					{emptyMessage}
				</p>
			) : (
				<ul className="space-y-2">
					{transactions.map((tx) => {
						const dateLabel = formatDate(tx.paidAt ?? tx.createdAt);
						const reference =
							tx.reference || tx.providerReference || `${tx.id.slice(0, 8)}…`;
						return (
							<li key={tx.id}>
								<button
									type="button"
									onClick={() => onViewTransaction(tx)}
									className="flex w-full items-start gap-3 rounded-md border bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
								>
									<div className="min-w-0 flex-1 space-y-1">
										<div className="flex items-start justify-between gap-2">
											<p className="truncate text-sm font-medium tabular-nums">
												{formatCurrency(tx.amount, tx.currency)}
											</p>
											<Badge
												variant="outline"
												className={`shrink-0 ${getStatusBadgeClass(tx.status)}`}
											>
												{tx.status.replace(/_/g, " ")}
											</Badge>
										</div>
										<p className="truncate text-xs text-muted-foreground">
											{getMethodDisplay(tx.method)}
											{dateLabel ? ` · ${dateLabel}` : ""}
										</p>
										<p className="truncate text-xs text-muted-foreground">{reference}</p>
									</div>
									<ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
