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
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, User, Building2, FileJson } from "lucide-react";
import { trpc } from "@/utils/trpc";

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return "- ";
	const d = v instanceof Date ? v : new Date(v);
	return Number.isNaN(d.getTime()) ? "- " : d.toLocaleString();
}

function getStatusBadgeClass(status: string): string {
	const m: Record<string, string> = {
		SUCCESS: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
		PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
		PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800",
		FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
		CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
		REFUNDED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
		PARTIALLY_REFUNDED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
	};
	return m[status] ?? "";
}

function getGatewayDisplay(gateway: string): string {
	return gateway === "MPESA" ? "M-Pesa" : gateway;
}

interface TransactionViewSheetProps {
	transactionId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function TransactionViewSheet({
	transactionId,
	open,
	onOpenChange,
}: TransactionViewSheetProps) {
	const { data: tx, isLoading } = trpc.paymentTransactions.getById.useQuery(
		{ id: transactionId! },
		{ enabled: open && !!transactionId },
	);

	const refLabel =
		tx?.accountReference ?? tx?.receiptNumber ?? (tx ? `${tx.id.slice(0, 12)}…` : "- ");

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
				<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Receipt className="h-6 w-6 text-primary" />
						</div>
						<div className="min-w-0 flex-1">
							<SheetTitle className="truncate">
								{transactionId && isLoading ? (
									<Skeleton className="h-6 w-48" />
								) : (
									refLabel
								)}
							</SheetTitle>
							<SheetDescription>
								Payment transaction details
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{isLoading ? (
					<div className="flex-1 space-y-4 px-6 py-4">
						<Skeleton className="h-20 w-full rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
					</div>
				) : tx ? (
					<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
						<div className="space-y-6 pb-6">
							{/* Overview */}
							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<span className="text-muted-foreground">Status</span>
										<Badge variant="outline" className={getStatusBadgeClass(tx.status)}>
											{tx.status}
										</Badge>
									</div>
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Gateway</span>
										<span className="font-medium">{getGatewayDisplay(tx.gateway)}</span>
									</div>
									<div className="flex items-center gap-2">
										<User className="h-4 w-4 text-muted-foreground shrink-0" />
										<span className="text-muted-foreground">Name</span>
										<span className="font-medium">{tx.userName ?? tx.userId ?? "- "}</span>
									</div>
									{tx.teamId && (
										<div className="flex items-center gap-2">
											<Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="text-muted-foreground">Team</span>
											<span className="font-medium">{tx.teamName ?? tx.teamId}</span>
										</div>
									)}
								</div>
							</section>

							{/* Identifiers */}
							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Identifiers</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex justify-between items-center gap-2 break-all">
										<span className="text-muted-foreground shrink-0">ID</span>
										<span className="font-mono text-xs">{tx.id}</span>
									</div>
									{tx.accountReference && (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Account reference</span>
											<span className="font-medium">{tx.accountReference}</span>
										</div>
									)}
									{tx.receiptNumber && (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">MPESA Receipt number</span>
											<span className="font-medium">{tx.receiptNumber}</span>
										</div>
									)}
									{tx.gatewayTransactionId && (
										<div className="flex justify-between items-center gap-2 break-all">
											<span className="text-muted-foreground shrink-0">Gateway transaction ID</span>
											<span className="font-mono text-xs">{tx.gatewayTransactionId}</span>
										</div>
									)}
									{tx.merchantRequestId && (
										<div className="flex justify-between items-center gap-2 break-all">
											<span className="text-muted-foreground shrink-0">Merchant request ID</span>
											<span className="font-mono text-xs">{tx.merchantRequestId}</span>
										</div>
									)}
									{tx.checkoutRequestId && (
										<div className="flex justify-between items-center gap-2 break-all">
											<span className="text-muted-foreground shrink-0">Checkout request ID</span>
											<span className="font-mono text-xs">{tx.checkoutRequestId}</span>
										</div>
									)}
									{tx.gatewayStatus && (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Gateway status</span>
											<span className="font-medium">{tx.gatewayStatus}</span>
										</div>
									)}
									{tx.gatewayMessage && (
										<div className="flex justify-between items-start gap-2">
											<span className="text-muted-foreground shrink-0">Gateway message</span>
											<span className="text-right text-xs">{tx.gatewayMessage}</span>
										</div>
									)}
								</div>
							</section>

							{/* Payment details */}
							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Payment details</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Amount</span>
										<span className="font-medium">{tx.currency} {tx.amount}</span>
									</div>
									{tx.paidAmount != null && (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Paid amount</span>
											<span className="font-medium">{tx.currency} {tx.paidAmount}</span>
										</div>
									)}
									{tx.transactionDesc && (
										<div className="flex justify-between items-start gap-2">
											<span className="text-muted-foreground shrink-0">Description</span>
											<span className="text-right text-xs">{tx.transactionDesc}</span>
										</div>
									)}
									{tx.phoneNumber && (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Phone number</span>
											<span className="font-medium">{tx.phoneNumber}</span>
										</div>
									)}
								</div>
							</section>

							{/* Dates */}
							<section className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
								<div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Initiated</span>
										<span className="font-medium">{formatDate(tx.initiatedAt)}</span>
									</div>
									{tx.processedAt && (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Processed</span>
											<span className="font-medium">{formatDate(tx.processedAt)}</span>
										</div>
									)}
									{tx.failedAt && (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Failed</span>
											<span className="font-medium">{formatDate(tx.failedAt)}</span>
										</div>
									)}
									{tx.refundedAt && (
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Refunded</span>
											<span className="font-medium">{formatDate(tx.refundedAt)}</span>
										</div>
									)}
									<div className="flex justify-between items-center gap-2">
										<span className="text-muted-foreground">Created</span>
										<span className="font-medium">{formatDate(tx.createdAt)}</span>
									</div>
								</div>
							</section>

							{tx.notes && (
								<section className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
									<div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
										{tx.notes}
									</div>
								</section>
							)}

							{/* Raw response */}
							{tx.rawResponse != null && (
								<section className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
										<FileJson className="h-4 w-4" />
										Raw response
									</h3>
									<pre className="rounded-lg border bg-card p-4 text-xs overflow-auto max-h-64 font-mono whitespace-pre-wrap break-words">
										{typeof tx.rawResponse === "string"
											? tx.rawResponse
											: JSON.stringify(tx.rawResponse, null, 2)}
									</pre>
								</section>
							)}

							{/* Raw error */}
							{tx.rawError != null && (
								<section className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 text-destructive">
										<FileJson className="h-4 w-4" />
										Raw error
									</h3>
									<pre className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs overflow-auto max-h-64 font-mono whitespace-pre-wrap break-words text-destructive">
										{typeof tx.rawError === "string"
											? tx.rawError
											: JSON.stringify(tx.rawError, null, 2)}
									</pre>
								</section>
							)}
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
