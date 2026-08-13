"use client";

import * as React from "react";
import { Outlet, useParams } from "react-router";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ZeepoAiRouteProvider,
	type ZeepoAiRouteConfig,
} from "@/components/zeepo/zeepo-ai-route-context";

export default function CustomerZeepoAiLayout() {
	const params = useParams();
	const teamSlug = typeof params?.slug === "string" ? params.slug : "";

	const { data: teamData, isLoading } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: !!teamSlug },
	);

	const config = React.useMemo<ZeepoAiRouteConfig>(
		() => ({
			basePath: `/${teamSlug}/zeepo-ai`,
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

	if (isLoading || !teamData?.id) {
		return (
			<div className="flex flex-1 flex-col gap-3 p-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-[min(60vh,32rem)] w-full rounded-lg" />
			</div>
		);
	}

	return (
		<ZeepoAiRouteProvider config={config}>
			<div className="@container/main flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden px-3 py-2 sm:px-4 sm:py-3">
				<Outlet />
			</div>
		</ZeepoAiRouteProvider>
	);
}
