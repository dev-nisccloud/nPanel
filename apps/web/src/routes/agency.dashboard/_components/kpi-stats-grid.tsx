"use client";

import type { ComponentType } from "react";
import { Link } from "react-router";

import { Icons } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AgencyDashboardMetrics, CountValue } from "./use-agency-dashboard-metrics";

function formatCount(value: CountValue): string {
	if (value == null) return "N/A";
	return value.toLocaleString();
}

function StatCard({
	href,
	icon: Icon,
	label,
	value,
	detail,
	loading,
	iconClassName,
}: {
	href: string;
	icon: ComponentType<{ className?: string; size?: number }>;
	label: string;
	value: CountValue;
	detail: string;
	loading?: boolean;
	iconClassName: string;
}) {
	return (
		<Link to={href} className="block h-full">
			<Card className="h-full gap-0 py-0 transition-colors hover:bg-muted/30">
				<CardContent className="flex h-full flex-col gap-3 p-5">
					<div className={cn("inline-flex w-fit rounded-lg p-2", iconClassName)}>
						<Icon size={20} />
					</div>
					<div>
						<p className="text-sm text-muted-foreground">{label}</p>
						{loading ? (
							<Skeleton className="mt-2 h-8 w-16" />
						) : (
							<p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
								{formatCount(value)}
							</p>
						)}
					</div>
					{loading ? (
						<Skeleton className="h-4 w-28" />
					) : (
						<p className="text-xs text-muted-foreground">{detail}</p>
					)}
				</CardContent>
			</Card>
		</Link>
	);
}

export function KpiStatsGrid({ metrics }: { metrics: AgencyDashboardMetrics }) {
	return (
		<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
			<StatCard
				href="/agency/domains-portfolio"
				icon={Icons.Site}
				label="Domains"
				value={metrics.domains.total}
				detail={`${formatCount(metrics.domains.active)} active · ${formatCount(metrics.domains.expired)} expired`}
				loading={metrics.domains.isLoading}
				iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950"
			/>
			<StatCard
				href="/agency/hosting"
				icon={Icons.Hosting}
				label="Hosting"
				value={metrics.hosting.total}
				detail={`${formatCount(metrics.hosting.active)} active · ${formatCount(metrics.hosting.suspended)} suspended`}
				loading={metrics.hosting.isLoading}
				iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
			/>
			<StatCard
				href="/agency/invoices"
				icon={Icons.Invoices}
				label="Invoices"
				value={metrics.invoices.total}
				detail={`${formatCount(metrics.invoices.kraSynced)} KRA synced · ${formatCount(metrics.invoices.notSynced)} pending`}
				loading={metrics.invoices.isLoading}
				iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-950"
			/>
			<StatCard
				href="/agency/nisc-service-orders"
				icon={Icons.Subscriptions}
				label="Orders"
				value={metrics.orders.total}
				detail={`${formatCount(metrics.orders.completed)} processed · ${formatCount(metrics.orders.failed)} failed`}
				loading={metrics.orders.isLoading}
				iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950"
			/>
			<StatCard
				href="/agency/support"
				icon={Icons.Help}
				label="Tickets"
				value={metrics.tickets.total}
				detail={`${formatCount(metrics.tickets.open)} open · ${formatCount(metrics.tickets.closed)} closed`}
				loading={metrics.tickets.isLoading}
				iconClassName="bg-rose-50 text-rose-600 dark:bg-rose-950"
			/>
		</section>
	);
}
