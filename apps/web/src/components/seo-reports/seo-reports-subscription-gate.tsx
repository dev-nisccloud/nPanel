"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeoReportsRoute } from "./seo-reports-route-context";
import { useTeamSeoReportsSubscriptions } from "./use-team-seo-reports-subscriptions";
import { SeoReportsPricing } from "./seo-reports-pricing";

type SeoReportsSubscriptionGateProps = {
	children: React.ReactNode;
	title?: string;
	description?: string;
};

export function SeoReportsSubscriptionGate({
	children,
	title = "SEO",
	description = "We handle keyword strategy, on-page and technical SEO, content, and off-page growth — you track results anytime in SEO Reports. Choose a plan to get started.",
}: SeoReportsSubscriptionGateProps) {
	const { isCustomer, teamSlug } = useSeoReportsRoute();

	const { hasSubscription, isLoading, isError, error, refetch } =
		useTeamSeoReportsSubscriptions(isCustomer ? (teamSlug ?? undefined) : undefined);

	if (!isCustomer) {
		return <>{children}</>;
	}

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-[min(60vh,28rem)] w-full rounded-lg" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="@container/main flex flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
				<div className="mx-auto w-full max-w-7xl py-12 text-center">
					<p className="mb-2 text-lg font-semibold">Unable to load subscriptions</p>
					<p className="mb-4 text-sm text-muted-foreground">
						{error?.message ?? "Something went wrong while checking your subscription."}
					</p>
					<Button onClick={() => refetch()} variant="outline">
						Try again
					</Button>
				</div>
			</div>
		);
	}

	if (!hasSubscription) {
		return (
			<div className="@container/main flex min-h-0 flex-1 flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col">
					<div className="flex shrink-0 flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">{title}</h1>
						<p className="text-sm text-muted-foreground">{description}</p>
					</div>
					<div className="mt-6 min-h-0 flex-1">
						<SeoReportsPricing />
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
