"use client";

import { Link } from "react-router";
import {
	ArrowRight,
	FileText,
	Globe,
	Mail,
	Megaphone,
	ScrollText,
	Server,
	UserPlus,
} from "lucide-react";

import { Card, CardContent, CardTitle } from "@/components/ui/card";

const ACTIONS = [
	{
		title: "Register a domain",
		description: "Search and register a domain for a client",
		href: "/agency/domains",
		icon: Globe,
	},
	{
		title: "New invoice",
		description: "Create and send a client invoice",
		href: "/agency/invoices/create",
		icon: FileText,
	},
	{
		title: "New quotation",
		description: "Draft a quotation",
		href: "/agency/quotations/create",
		icon: ScrollText,
	},
	{
		title: "Add a client",
		description: "Create a client account",
		href: "/agency/clients",
		icon: UserPlus,
	},
	{
		title: "Email campaign",
		description: "Open email marketing campaigns",
		href: "/agency/nisc-email-marketing/campaigns",
		icon: Mail,
	},
] as const;

const CLOUD_SERVERS = [
	{ title: "VPS", href: "/agency/vps" },
	{ title: "VDS", href: "/agency/vds" },
	{ title: "Dedicated", href: "/agency/dedicated-servers" },
] as const;

const MEDIA_BUYING = [
	{ title: "Facebook Ads", href: "/agency/ad-campaigns/meta-ads" },
	{ title: "Instagram Ads", href: "/agency/ad-campaigns/instagram-ads" },
	{ title: "Google Ads", href: "/agency/ad-campaigns/google-ads" },
	{ title: "LinkedIn Ads", href: "/agency/ad-campaigns/linkedin-ads" },
] as const;

function SubLinks({ items }: { items: readonly { title: string; href: string }[] }) {
	return (
		<div className="flex flex-wrap gap-1.5 pt-1">
			{items.map((item) => (
				<Link
					key={item.href}
					to={item.href}
					className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					{item.title}
				</Link>
			))}
		</div>
	);
}

export function GetStarted() {
	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="border-b px-5 py-4">
				<CardTitle className="text-base">Get started</CardTitle>
			</div>
			<CardContent className="divide-y p-0">
				{ACTIONS.map((action) => {
					const Icon = action.icon;
					return (
						<Link
							key={action.href}
							to={action.href}
							className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
								<Icon className="size-4" aria-hidden />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-foreground">{action.title}</p>
								<p className="truncate text-xs text-muted-foreground">{action.description}</p>
							</div>
							<ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
						</Link>
					);
				})}

				<div className="flex items-start gap-3 px-5 py-3.5">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<Server className="size-4" aria-hidden />
					</div>
					<div className="min-w-0 flex-1">
						<Link
							to="/agency/vps"
							className="text-sm font-medium text-foreground hover:underline"
						>
							Cloud servers
						</Link>
						<p className="text-xs text-muted-foreground">VPS, VDS, and dedicated servers</p>
						<SubLinks items={CLOUD_SERVERS} />
					</div>
				</div>

				<div className="flex items-start gap-3 px-5 py-3.5">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<Megaphone className="size-4" aria-hidden />
					</div>
					<div className="min-w-0 flex-1">
						<Link
							to="/agency/ad-campaigns"
							className="text-sm font-medium text-foreground hover:underline"
						>
							Media buying
						</Link>
						<p className="text-xs text-muted-foreground">Facebook, Instagram, Google, LinkedIn</p>
						<SubLinks items={MEDIA_BUYING} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
