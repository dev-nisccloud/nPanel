"use client";

import { Link } from "react-router";
import {
	AlertTriangle,
	CreditCard,
	FileWarning,
	Globe,
	LifeBuoy,
	ScrollText,
	ServerOff,
	ShoppingBag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgencyDashboardMetrics, CountValue } from "./use-agency-dashboard-metrics";

function positiveCount(value: CountValue): number | null {
	if (value == null || value <= 0) return null;
	return value;
}

export function NeedsAttention({ metrics }: { metrics: AgencyDashboardMetrics }) {
	const candidates = [
		{
			id: "tickets",
			title: "Open tickets",
			value: metrics.tickets.open,
			href: "/agency/support",
			icon: LifeBuoy,
			isLoading: metrics.tickets.isLoading,
		},
		{
			id: "expired-domains",
			title: "Expired domains",
			value: metrics.domains.expired,
			href: "/agency/domains-portfolio",
			icon: Globe,
			isLoading: metrics.domains.isLoading,
		},
		{
			id: "expiring-domains",
			title: "Expiring in 30 days",
			value: metrics.domains.expiringSoon,
			href: "/agency/domains-portfolio",
			icon: AlertTriangle,
			isLoading: metrics.domains.isLoading,
		},
		{
			id: "invoices",
			title: "Invoices not KRA-synced",
			value: metrics.invoices.notSynced,
			href: "/agency/invoices",
			icon: FileWarning,
			isLoading: metrics.invoices.isLoading,
		},
		{
			id: "orders",
			title: "Failed orders",
			value: metrics.orders.failed,
			href: "/agency/nisc-service-orders",
			icon: ShoppingBag,
			isLoading: metrics.orders.isLoading,
		},
		{
			id: "payments",
			title: "Failed payments",
			value: metrics.transactions.failed,
			href: "/agency/transactions",
			icon: CreditCard,
			isLoading: metrics.transactions.isLoading,
		},
		{
			id: "hosting",
			title: "Suspended hosting",
			value: metrics.hosting.suspended,
			href: "/agency/hosting",
			icon: ServerOff,
			isLoading: metrics.hosting.isLoading,
		},
		{
			id: "quotations",
			title: "Pending quotations",
			value: metrics.quotations.pending,
			href: "/agency/quotations",
			icon: ScrollText,
			isLoading: metrics.quotations.isLoading,
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
		<section className="rounded-xl border bg-card">
			<div className="flex items-center gap-2 border-b px-4 py-3">
				<p className="text-sm font-semibold">Needs attention</p>
				<Badge variant="secondary" className="tabular-nums">
					{items.length}
				</Badge>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
				{items.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.id}
							to={item.href}
							className="flex items-center justify-between gap-3 border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-muted/40 sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0"
						>
							<span className="flex min-w-0 items-center gap-2">
								<Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
								<span className="truncate">{item.title}</span>
							</span>
							<span className="font-semibold tabular-nums">{item.count}</span>
						</Link>
					);
				})}
			</div>
		</section>
	);
}
