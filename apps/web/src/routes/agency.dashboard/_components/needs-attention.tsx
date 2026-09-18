"use client";

import { Link } from "react-router";
import {
	AlertTriangle,
	ArrowRight,
	CreditCard,
	FileWarning,
	Globe,
	LifeBuoy,
	ScrollText,
	ServerOff,
	ShoppingBag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgencyDashboardMetrics, CountValue } from "./use-agency-dashboard-metrics";

type AttentionItem = {
	id: string;
	title: string;
	count: number;
	href: string;
	icon: typeof LifeBuoy;
};

function positiveCount(value: CountValue): number | null {
	if (value == null || value <= 0) return null;
	return value;
}

export function NeedsAttention({ metrics }: { metrics: AgencyDashboardMetrics }) {
	const candidates: Array<{
		id: string;
		title: string;
		value: CountValue;
		href: string;
		icon: typeof LifeBuoy;
		isLoading: boolean;
	}> = [
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
			title: "Domains expiring in 30 days",
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

	const items: AttentionItem[] = [];
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
			<Card className="gap-0 py-0">
				<div className="px-5 py-4">
					<Skeleton className="h-5 w-40" />
				</div>
				<CardContent className="space-y-3 px-5 pb-5">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-12 w-full rounded-lg" />
					))}
				</CardContent>
			</Card>
		);
	}

	if (items.length === 0) return null;

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="flex items-center justify-between gap-2 border-b px-5 py-4">
				<div className="flex items-center gap-2">
					<CardTitle className="text-base">Needs attention</CardTitle>
					<Badge variant="secondary" className="tabular-nums">
						{items.length}
					</Badge>
				</div>
			</div>
			<CardContent className="divide-y p-0">
				{items.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.id}
							to={item.href}
							className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
								<Icon className="size-4" aria-hidden />
							</div>
							<div className="min-w-0 flex-1 text-left">
								<p className="text-sm font-medium text-foreground">{item.title}</p>
								<p className="text-xs text-muted-foreground tabular-nums">
									{item.count} {item.count === 1 ? "item" : "items"}
								</p>
							</div>
							<ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
						</Link>
					);
				})}
			</CardContent>
		</Card>
	);
}
