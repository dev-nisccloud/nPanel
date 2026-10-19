"use client";

import { CleanList, CleanListCell, CleanListRow } from "@/components/ui/clean-list";
import { Badge } from "@/components/ui/badge";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
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
			return method;
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
		<div className="w-full space-y-3">
			<div className="flex flex-col gap-1">
				<h2 className="text-sm font-semibold tracking-tight">Transactions</h2>
				<p className="text-xs text-muted-foreground">
					Payments recorded against this invoice.
				</p>
			</div>

			<CleanList
				emptyMessage={emptyMessage}
				columns={[
					{ key: "reference", label: "Reference" },
					{ key: "method", label: "Method", className: "w-32", hideBelow: "@lg" },
					{ key: "amount", label: "Amount", className: "w-40", hideBelow: "@xl" },
					{ key: "actions", label: "Actions", align: "end" },
				]}
			>
				{transactions.map((tx) => {
					const dateLabel = formatDate(tx.paidAt ?? tx.createdAt);
					return (
						<CleanListRow
							key={tx.id}
							title={
								<span className="text-foreground hover:underline">
									{tx.reference || tx.providerReference || `${tx.id.slice(0, 8)}…`}
								</span>
							}
							description={
								<Badge variant="outline" className={getStatusBadgeClass(tx.status)}>
									{tx.status.replace(/_/g, " ")}
								</Badge>
							}
							cells={{
								method: <CleanListCell>{getMethodDisplay(tx.method)}</CleanListCell>,
								amount: (
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground">
											{formatCurrency(tx.amount, tx.currency)}
										</p>
										{dateLabel ? <CleanListCell>{dateLabel}</CleanListCell> : null}
									</div>
								),
							}}
							onClick={() => onViewTransaction(tx)}
							actions={
								<ViewDetailsButton onClick={() => onViewTransaction(tx)} />
							}
						/>
					);
				})}
			</CleanList>
		</div>
	);
}
