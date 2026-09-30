"use client";

import { Link, useLocation } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatInvoiceDate } from "@/lib/invoice-date";
import { trpc } from "@/utils/trpc";
import { invoiceUiSchema } from "@/routes/agency.dashboard/_components/schemas";
import type { DashboardSubscriptionRow } from "./dashboard-subscriptions-schema";
import {
	formatRemainingTokenCount,
	isZeepoTokenProduct,
} from "@/routes/agency.subscriptions/_components/zeepo-subscription";

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

function invoiceStatusClass(status: string) {
	if (status === "PAID") return "text-green-600";
	if (status === "OVERDUE" || status === "CANCELLED" || status === "WRITTEN_OFF") return "text-destructive";
	if (status === "SENT" || status === "UNPAID") return "text-primary";
	return "text-muted-foreground";
}

function subscriptionStatusClass(status: string) {
	if (status === "ACTIVE") return "text-green-600";
	if (status === "SUSPENDED" || status === "EXPIRED" || status === "CANCELLED") return "text-destructive";
	if (status === "PENDING") return "text-amber-600";
	return "text-muted-foreground";
}

function ActivityState({ message }: { message: string }) {
	return (
		<p className="flex flex-1 items-center justify-center px-5 py-6 text-sm text-muted-foreground">
			{message}
		</p>
	);
}

function TableSkeleton() {
	return (
		<div className="space-y-px p-2">
			{Array.from({ length: 5 }).map((_, index) => (
				<Skeleton key={index} className="h-12 w-full" />
			))}
		</div>
	);
}

function formatMoney(currency: string, amount: string | null | undefined) {
	if (!amount) return "—";
	const value = parseFloat(amount);
	if (Number.isNaN(value)) return "—";
	return `${currency} ${value.toLocaleString()}`;
}

function displayServiceName(
	productName: string,
	productPlanName: string | null,
	subscriptionName: string | null,
): string {
	const base = productPlanName?.trim() ? `${productName} - ${productPlanName}` : productName;
	return subscriptionName?.trim() ? `${base} (${subscriptionName})` : base;
}

function RecentInvoices({ teamSlug, teamId }: { teamSlug: string; teamId: string | undefined }) {
	const { data, isLoading, isError } = trpc.invoicing.list.useQuery(
		{ limit: 6, offset: 0, teamId },
		{ enabled: Boolean(teamId) },
	);

	if (isLoading || !teamId) return <TableSkeleton />;
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
						to={`/${teamSlug}/invoices/${invoice.id}`}
						className="flex items-baseline justify-between gap-4 px-4 py-2.5 hover:bg-muted/40"
					>
						<span className="min-w-0 truncate text-sm">
							<span className="font-medium">
								{invoice.invoiceNumber || invoice.id.slice(0, 8)}
							</span>
							<span className="text-muted-foreground">
								{" "}
								· {invoice.customerName || invoice.customerEmail || "Invoice"}
							</span>
						</span>
						<span className="flex shrink-0 items-baseline gap-2 text-sm">
							<span className="tabular-nums">{formatMoney(invoice.currency, invoice.amount)}</span>
							<span className={invoiceStatusClass(invoice.status)}>
								{getInvoiceStatusLabel(invoice.status)}
							</span>
						</span>
					</Link>
				</li>
			))}
		</ul>
	);
}

function RecentSubscriptions({ teamSlug }: { teamSlug: string }) {
	const { data, isLoading, isError } = trpc.clientSubscriptions.listForTeam.useQuery(
		{ teamSlug },
		{ enabled: Boolean(teamSlug), staleTime: 5 * 60 * 1000 },
	);

	if (isLoading) return <TableSkeleton />;
	if (isError || !data) return <ActivityState message="Failed to load subscriptions" />;

	const subscriptions: DashboardSubscriptionRow[] = data.slice(0, 6).map((sub) => {
		const nextDate = sub.nextRenewalDate ?? sub.expiryDate;
		return {
			id: sub.id,
			planName: displayServiceName(sub.productName, sub.productPlanName, sub.subscriptionName ?? null),
			planType: sub.productName,
			productId: sub.productId,
			billingCycle: sub.billingCycle,
			remainingTokens: sub.remainingTokens,
			subscriptionDate: sub.subscriptionDate ? new Date(sub.subscriptionDate) : null,
			nextRenewalDate: nextDate ? new Date(nextDate) : null,
			status: sub.status as DashboardSubscriptionRow["status"],
		};
	});

	if (subscriptions.length === 0) return <ActivityState message="No subscriptions yet" />;

	return (
		<ul>
			{subscriptions.map((sub) => (
				<li key={sub.id} className="border-b last:border-b-0">
					<Link
						to={`/${teamSlug}/subscriptions`}
						className="flex items-baseline justify-between gap-4 px-4 py-2.5 hover:bg-muted/40"
					>
						<span className="min-w-0 truncate text-sm">
							<span className="font-medium">{sub.planName}</span>
							<span className="text-muted-foreground">
								{isZeepoTokenProduct(sub.productId)
									? ` · Remaining tokens ${formatRemainingTokenCount(sub.remainingTokens)}`
									: ` · ${sub.planType}${sub.nextRenewalDate ? ` · Expires ${formatInvoiceDate(sub.nextRenewalDate)}` : ""}`}
							</span>
						</span>
						<span className={cnStatus(sub.status)}>{sub.status.replace(/_/g, " ")}</span>
					</Link>
				</li>
			))}
		</ul>
	);
}

function cnStatus(status: string) {
	return `shrink-0 text-sm ${subscriptionStatusClass(status)}`;
}

function ViewAllLink({ href, label }: { href: string; label: string }) {
	return (
		<div className="mt-auto flex justify-end border-t px-4 py-3">
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
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1] ?? "";
	const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: Boolean(teamSlug), staleTime: 5 * 60 * 1000 },
	);

	return (
		<Card className="flex h-full flex-col gap-0 overflow-hidden py-0">
			<Tabs defaultValue="invoices" className="flex h-full flex-col">
				<div className="flex items-center justify-between gap-3 border-b px-5 py-3">
					<CardTitle className="text-sm">Recent activity</CardTitle>
					<TabsList className="h-8">
						<TabsTrigger value="invoices" className="text-xs">
							Invoices
						</TabsTrigger>
						<TabsTrigger value="subscriptions" className="text-xs">
							Subscriptions
						</TabsTrigger>
					</TabsList>
				</div>
				<CardContent className="flex flex-1 flex-col p-0">
					<TabsContent value="invoices" className="mt-0 flex flex-1 flex-col">
						<RecentInvoices teamSlug={teamSlug} teamId={teamData?.id} />
						<ViewAllLink href={`/${teamSlug}/invoices`} label="View all invoices" />
					</TabsContent>
					<TabsContent value="subscriptions" className="mt-0 flex flex-1 flex-col">
						<RecentSubscriptions teamSlug={teamSlug} />
						<ViewAllLink href={`/${teamSlug}/subscriptions`} label="View all subscriptions" />
					</TabsContent>
				</CardContent>
			</Tabs>
		</Card>
	);
}
