"use client";

import { Link, useLocation } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	RecentActivityEmpty,
	RecentActivityGrid,
	RecentActivitySkeleton,
	RecentActivityStatusBadge,
	RecentActivityTile,
} from "@/components/dashboard/recent-activity-tiles";
import { formatInvoiceDate } from "@/lib/invoice-date";
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

function invoiceTone(status: string): "positive" | "negative" | "muted" | "default" {
	if (status === "PAID") return "positive";
	if (status === "OVERDUE" || status === "CANCELLED" || status === "WRITTEN_OFF") return "negative";
	if (status === "DRAFT" || status === "PARTIALLY_PAID") return "muted";
	return "default";
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

	if (isLoading || !teamId) return <RecentActivitySkeleton />;
	if (isError || !data) return <RecentActivityEmpty message="Failed to load invoices" />;

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

	if (invoices.length === 0) return <RecentActivityEmpty message="No invoices yet" />;

	return (
		<RecentActivityGrid>
			{invoices.map((invoice) => (
				<RecentActivityTile
					key={invoice.id}
					href={`/${teamSlug}/invoices/${invoice.id}`}
					title={invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}
					subtitle={invoice.customerName || invoice.customerEmail || "Invoice"}
					amount={formatMoney(invoice.currency, invoice.amount)}
					meta={`Due ${formatInvoiceDate(invoice.dueDate, "no date")}`}
					badge={
						<RecentActivityStatusBadge
							label={getInvoiceStatusLabel(invoice.status)}
							tone={invoiceTone(invoice.status)}
						/>
					}
				/>
			))}
		</RecentActivityGrid>
	);
}

function RecentSubscriptions({ teamSlug }: { teamSlug: string }) {
	const { data, isLoading, isError } = trpc.clientSubscriptions.listForTeam.useQuery(
		{ teamSlug },
		{ enabled: Boolean(teamSlug), staleTime: 5 * 60 * 1000 },
	);

	if (isLoading) return <RecentActivitySkeleton />;
	if (isError || !data) return <RecentActivityEmpty message="Failed to load subscriptions" />;

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

	if (subscriptions.length === 0) return <RecentActivityEmpty message="No subscriptions yet" />;

	return (
		<RecentActivityGrid>
			{subscriptions.map((sub) => {
				const isActive = sub.status === "ACTIVE";
				const isProblem = sub.status === "SUSPENDED" || sub.status === "EXPIRED";
				return (
					<RecentActivityTile
						key={sub.id}
						href={`/${teamSlug}/subscriptions`}
						title={sub.planName}
						subtitle={sub.planType}
						meta={
							sub.nextRenewalDate
								? `Expires ${formatInvoiceDate(sub.nextRenewalDate)}`
								: undefined
						}
						badge={
							<RecentActivityStatusBadge
								label={sub.status.replace(/_/g, " ")}
								tone={isActive ? "positive" : isProblem ? "negative" : "muted"}
							/>
						}
					/>
				);
			})}
		</RecentActivityGrid>
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
						<ViewAllLink href={`/${teamSlug}/invoices`} label="View all invoices" />
					</TabsContent>
					<TabsContent value="subscriptions" className="mt-0">
						<RecentSubscriptions teamSlug={teamSlug} />
						<ViewAllLink href={`/${teamSlug}/subscriptions`} label="View all subscriptions" />
					</TabsContent>
				</CardContent>
			</Tabs>
		</Card>
	);
}
