"use client";

import type { ElementType } from "react";
import { Link, useParams } from "react-router";
import { Mail, Send, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NiscEmailMarketingPricing } from "./$slug.nisc-email-marketing/_components/nisc-email-marketing-pricing";
import { useTeamNiscEmailMarketingSubscriptions } from "./$slug.nisc-email-marketing/_components/use-team-nisc-email-marketing-subscriptions";

export default function TeamNiscEmailMarketingIndex() {
	const params = useParams();
	const teamSlug = typeof params.slug === "string" ? params.slug : "";
	const base = `/${teamSlug}/nisc-email-marketing`;

	const {
		data: niscEmSubscriptions,
		isLoading: isSubsLoading,
		isError: isSubsError,
		error: subsError,
		refetch: refetchSubscriptions,
	} = useTeamNiscEmailMarketingSubscriptions(teamSlug);
	const hasNiscEmSubscription = (niscEmSubscriptions?.length ?? 0) > 0;

	const cards: { title: string; description: string; href: string; icon: ElementType }[] = [
		{
			title: "Campaigns",
			description: "View and manage your email campaigns.",
			href: `${base}/campaigns`,
			icon: Send,
		},
		{
			title: "Audiences",
			description: "Manage contact lists and segments.",
			href: `${base}/audiences`,
			icon: Users,
		},
		{
			title: "Domains",
			description: "Configure sending domains and DNS for email delivery.",
			href: `${base}/domain-configuration`,
			icon: Globe,
		},
	];

	if (isSubsLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto space-y-4">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-full max-w-md" />
					<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-40 rounded-lg" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (isSubsError) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto text-center py-12">
					<p className="text-lg font-semibold mb-2">Unable to load subscriptions</p>
					<p className="text-muted-foreground mb-4 text-sm">
						{subsError?.message ?? "Something went wrong while checking your Nisc Email Marketing subscription."}
					</p>
					<Button onClick={() => refetchSubscriptions()} variant="outline">
						Try again
					</Button>
				</div>
			</div>
		);
	}

	if (!hasNiscEmSubscription) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">Nisc Email Marketing</h1>
						<p className="text-xs text-muted-foreground">
							Subscribe to unlock campaigns, audiences, and email sending domains.
						</p>
					</div>
					<div className="mt-6">
						<NiscEmailMarketingPricing />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Mail className="h-4 w-4" />
						<span className="text-xs">Nisc Email Marketing</span>
					</div>
					<h1 className="text-base font-semibold tracking-tight">Email Marketing</h1>
					<p className="text-xs text-muted-foreground">
						Campaigns, audiences, and sending domains for your team.
					</p>
				</div>

				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
