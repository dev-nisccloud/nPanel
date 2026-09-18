"use client";

import { Link } from "react-router";
import { ArrowRight, FileWarning, Globe, Package, ServerOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerDashboardMetrics } from "./use-customer-dashboard-metrics";

type AttentionItem = {
	id: string;
	title: string;
	count: number;
	href: string;
	icon: typeof Globe;
};

function positiveCount(value: number | null): number | null {
	if (value == null || value <= 0) return null;
	return value;
}

export function NeedsAttention({ metrics }: { metrics: CustomerDashboardMetrics }) {
	const { teamSlug } = metrics;
	const candidates: Array<{
		id: string;
		title: string;
		value: number | null;
		href: string;
		icon: typeof Globe;
		isLoading: boolean;
	}> = [
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
