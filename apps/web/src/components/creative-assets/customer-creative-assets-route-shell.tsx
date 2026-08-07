"use client";

import * as React from "react";
import { useParams } from "react-router";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
	CreativeAssetsRouteProvider,
	type CreativeAssetsRouteConfig,
} from "./creative-assets-route-context";
import { CreativeAssetsSubscriptionGate } from "./creative-assets-subscription-gate";

export function CustomerCreativeAssetsRouteShell({ children }: { children: React.ReactNode }) {
	const params = useParams();
	const teamSlug = typeof params?.slug === "string" ? params.slug : "";

	const { data: teamData, isLoading, isError } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: !!teamSlug },
	);

	const config = React.useMemo<CreativeAssetsRouteConfig>(
		() => ({
			basePath: `/${teamSlug}/creative-assets`,
			teamId: teamData?.id ?? null,
			teamSlug,
			isCustomer: true,
		}),
		[teamSlug, teamData?.id],
	);

	if (!teamSlug) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<p className="text-sm text-muted-foreground">Invalid or missing organization context.</p>
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
					We could not resolve this organization. Check the URL or switch organization from the sidebar.
				</p>
			</div>
		);
	}

	return (
		<CreativeAssetsRouteProvider config={config}>
			<CreativeAssetsSubscriptionGate>{children}</CreativeAssetsSubscriptionGate>
		</CreativeAssetsRouteProvider>
	);
}
