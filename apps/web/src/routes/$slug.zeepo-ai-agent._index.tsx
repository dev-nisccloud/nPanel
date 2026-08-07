"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useZeepoTokenBalance } from "@/hooks/use-zeepo-token-balance";
import { useZeepoAgentRoute } from "@/components/zeepo/zeepo-agent-route-context";
import { ZeepoAgentPricing } from "@/components/zeepo/zeepo-agent-pricing";
import ZeepoAiAgentIndexPage from "./_agency.zeepo-ai-agent/index-page";

export default function CustomerZeepoAiAgentIndexPage() {
	const { teamId } = useZeepoAgentRoute();

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
			<div className="@container/main flex flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-[min(60vh,28rem)] w-full rounded-lg" />
			</div>
		);
	}

	if (!hasSubscription) {
		return (
			<div className="@container/main flex min-h-0 flex-1 flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col">
					<div className="flex shrink-0 flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">Zeepo AI Agent</h1>
						<p className="text-sm text-muted-foreground">
							Choose a monthly plan to unlock Zeepo - chat, media generation, documents, and
							more.
						</p>
					</div>
					<div className="mt-6 min-h-0 flex-1">
						<ZeepoAgentPricing planFilter="subscription" />
					</div>
				</div>
			</div>
		);
	}

	return <ZeepoAiAgentIndexPage />;
}
