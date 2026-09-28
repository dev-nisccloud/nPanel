"use client";

import type { ComponentType } from "react";
import { Link } from "react-router";

import { Icons } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CustomerDashboardMetrics } from "./use-customer-dashboard-metrics";

type CountValue = number | null;

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

export function KpiStatsGrid({ metrics }: { metrics: CustomerDashboardMetrics }) {
	const base = `/${metrics.teamSlug}`;

	return (
		<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard
				href={`${base}/domains-portfolio`}
				icon={Icons.Site}
				label="Domains"
				value={metrics.domains.total}
				detail={`${formatCount(metrics.domains.active)} active · ${formatCount(metrics.domains.expired)} expired`}
				loading={metrics.domains.isLoading}
				iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950"
			/>
			<StatCard
				href={`${base}/hosting`}
				icon={Icons.Hosting}
				label="Hosting"
				value={metrics.hosting.total}
				detail={`${formatCount(metrics.hosting.active)} active · ${formatCount(metrics.hosting.inactive)} inactive`}
				loading={metrics.hosting.isLoading}
				iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
			/>
			<StatCard
				href={`${base}/invoices`}
				icon={Icons.Invoices}
				label="Invoices"
				value={metrics.invoices.total}
				detail={`${formatCount(metrics.invoices.paid)} paid · ${formatCount(metrics.invoices.unpaid)} unpaid`}
				loading={metrics.invoices.isLoading}
				iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-950"
			/>
			<StatCard
				href={`${base}/subscriptions`}
				icon={Icons.Subscriptions}
				label="Subscriptions"
				value={metrics.subscriptions.total}
				detail={`${formatCount(metrics.subscriptions.active)} active · ${formatCount(metrics.subscriptions.other)} other`}
				loading={metrics.subscriptions.isLoading}
				iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950"
			/>
		</section>
	);
}
