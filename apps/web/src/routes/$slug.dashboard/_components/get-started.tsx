"use client";

import { Link, useLocation } from "react-router";
import {
	ArrowRight,
	Globe,
	LayoutTemplate,
	Mail,
	Megaphone,
	Server,
	Store,
} from "lucide-react";

import { Card, CardContent, CardTitle } from "@/components/ui/card";

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
	const { pathname } = useLocation();
	const teamSlug = pathname.split("/")[1] ?? "";
	const base = `/${teamSlug}`;

	const actions = [
		{
			title: "Register a domain",
			description: "Search and register a domain for your business",
			href: `${base}/domains`,
			icon: Globe,
		},
		{
			title: "Get hosting",
			description: "Launch website hosting for your company",
			href: `${base}/hosting`,
			icon: Server,
		},
		{
			title: "WordPress",
			description: "Set up a managed WordPress site",
			href: `${base}/wordpress`,
			icon: LayoutTemplate,
		},
		{
			title: "Business email",
			description: "Create professional email for your domain",
			href: `${base}/emails`,
			icon: Mail,
		},
		{
			title: "Marketplace",
			description: "Browse more services and plans",
			href: `${base}/marketplace`,
			icon: Store,
		},
	] as const;

	const cloudServers = [
		{ title: "VPS", href: `${base}/vps` },
		{ title: "VDS", href: `${base}/vds` },
		{ title: "Dedicated", href: `${base}/dedicated-servers` },
	] as const;

	const mediaBuying = [
		{ title: "Meta Ads", href: `${base}/ad-campaigns/meta-ads` },
		{ title: "Google Ads", href: `${base}/ad-campaigns/google-ads` },
		{ title: "LinkedIn Ads", href: `${base}/ad-campaigns/linkedin-ads` },
	] as const;

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="border-b px-5 py-4">
				<CardTitle className="text-base">Get started</CardTitle>
			</div>
			<CardContent className="divide-y p-0">
				{actions.map((action) => {
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
						<Link to={`${base}/vps`} className="text-sm font-medium text-foreground hover:underline">
							Cloud servers
						</Link>
						<p className="text-xs text-muted-foreground">VPS, VDS, and dedicated servers</p>
						<SubLinks items={cloudServers} />
					</div>
				</div>

				<div className="flex items-start gap-3 px-5 py-3.5">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<Megaphone className="size-4" aria-hidden />
					</div>
					<div className="min-w-0 flex-1">
						<Link
							to={`${base}/ad-campaigns`}
							className="text-sm font-medium text-foreground hover:underline"
						>
							Media buying
						</Link>
						<p className="text-xs text-muted-foreground">Meta, Google, and LinkedIn ads</p>
						<SubLinks items={mediaBuying} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
