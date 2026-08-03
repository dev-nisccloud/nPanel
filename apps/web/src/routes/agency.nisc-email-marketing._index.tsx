"use client";

import type { ElementType } from "react";
import { Link } from "react-router";
import { Mail, Send, Users, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";

export default function NiscEmailMarketingHubPage() {
	const route = useNiscEmailMarketingRoute();

	const cards: { title: string; description: string; href: string; icon: ElementType }[] = [
		{
			title: "Campaigns",
			description: "View and manage your email campaigns.",
			href: `${route.basePath}/campaigns`,
			icon: Send,
		},
		{
			title: "Audiences",
			description: "Manage contact lists and segments.",
			href: `${route.basePath}/audiences`,
			icon: Users,
		},
		{
			title: "AI Email Builder",
			description: "Design emails with AI-powered templates and editing.",
			href: route.emailBuilderBasePath,
			icon: Sparkles,
		},
		{
			title: "Domains",
			description: "Configure sending domains and DNS for email delivery.",
			href: `${route.basePath}/domain-configuration`,
			icon: Globe,
		},
	];

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto space-y-6">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Mail className="h-4 w-4" />
						<span className="text-xs">Nisc Email Marketing</span>
					</div>
					<h1 className="text-base font-semibold tracking-tight">Email Marketing</h1>
					<p className="text-xs text-muted-foreground">
						Campaigns, audiences, AI email builder, and sending domains.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{cards.map(({ title, description, href, icon: Icon }) => (
						<Link key={href} to={href}>
							<div className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50 h-full">
								<Icon className="mb-2 h-8 w-8 text-muted-foreground" />
								<h3 className="font-medium">{title}</h3>
								<p className="mt-1 text-sm text-muted-foreground">{description}</p>
								<Button variant="link" className="mt-2 h-auto p-0" asChild>
									<span>Open →</span>
								</Button>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
