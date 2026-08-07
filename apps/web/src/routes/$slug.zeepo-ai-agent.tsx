"use client";

import * as React from "react";
import { Outlet, useParams } from "react-router";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ZeepoAgentRouteProvider,
	type ZeepoAgentRouteConfig,
} from "@/components/zeepo/zeepo-agent-route-context";
import { ZeepoTokenBillingProvider } from "@/components/zeepo/zeepo-token-billing-provider";
import { captureEvent } from "@/lib/posthog";

export default function CustomerZeepoAiAgentLayout() {
	const params = useParams();
	const teamSlug = typeof params?.slug === "string" ? params.slug : "";

	React.useEffect(() => {
		captureEvent("zeepo_agent_chat_started");
	}, []);

	const { data: teamData, isLoading } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: !!teamSlug },
	);

	const config = React.useMemo<ZeepoAgentRouteConfig>(
		() => ({
			basePath: `/${teamSlug}/zeepo-ai-agent`,
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
		<ZeepoAgentRouteProvider config={config}>
			<ZeepoTokenBillingProvider>
				<div className="zeepo-agent-layout flex h-full min-h-0 w-full flex-col overflow-hidden">
					<Outlet />
				</div>
			</ZeepoTokenBillingProvider>
		</ZeepoAgentRouteProvider>
	);
}
