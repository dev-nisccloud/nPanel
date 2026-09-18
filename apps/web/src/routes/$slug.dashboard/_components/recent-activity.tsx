"use client";

import { Link, useLocation } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatInvoiceDate } from "@/lib/invoice-date";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { invoiceUiSchema } from "@/routes/agency.dashboard/_components/schemas";
import type { DashboardSubscriptionRow } from "./dashboard-subscriptions-schema";

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

	if (isLoading || !teamId) return <RecentListSkeleton />;

	if (isError || !data) {
		return (
			<p className="px-5 py-8 text-center text-sm text-muted-foreground">Failed to load invoices</p>
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
		return <p className="px-5 py-8 text-center text-sm text-muted-foreground">No invoices yet</p>;
	}

	return (
		<div className="divide-y">
			{invoices.map((invoice) => (
				<Link
					key={invoice.id}
					to={`/${teamSlug}/invoices/${invoice.id}`}
					className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
				>
					<div className="min-w-0">
						<p className="truncate text-sm font-medium">
							{invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}
						</p>
						<p className="truncate text-xs text-muted-foreground">
							{formatInvoiceDate(invoice.dueDate, "No due date")}
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

function RecentSubscriptions({ teamSlug }: { teamSlug: string }) {
	const { data, isLoading, isError } = trpc.clientSubscriptions.listForTeam.useQuery(
		{ teamSlug },
		{ enabled: Boolean(teamSlug), staleTime: 5 * 60 * 1000 },
	);

	if (isLoading) return <RecentListSkeleton />;

	if (isError || !data) {
		return (
			<p className="px-5 py-8 text-center text-sm text-muted-foreground">
				Failed to load subscriptions
			</p>
		);
	}

	const subscriptions: DashboardSubscriptionRow[] = data.slice(0, 6).map((sub) => {
		const nextDate = sub.nextRenewalDate ?? sub.expiryDate;
		return {
			id: sub.id,
			planName: displayServiceName(sub.productName, sub.productPlanName, sub.subscriptionName ?? null),
			planType: sub.productName,
			subscriptionDate: sub.subscriptionDate ? new Date(sub.subscriptionDate) : null,
			nextRenewalDate: nextDate ? new Date(nextDate) : null,
			status: sub.status as DashboardSubscriptionRow["status"],
		};
	});

	if (subscriptions.length === 0) {
		return (
			<p className="px-5 py-8 text-center text-sm text-muted-foreground">No subscriptions yet</p>
		);
	}

	return (
		<div className="divide-y">
			{subscriptions.map((sub) => {
				const isActive = sub.status === "ACTIVE";
				const isProblem = sub.status === "SUSPENDED" || sub.status === "EXPIRED";
				return (
					<Link
						key={sub.id}
						to={`/${teamSlug}/subscriptions`}
						className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{sub.planName}</p>
							<p className="truncate text-xs text-muted-foreground">
								{sub.nextRenewalDate
									? `Expires ${formatInvoiceDate(sub.nextRenewalDate)}`
									: sub.planType}
							</p>
						</div>
						<Badge
							variant={isActive ? "default" : isProblem ? "destructive" : "outline"}
							className={cn(
								"text-[10px]",
								isActive &&
									"border-green-600 bg-green-600 text-white hover:bg-green-600/90",
							)}
						>
							{sub.status.replace(/_/g, " ")}
						</Badge>
					</Link>
				);
			})}
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
		<Card className="gap-0 overflow-hidden py-0">
			<Tabs defaultValue="invoices">
				<div className="flex items-center justify-between gap-3 border-b px-5 py-3">
					<CardTitle className="text-base">Recent activity</CardTitle>
					<TabsList className="h-8">
						<TabsTrigger value="invoices" className="text-xs">
							Invoices
						</TabsTrigger>
						<TabsTrigger value="subscriptions" className="text-xs">
							Subscriptions
						</TabsTrigger>
					</TabsList>
				</div>
				<CardContent className="p-0">
					<TabsContent value="invoices" className="mt-0">
						<RecentInvoices teamSlug={teamSlug} teamId={teamData?.id} />
						<div className="border-t px-5 py-3">
							<Link
								to={`/${teamSlug}/invoices`}
								className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
							>
								View all invoices
								<ArrowUpRight className="size-3.5" />
							</Link>
						</div>
					</TabsContent>
					<TabsContent value="subscriptions" className="mt-0">
						<RecentSubscriptions teamSlug={teamSlug} />
						<div className="border-t px-5 py-3">
							<Link
								to={`/${teamSlug}/subscriptions`}
								className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
							>
								View all subscriptions
								<ArrowUpRight className="size-3.5" />
							</Link>
						</div>
					</TabsContent>
				</CardContent>
			</Tabs>
		</Card>
	);
}
