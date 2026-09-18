"use client";

import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatInvoiceDate } from "@/lib/invoice-date";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { invoiceUiSchema, paymentTransactionUiSchema } from "./schemas";

function getInvoiceStatusLabel(status: string) {
	switch (status) {
		case "PARTIALLY_PAID":
			return "Partially Paid";
		case "WRITTEN_OFF":
			return "Written Off";
		default:
			return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
	}
}

function getInvoiceStatusVariant(status: string) {
	switch (status) {
		case "PAID":
			return "default" as const;
		case "OVERDUE":
		case "CANCELLED":
		case "WRITTEN_OFF":
			return "destructive" as const;
		case "PARTIALLY_PAID":
		case "DRAFT":
			return "secondary" as const;
		default:
			return "outline" as const;
	}
}

function getTransactionStatusLabel(status: string) {
	if (status === "PARTIALLY_REFUNDED") return "Partially Refunded";
	return status.charAt(0) + status.slice(1).toLowerCase();
}

function RecentListSkeleton() {
	return (
		<div className="divide-y">
			{Array.from({ length: 5 }).map((_, index) => (
				<div key={index} className="flex items-center justify-between gap-3 px-5 py-3.5">
					<div className="min-w-0 flex-1 space-y-1.5">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-3 w-24" />
					</div>
					<Skeleton className="h-4 w-16" />
				</div>
			))}
		</div>
	);
}

function RecentInvoices() {
	const { data, isLoading, isError } = trpc.invoicing.list.useQuery({
		limit: 6,
		offset: 0,
	});

	if (isLoading) return <RecentListSkeleton />;

	if (isError || !data) {
		return (
			<p className="px-5 py-8 text-center text-sm text-muted-foreground">
				Failed to load invoices
			</p>
		);
	}

	const invoices = data.invoices.map((invoice) =>
		invoiceUiSchema.parse({
			id: invoice.id,
			invoiceNumber: invoice.invoiceNumber,
			customerName: invoice.customerName,
			customerEmail: invoice.customerEmail,
			status: invoice.status,
			amount: invoice.amount,
			currency: invoice.currency,
			dueDate: invoice.dueDate,
			createdAt: invoice.createdAt,
			updatedAt: invoice.updatedAt,
		}),
	);

	if (invoices.length === 0) {
		return (
			<p className="px-5 py-8 text-center text-sm text-muted-foreground">No invoices yet</p>
		);
	}

	return (
		<div className="divide-y">
			{invoices.map((invoice) => (
				<Link
					key={invoice.id}
					to={`/agency/invoices/${invoice.id}`}
					className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
				>
					<div className="min-w-0">
						<p className="truncate text-sm font-medium">
							{invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}
						</p>
						<p className="truncate text-xs text-muted-foreground">
							{invoice.customerName || "No customer"}
						</p>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-1">
						<p className="text-sm font-medium tabular-nums">
							{invoice.amount
								? `${invoice.currency} ${parseFloat(invoice.amount).toLocaleString()}`
								: "—"}
						</p>
						<Badge variant={getInvoiceStatusVariant(invoice.status)} className="text-[10px]">
							{getInvoiceStatusLabel(invoice.status)}
						</Badge>
					</div>
				</Link>
			))}
		</div>
	);
}

function RecentTransactions() {
	const { data, isLoading, isError } = trpc.paymentTransactions.list.useQuery({
		limit: 6,
		offset: 0,
	});

	if (isLoading) return <RecentListSkeleton />;

	if (isError || !data) {
		return (
			<p className="px-5 py-8 text-center text-sm text-muted-foreground">
				Failed to load transactions
			</p>
		);
	}

	const transactions = data.transactions.map((transaction) =>
		paymentTransactionUiSchema.parse({
			id: transaction.id,
			userId: transaction.userId,
			teamId: transaction.teamId ?? null,
			userName: transaction.userName ?? null,
			gateway: transaction.gateway,
			status: transaction.status,
			amount: transaction.amount,
			currency: transaction.currency,
			accountReference: transaction.accountReference ?? null,
			transactionDesc: transaction.transactionDesc ?? null,
			receiptNumber: transaction.receiptNumber ?? null,
			initiatedAt: transaction.initiatedAt,
			processedAt: transaction.processedAt ?? null,
			failedAt: transaction.failedAt ?? null,
			createdAt: transaction.createdAt,
			updatedAt: transaction.updatedAt,
		}),
	);

	if (transactions.length === 0) {
		return (
			<p className="px-5 py-8 text-center text-sm text-muted-foreground">
				No transactions yet
			</p>
		);
	}

	return (
		<div className="divide-y">
			{transactions.map((transaction) => {
				const dateValue = transaction.processedAt
					? new Date(transaction.processedAt)
					: new Date(transaction.initiatedAt);
				return (
					<div
						key={transaction.id}
						className="flex items-center justify-between gap-3 px-5 py-3.5"
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">
								{transaction.accountReference ||
									transaction.receiptNumber ||
									transaction.id.slice(0, 8)}
							</p>
							<p className="text-xs text-muted-foreground">
								{Number.isNaN(dateValue.getTime()) ? "" : formatInvoiceDate(dateValue)}
							</p>
						</div>
						<div className="flex shrink-0 flex-col items-end gap-1">
							<p className="text-sm font-medium tabular-nums">
								{transaction.currency} {parseFloat(transaction.amount).toLocaleString()}
							</p>
							<Badge
								variant={transaction.status === "FAILED" ? "destructive" : "outline"}
								className={cn(
									"text-[10px]",
									transaction.status === "SUCCESS" &&
										"border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-200",
								)}
							>
								{getTransactionStatusLabel(transaction.status)}
							</Badge>
						</div>
					</div>
				);
			})}
		</div>
	);
}

export function RecentActivity() {
	return (
		<Card className="gap-0 overflow-hidden py-0">
			<Tabs defaultValue="invoices">
				<div className="flex items-center justify-between gap-3 border-b px-5 py-3">
					<CardTitle className="text-base">Recent activity</CardTitle>
					<TabsList className="h-8">
						<TabsTrigger value="invoices" className="text-xs">
							Invoices
						</TabsTrigger>
						<TabsTrigger value="payments" className="text-xs">
							Payments
						</TabsTrigger>
					</TabsList>
				</div>
				<CardContent className="p-0">
					<TabsContent value="invoices" className="mt-0">
						<RecentInvoices />
						<div className="border-t px-5 py-3">
							<Link
								to="/agency/invoices"
								className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
							>
								View all invoices
								<ArrowUpRight className="size-3.5" />
							</Link>
						</div>
					</TabsContent>
					<TabsContent value="payments" className="mt-0">
						<RecentTransactions />
						<div className="border-t px-5 py-3">
							<Link
								to="/agency/transactions"
								className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
							>
								View all transactions
								<ArrowUpRight className="size-3.5" />
							</Link>
						</div>
					</TabsContent>
				</CardContent>
			</Tabs>
		</Card>
	);
}
