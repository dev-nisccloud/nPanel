"use client";

import * as React from "react";
import { useParams } from "react-router";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
	NiscEmailMarketingRouteProvider,
	type NiscEmailMarketingRouteConfig,
} from "./nisc-email-marketing-route-context";
import { NiscEmailMarketingSubscriptionGate } from "./nisc-email-marketing-subscription-gate";
import { NiscEmailMarketingOnboarding } from "./nisc-email-marketing-onboarding";

export function CustomerNiscEmRouteShell({ children }: { children: React.ReactNode }) {
	const params = useParams();
	const teamSlug = typeof params?.slug === "string" ? params.slug : "";

	const { data: teamData, isLoading, isError } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: !!teamSlug },
	);

	const config = React.useMemo<NiscEmailMarketingRouteConfig>(
		() => ({
			basePath: `/${teamSlug}/nisc-email-marketing`,
			emailBuilderBasePath: `/${teamSlug}/nisc-email-builder`,
			teamId: teamData?.id ?? null,
			teamSlug,
			isCustomer: true,
			showAdminFeatures: false,
		}),
		[teamSlug, teamData?.id],
	);

	if (!teamSlug) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<p className="text-sm text-muted-foreground">Invalid or missing team context.</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex flex-1 flex-col gap-3 p-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-[min(60vh,32rem)] w-full rounded-lg" />
			</div>
		);
	}

	if (isError || !teamData?.id) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<p className="text-sm text-muted-foreground">
					We could not resolve this team. Check the URL or switch team from the sidebar.
				</p>
			</div>
		);
	}

	return (
		<NiscEmailMarketingRouteProvider config={config}>
			<NiscEmailMarketingSubscriptionGate>
				<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
					<div className="w-full max-w-7xl mx-auto">
						<NiscEmailMarketingOnboarding />
					</div>
				</div>
				{children}
			</NiscEmailMarketingSubscriptionGate>
		</NiscEmailMarketingRouteProvider>
	);
}
