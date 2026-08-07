"use client";

import * as React from "react";
import { Navigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useZeepoTokenBalance } from "@/hooks/use-zeepo-token-balance";
import { useZeepoAgentRoute } from "@/components/zeepo/zeepo-agent-route-context";
import ZeepoAiAgentSessionPage from "./_agency.zeepo-ai-agent/session-page";

export default function CustomerZeepoAiAgentSessionPage() {
	const { teamId, basePath } = useZeepoAgentRoute();

	const { hasSubscription, isLoading } = useZeepoTokenBalance(teamId);

	if (!teamId) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<p className="text-sm text-muted-foreground">Invalid or missing organization context.</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-[min(60vh,28rem)] w-full max-w-3xl rounded-lg" />
			</div>
		);
	}

	if (!hasSubscription) {
		return <Navigate to={basePath} replace />;
	}

	return <ZeepoAiAgentSessionPage />;
}
