"use client";

import * as React from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Receipt, FileJson } from "lucide-react";
import type { InvoiceTransaction } from "@/routes/agency.invoices/create/api/schemas";

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return "—";
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
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
	const m: Record<string, string> = {
		COMPLETED:
			"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
		PENDING:
			"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
		FAILED:
			"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
		REFUNDED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
	};
	return m[status] ?? "";
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

interface InvoiceTransactionViewSheetProps {
	transaction: InvoiceTransaction | null;
	invoiceNumber?: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function InvoiceTransactionViewSheet({
	transaction,
	invoiceNumber,
	open,
	onOpenChange,
}: InvoiceTransactionViewSheetProps) {
	const refLabel =
		transaction?.reference ??
		transaction?.providerReference ??
		(transaction ? `${transaction.id.slice(0, 12)}…` : "—");

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
				<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Receipt className="h-6 w-6 text-primary" />
						</div>
						<div className="min-w-0 flex-1">
							<SheetTitle className="truncate">{refLabel}</SheetTitle>
							<SheetDescription>
								{invoiceNumber
									? `Payment transaction for ${invoiceNumber}`
									: "Invoice payment transaction details"}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{transaction ? (
					<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
						<div className="space-y-6 pb-6">
							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<span className="text-muted-foreground">Status</span>
										<Badge
											variant="outline"
											className={getStatusBadgeClass(transaction.status)}
										>
											{transaction.status}
										</Badge>
									</div>
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Method</span>
										<span className="font-medium">
											{getMethodDisplay(transaction.method)}
										</span>
									</div>
									{invoiceNumber ? (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Invoice</span>
											<span className="font-medium">{invoiceNumber}</span>
										</div>
									) : null}
								</div>
							</section>

							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Identifiers</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex justify-between items-center gap-2 break-all">
										<span className="text-muted-foreground shrink-0">ID</span>
										<span className="font-mono text-xs">{transaction.id}</span>
									</div>
									{transaction.reference ? (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Reference</span>
											<span className="font-medium">{transaction.reference}</span>
										</div>
									) : null}
									{transaction.providerReference ? (
										<div className="flex justify-between items-center gap-2 break-all">
											<span className="text-muted-foreground shrink-0">
												Provider reference
											</span>
											<span className="font-mono text-xs">
												{transaction.providerReference}
											</span>
										</div>
									) : null}
									{transaction.recordedBy ? (
										<div className="flex justify-between items-center gap-2 break-all">
											<span className="text-muted-foreground shrink-0">Recorded by</span>
											<span className="font-mono text-xs">{transaction.recordedBy}</span>
										</div>
									) : null}
								</div>
							</section>

							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Payment details</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Amount</span>
										<span className="font-medium">
											{formatCurrency(transaction.amount, transaction.currency)}
										</span>
									</div>
									{transaction.balanceBefore != null ? (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Balance before</span>
											<span className="font-medium">
												{formatCurrency(transaction.balanceBefore, transaction.currency)}
											</span>
										</div>
									) : null}
									{transaction.balanceAfter != null ? (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Balance after</span>
											<span className="font-medium">
												{formatCurrency(transaction.balanceAfter, transaction.currency)}
											</span>
										</div>
									) : null}
								</div>
							</section>

							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Paid at</span>
										<span className="font-medium">{formatDate(transaction.paidAt)}</span>
									</div>
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Created</span>
										<span className="font-medium">{formatDate(transaction.createdAt)}</span>
									</div>
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Updated</span>
										<span className="font-medium">{formatDate(transaction.updatedAt)}</span>
									</div>
								</div>
							</section>

							{transaction.notes ? (
								<section className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
									<div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
										{transaction.notes}
									</div>
								</section>
							) : null}

							{transaction.activityLogs && transaction.activityLogs.length > 0 ? (
								<section className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">Activity</h3>
									<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
										{transaction.activityLogs.map((log) => (
											<div key={log.id} className="space-y-0.5 border-b last:border-0 pb-2 last:pb-0">
												<div className="flex justify-between gap-2">
													<span className="font-medium">{log.action}</span>
													<span className="text-muted-foreground text-xs">
														{formatDate(log.createdAt)}
													</span>
												</div>
												{log.description ? (
													<p className="text-muted-foreground text-xs">{log.description}</p>
												) : null}
											</div>
										))}
									</div>
								</section>
							) : null}

							{transaction.metadata != null ? (
								<section className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
										<FileJson className="h-4 w-4" />
										Metadata
									</h3>
									<pre className="rounded-lg border bg-card p-4 text-xs overflow-auto max-h-64 font-mono whitespace-pre-wrap break-words">
										{typeof transaction.metadata === "string"
											? transaction.metadata
											: JSON.stringify(transaction.metadata, null, 2)}
									</pre>
								</section>
							) : null}
						</div>
					</ScrollArea>
				) : (
					<div className="flex-1 flex items-center justify-center px-6 py-12 text-sm text-muted-foreground">
						Transaction not found
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
