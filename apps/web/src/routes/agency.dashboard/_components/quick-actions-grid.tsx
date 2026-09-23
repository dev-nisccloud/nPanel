"use client";

import type { ComponentType } from "react";
import { Link } from "react-router";
import { FileText, Server, Ticket, UserPlus } from "lucide-react";

const actions: {
	icon: ComponentType<{ className?: string }>;
	label: string;
	description: string;
	href: string;
}[] = [
	{
		icon: FileText,
		label: "Create invoice",
		description: "Bill a client",
		href: "/agency/invoices/create",
	},
	{
		icon: Server,
		label: "Hosting",
		description: "Open subscriptions",
		href: "/agency/hosting",
	},
	{
		icon: UserPlus,
		label: "Clients",
		description: "Manage accounts",
		href: "/agency/clients",
	},
	{
		icon: Ticket,
		label: "Support",
		description: "Open the queue",
		href: "/agency/support",
	},
];

export function QuickActionsGrid() {
	return (
		<section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
