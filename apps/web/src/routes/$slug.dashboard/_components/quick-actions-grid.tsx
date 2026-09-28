"use client";

import type { ComponentType } from "react";
import { Link, useLocation } from "react-router";
import { Globe, Receipt, Server, Store } from "lucide-react";

export function QuickActionsGrid() {
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1] ?? "";
	const base = `/${teamSlug}`;

	const actions: {
		icon: ComponentType<{ className?: string }>;
		label: string;
		description: string;
		href: string;
	}[] = [
		{
			icon: Globe,
			label: "Register domain",
			description: "Search and buy",
			href: `${base}/domains`,
		},
		{
			icon: Server,
			label: "Hosting",
			description: "Open your sites",
			href: `${base}/hosting`,
		},
		{
			icon: Receipt,
			label: "Invoices",
			description: "View billing",
			href: `${base}/invoices`,
		},
		{
			icon: Store,
			label: "Marketplace",
			description: "Add a service",
			href: `${base}/marketplace`,
		},
	];

	return (
		<section className="grid grid-cols-2 gap-3">
			{actions.map((action) => {
				const Icon = action.icon;
				return (
					<Link
						key={action.href}
						to={action.href}
						className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
					>
						<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
							<Icon className="size-4" />
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-medium">{action.label}</span>
							<span className="block truncate text-xs text-muted-foreground">{action.description}</span>
						</span>
					</Link>
				);
			})}
		</section>
	);
}
