"use client";

import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AgencyDashboardMetrics, CountValue } from "./use-agency-dashboard-metrics";

function displayCount(value: CountValue): string {
	return value == null ? "N/A" : String(value);
}

function SnapshotStat({
	label,
	value,
	tone,
}: {
	label: string;
	value: CountValue;
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
				{href ? (
					<ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden />
				) : null}
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

export function OperationsSnapshot({ metrics }: { metrics: AgencyDashboardMetrics }) {
	return (
		<section className="grid grid-cols-1 gap-4 @3xl/main:grid-cols-3">
			<Card className="gap-0 py-0">
				<CardHeader className="border-b px-5 py-4">
					<CardTitle className="text-base">Infrastructure</CardTitle>
				</CardHeader>
				<CardContent className="divide-y px-5 py-2">
					<SnapshotRow
						label="Domains"
						value={displayCount(metrics.domains.total)}
						href="/agency/domains-portfolio"
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
						href="/agency/hosting"
						loading={metrics.hosting.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Active" value={metrics.hosting.active} tone="positive" />
								<SnapshotStat label="Suspended" value={metrics.hosting.suspended} tone="negative" />
							</div>
						}
					/>
					<div className="space-y-1 py-3">
						<p className="text-sm font-medium text-foreground">Registrar balances</p>
						<div className="flex flex-col gap-2 pt-1">
							<a
								href="https://cp.openprovider.eu/"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-between gap-3 text-sm hover:text-primary"
							>
								<span className="text-muted-foreground">OP</span>
								<span
									className={cn(
										"font-semibold tabular-nums",
										metrics.balances.opError && "text-muted-foreground",
									)}
								>
									{metrics.balances.opLoading ? "…" : metrics.balances.op}
								</span>
							</a>
							<a
								href="https://registry.kenic.or.ke/"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-between gap-3 text-sm hover:text-primary"
							>
								<span className="text-muted-foreground">KC</span>
								<span
									className={cn(
										"font-semibold tabular-nums",
										metrics.balances.kcUnavailable && "text-muted-foreground",
									)}
								>
									{metrics.balances.kc}
								</span>
							</a>
						</div>
					</div>
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
						href="/agency/invoices"
						loading={metrics.invoices.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="KRA synced" value={metrics.invoices.kraSynced} tone="positive" />
								<SnapshotStat label="Not synced" value={metrics.invoices.notSynced} tone="negative" />
							</div>
						}
					/>
					<SnapshotRow
						label="Transactions"
						value={displayCount(metrics.transactions.total)}
						href="/agency/transactions"
						loading={metrics.transactions.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Success" value={metrics.transactions.success} tone="positive" />
								<SnapshotStat label="Failed" value={metrics.transactions.failed} tone="negative" />
							</div>
						}
					/>
					<SnapshotRow
						label="Orders"
						value={displayCount(metrics.orders.total)}
						href="/agency/nisc-service-orders"
						loading={metrics.orders.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Processed" value={metrics.orders.completed} tone="positive" />
								<SnapshotStat label="Failed" value={metrics.orders.failed} tone="negative" />
							</div>
						}
					/>
					<SnapshotRow
						label="Quotations"
						value={displayCount(metrics.quotations.total)}
						href="/agency/quotations"
						loading={metrics.quotations.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Pending" value={metrics.quotations.pending} tone="muted" />
								<SnapshotStat label="Closed" value={metrics.quotations.closed} tone="positive" />
							</div>
						}
					/>
				</CardContent>
			</Card>

			<Card className="gap-0 py-0">
				<CardHeader className="border-b px-5 py-4">
					<CardTitle className="text-base">People & support</CardTitle>
				</CardHeader>
				<CardContent className="divide-y px-5 py-2">
					<SnapshotRow
						label="Clients"
						value={displayCount(metrics.accounts.customers)}
						href="/agency/clients"
						loading={metrics.accounts.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Active" value={metrics.accounts.customerActive} tone="positive" />
								<SnapshotStat label="Inactive" value={metrics.accounts.customerInactive} tone="negative" />
							</div>
						}
					/>
					<SnapshotRow
						label="Agency users"
						value={displayCount(metrics.accounts.agency)}
						href="/agency/manage-users"
						loading={metrics.accounts.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Active" value={metrics.accounts.agencyActive} tone="positive" />
								<SnapshotStat label="Inactive" value={metrics.accounts.agencyInactive} tone="negative" />
							</div>
						}
					/>
					<SnapshotRow
						label="Tickets"
						value={displayCount(metrics.tickets.total)}
						href="/agency/support"
						loading={metrics.tickets.isLoading}
						stats={
							<div className="flex flex-wrap gap-x-3 gap-y-0.5">
								<SnapshotStat label="Open" value={metrics.tickets.open} tone="negative" />
								<SnapshotStat label="Closed" value={metrics.tickets.closed} tone="positive" />
							</div>
						}
					/>
					<div className="space-y-2 py-3">
						<div className="flex items-center justify-between gap-2">
							<p className="text-sm font-medium text-foreground">Media buying</p>
							<Link
								to="/agency/ad-campaigns"
								className="inline-flex items-center text-muted-foreground hover:text-foreground"
							>
								<ArrowUpRight className="size-3.5" aria-hidden />
							</Link>
						</div>
						{metrics.mediaBuying.isLoading ? (
							<Skeleton className="h-5 w-40" />
						) : metrics.mediaBuying.isError ? (
							<p className="text-xs text-muted-foreground">Unable to load platforms</p>
						) : (
							<div className="flex flex-wrap gap-1.5">
								{metrics.mediaBuying.platforms.map((platform) => (
									<Badge
										key={platform.key}
										variant={platform.connected ? "default" : "secondary"}
										className={cn(
											"text-[11px]",
											platform.connected && "bg-emerald-600 hover:bg-emerald-700",
										)}
									>
										{platform.name}
									</Badge>
								))}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</section>
	);
}
