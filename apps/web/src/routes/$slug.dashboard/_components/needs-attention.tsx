"use client";

import { Link } from "react-router";
import { FileWarning, Globe, Package, ServerOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerDashboardMetrics } from "./use-customer-dashboard-metrics";

function positiveCount(value: number | null): number | null {
	if (value == null || value <= 0) return null;
	return value;
}

export function NeedsAttention({ metrics }: { metrics: CustomerDashboardMetrics }) {
	const { teamSlug } = metrics;
	const candidates = [
		{
			id: "expired-domains",
			title: "Expired domains",
			value: metrics.domains.expired,
			href: `/${teamSlug}/domains-portfolio`,
			icon: Globe,
			isLoading: metrics.domains.isLoading,
		},
		{
			id: "unpaid-invoices",
			title: "Unpaid invoices",
			value: metrics.invoices.unpaid,
			href: `/${teamSlug}/invoices`,
			icon: FileWarning,
			isLoading: metrics.invoices.isLoading,
		},
		{
			id: "overdue-invoices",
			title: "Overdue invoices",
			value: metrics.invoices.overdue,
			href: `/${teamSlug}/invoices`,
			icon: FileWarning,
			isLoading: metrics.invoices.isLoading,
		},
		{
			id: "inactive-hosting",
			title: "Inactive hosting",
			value: metrics.hosting.inactive,
			href: `/${teamSlug}/hosting`,
			icon: ServerOff,
			isLoading: metrics.hosting.isLoading,
		},
		{
			id: "pending-subscriptions",
			title: "Pending or expired subscriptions",
			value: metrics.subscriptions.other,
			href: `/${teamSlug}/subscriptions`,
			icon: Package,
			isLoading: metrics.subscriptions.isLoading,
		},
	];

	const items = [];
	let stillLoading = false;

	for (const candidate of candidates) {
		if (candidate.isLoading) {
			stillLoading = true;
			continue;
		}
		const count = positiveCount(candidate.value);
		if (count == null) continue;
		items.push({
			id: candidate.id,
			title: candidate.title,
			count,
			href: candidate.href,
			icon: candidate.icon,
		});
	}

	if (items.length === 0 && stillLoading) {
		return (
			<div className="flex flex-wrap gap-2">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-9 w-36 rounded-full" />
				))}
			</div>
		);
	}

	if (items.length === 0) return null;

	return (
		<section className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<p className="text-sm font-medium text-foreground">Needs attention</p>
				<Badge variant="secondary" className="tabular-nums">
					{items.length}
				</Badge>
			</div>
			<div className="flex flex-wrap gap-2">
				{items.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.id}
							to={item.href}
							className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
						>
							<Icon className="size-3.5 text-muted-foreground" aria-hidden />
							<span>{item.title}</span>
							<span className="tabular-nums text-muted-foreground">{item.count}</span>
						</Link>
					);
				})}
			</div>
		</section>
	);
}
