"use client";

import { Eye } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InvoiceTransaction } from "@/routes/agency.invoices/create/api/schemas";

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return "—";
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function formatCurrency(amount: string | null | undefined, currency: string): string {
	if (!amount) return "—";
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
}

export function InvoiceTransactionsSection({
	transactions,
	onViewTransaction,
}: InvoiceTransactionsSectionProps) {
	return (
		<div className="w-full max-w-3xl mx-auto space-y-3">
			<div className="flex flex-col gap-1">
				<h2 className="text-sm font-semibold tracking-tight">Transactions</h2>
				<p className="text-xs text-muted-foreground">
					Payments recorded against this invoice.
				</p>
			</div>

			{transactions.length === 0 ? (
				<div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
					No transactions yet. Use &quot;Update payment&quot; to record one.
				</div>
			) : (
				<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">Reference</TableHead>
								<TableHead>Method</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Date</TableHead>
								<TableHead className="pr-4 w-[100px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transactions.map((tx) => (
								<TableRow key={tx.id}>
									<TableCell className="pl-4 font-medium">
										{tx.reference || tx.providerReference || `${tx.id.slice(0, 8)}…`}
									</TableCell>
									<TableCell>
										<Badge variant="outline">{getMethodDisplay(tx.method)}</Badge>
									</TableCell>
									<TableCell>
										<Badge variant="outline" className={getStatusBadgeClass(tx.status)}>
											{tx.status}
										</Badge>
									</TableCell>
									<TableCell>{formatCurrency(tx.amount, tx.currency)}</TableCell>
									<TableCell>{formatDate(tx.paidAt ?? tx.createdAt)}</TableCell>
									<TableCell className="pr-4">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onViewTransaction(tx)}
										>
											<Eye className="mr-1.5 h-4 w-4" />
											View
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
