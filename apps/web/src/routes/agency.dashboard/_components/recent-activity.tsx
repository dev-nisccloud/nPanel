"use client";

import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatInvoiceDate } from "@/lib/invoice-date";
import { trpc } from "@/utils/trpc";
import { invoiceUiSchema, paymentTransactionUiSchema } from "./schemas";

function invoiceStatusClass(status: string) {
	if (status === "PAID") return "text-green-600";
	if (status === "OVERDUE") return "text-destructive";
	if (status === "SENT") return "text-primary";
	return "text-muted-foreground";
}

function paymentStatusClass(status: string) {
	if (status === "SUCCESS") return "text-green-600";
	if (status === "FAILED" || status === "CANCELLED") return "text-destructive";
	if (status === "PENDING" || status === "PROCESSING") return "text-amber-600";
	return "text-muted-foreground";
}

function paymentStatusLabel(status: string) {
	if (status === "PARTIALLY_REFUNDED") return "Partially Refunded";
	return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatMoney(currency: string, amount: string | null | undefined) {
	if (!amount) return "—";
	const value = parseFloat(amount);
	if (Number.isNaN(value)) return "—";
	return `${currency} ${value.toLocaleString()}`;
}

function ActivityState({ message }: { message: string }) {
	return (
		<p className="flex min-h-[180px] items-center justify-center px-5 text-sm text-muted-foreground">
			{message}
		</p>
	);
}

function TableSkeleton() {
	return (
		<div className="space-y-px p-2">
			{Array.from({ length: 5 }).map((_, index) => (
				<Skeleton key={index} className="h-14 w-full" />
			))}
		</div>
	);
}

function RecentInvoices() {
	const { data, isLoading, isError } = trpc.invoicing.list.useQuery({
		limit: 5,
		offset: 0,
	});

	if (isLoading) return <TableSkeleton />;
	if (isError || !data) return <ActivityState message="Failed to load invoices" />;

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

	if (invoices.length === 0) return <ActivityState message="No invoices yet" />;

	return (
		<ul>
			{invoices.map((invoice) => (
				<li key={invoice.id} className="border-b last:border-b-0">
					<Link
						to={`/agency/invoices/${invoice.id}`}
						className="flex items-baseline justify-between gap-4 px-4 py-2.5 hover:bg-muted/40"
					>
						<span className="min-w-0 truncate text-sm">
							<span className="font-medium">{invoice.invoiceNumber || invoice.id.slice(0, 8)}</span>
							<span className="text-muted-foreground"> · {invoice.customerName || "No customer"}</span>
						</span>
						<span className="flex shrink-0 items-baseline gap-2 text-sm">
							<span className="tabular-nums">{formatMoney(invoice.currency, invoice.amount)}</span>
							<span className={invoiceStatusClass(invoice.status)}>
								{invoice.status.replaceAll("_", " ")}
							</span>
						</span>
					</Link>
				</li>
			))}
		</ul>
	);
}

function RecentTransactions() {
	const { data, isLoading, isError } = trpc.paymentTransactions.list.useQuery({
		limit: 5,
		offset: 0,
	});

	if (isLoading) return <TableSkeleton />;
	if (isError || !data) return <ActivityState message="Failed to load transactions" />;

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

	if (transactions.length === 0) return <ActivityState message="No transactions yet" />;

	return (
		<ul>
			{transactions.map((transaction) => {
				const dateValue = transaction.processedAt
					? new Date(transaction.processedAt)
					: new Date(transaction.initiatedAt);
				const title =
					transaction.accountReference ||
					transaction.receiptNumber ||
					transaction.id.slice(0, 8);
				return (
					<li key={transaction.id} className="border-b last:border-b-0">
						<Link
							to="/agency/transactions"
							className="flex items-baseline justify-between gap-4 px-4 py-2.5 hover:bg-muted/40"
						>
							<span className="min-w-0 truncate text-sm">
								<span className="font-medium">{title}</span>
								<span className="text-muted-foreground">
									{" "}
									· {transaction.gateway}
									{Number.isNaN(dateValue.getTime()) ? "" : ` · ${formatInvoiceDate(dateValue)}`}
								</span>
							</span>
							<span className="flex shrink-0 items-baseline gap-2 text-sm">
								<span className="tabular-nums">{formatMoney(transaction.currency, transaction.amount)}</span>
								<span className={paymentStatusClass(transaction.status)}>
									{paymentStatusLabel(transaction.status)}
								</span>
							</span>
						</Link>
					</li>
				);
			})}
		</ul>
	);
}

function ViewAllLink({ href, label }: { href: string; label: string }) {
	return (
		<div className="flex justify-end border-t px-4 py-3">
			<Button variant="ghost" size="sm" asChild>
				<Link to={href}>
					{label}
					<ArrowUpRight className="size-3.5" />
				</Link>
			</Button>
		</div>
	);
}

export function RecentActivity() {
	return (
		<Card className="h-full gap-0 overflow-hidden py-0">
			<Tabs defaultValue="invoices">
				<div className="flex items-center justify-between gap-3 border-b px-5 py-3">
					<CardTitle className="text-sm">Recent activity</CardTitle>
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
						<ViewAllLink href="/agency/invoices" label="View all invoices" />
					</TabsContent>
					<TabsContent value="payments" className="mt-0">
						<RecentTransactions />
						<ViewAllLink href="/agency/transactions" label="View all transactions" />
					</TabsContent>
				</CardContent>
			</Tabs>
		</Card>
	);
}
