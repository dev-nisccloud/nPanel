"use client";

import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CustomerDashboardMetrics } from "./use-customer-dashboard-metrics";

function displayCount(value: number | null): string {
	return value == null ? "N/A" : String(value);
}

function SnapshotStat({
	label,
	value,
	tone,
}: {
	label: string;
	value: number | null;
	tone?: "positive" | "negative" | "muted";
}) {
	return (
		<span className="inline-flex items-baseline gap-1 text-xs">
			<span className="text-muted-foreground">{label}</span>
			<span
				className={cn(
					"font-semibold tabular-nums",
					tone === "positive" && "text-green-600 dark:text-green-400",
					tone === "negative" && "text-red-600 dark:text-red-400",
					(tone === "muted" || value == null) && "text-muted-foreground",
				)}
			>
				{displayCount(value)}
			</span>
		</span>
	);
}

function SnapshotRow({
	label,
	value,
	href,
	stats,
	loading,
}: {
	label: string;
	value: ReactNode;
	href?: string;
	stats?: ReactNode;
	loading?: boolean;
}) {
	const body = (
		<div className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
			<div className="min-w-0 space-y-1">
				<p className="text-sm font-medium text-foreground">{label}</p>
				{loading ? <Skeleton className="h-3 w-28" /> : stats}
			</div>
			<div className="flex shrink-0 items-center gap-1.5">
				{loading ? (
					<Skeleton className="h-6 w-12" />
				) : (
					<p className="text-lg font-semibold tabular-nums leading-none">{value}</p>
				)}
				{href ? <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden /> : null}
			</div>
		</div>
	);

	if (!href) return body;

	return (
		<Link to={href} className="block hover:bg-muted/40">
			{body}
		</Link>
	);
}

export function AccountSnapshot({ metrics }: { metrics: CustomerDashboardMetrics }) {
	const { teamSlug } = metrics;

	return (
		<section className="grid grid-cols-1 gap-4 @3xl/main:grid-cols-2">
			<Card className="gap-0 py-0">
				<CardHeader className="border-b px-5 py-4">
					<CardTitle className="text-base">Services</CardTitle>
				</CardHeader>
				<CardContent className="divide-y px-5 py-2">
					<SnapshotRow
						label="Domains"
						value={displayCount(metrics.domains.total)}
						href={`/${teamSlug}/domains-portfolio`}
						loading={metrics.domains.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Active" value={metrics.domains.active} tone="positive" />
								<SnapshotStat label="Expired" value={metrics.domains.expired} tone="negative" />
							</div>
						}
					/>
					<SnapshotRow
						label="Hosting"
						value={displayCount(metrics.hosting.total)}
						href={`/${teamSlug}/hosting`}
						loading={metrics.hosting.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Active" value={metrics.hosting.active} tone="positive" />
								<SnapshotStat label="Inactive" value={metrics.hosting.inactive} tone="negative" />
							</div>
						}
					/>
				</CardContent>
			</Card>

			<Card className="gap-0 py-0">
				<CardHeader className="border-b px-5 py-4">
					<CardTitle className="text-base">Billing</CardTitle>
				</CardHeader>
				<CardContent className="divide-y px-5 py-2">
					<SnapshotRow
						label="Invoices"
						value={displayCount(metrics.invoices.total)}
						href={`/${teamSlug}/invoices`}
						loading={metrics.invoices.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Paid" value={metrics.invoices.paid} tone="positive" />
								<SnapshotStat label="Unpaid" value={metrics.invoices.unpaid} tone="negative" />
							</div>
						}
					/>
					<SnapshotRow
						label="Subscriptions"
						value={displayCount(metrics.subscriptions.total)}
						href={`/${teamSlug}/subscriptions`}
						loading={metrics.subscriptions.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Active" value={metrics.subscriptions.active} tone="positive" />
								<SnapshotStat
									label="Pending/Expired"
									value={metrics.subscriptions.other}
									tone="negative"
								/>
							</div>
						}
					/>
				</CardContent>
			</Card>
		</section>
	);
}
