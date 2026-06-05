"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreativeAssetsRoute } from "./creative-assets-route-context";
import { useTeamCreativesDesignSubscriptions } from "./use-team-creatives-design-subscriptions";
import { CreativeAssetsPricing } from "./creative-assets-pricing";

type CreativeAssetsSubscriptionGateProps = {
	children: React.ReactNode;
	title?: string;
	description?: string;
};

export function CreativeAssetsSubscriptionGate({
	children,
	title = "Creative Assets",
	description = "Choose a plan to unlock creative deliverables, version history, approvals, and team collaboration.",
}: CreativeAssetsSubscriptionGateProps) {
	const { isCustomer, teamSlug } = useCreativeAssetsRoute();

	const { hasSubscription, isLoading, isError, error, refetch } =
		useTeamCreativesDesignSubscriptions(isCustomer ? (teamSlug ?? undefined) : undefined);

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
						<CreativeAssetsPricing />
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
