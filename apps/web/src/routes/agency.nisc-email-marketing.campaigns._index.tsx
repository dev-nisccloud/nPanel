"use client";

import * as React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { CampaignsTable } from "./agency.nisc-email-marketing/campaigns/_components/campaigns-table";
import { CreateCampaignSheet } from "./agency.nisc-email-marketing/campaigns/_components/create-campaign-sheet";
import {
	niscEmTeamScopedInput,
	useNiscEmailMarketingRoute,
} from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";

export default function CampaignsPage() {
	const route = useNiscEmailMarketingRoute();
	const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
	const [isRefreshing, setIsRefreshing] = React.useState(false);

	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.niscEmailMarketing.campaigns.list.useQuery(
		niscEmTeamScopedInput(route, { limit: 100 }),
		{ enabled: !route.isCustomer || Boolean(route.teamId) },
	);

	const campaigns = data?.campaigns ?? [];

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsRefreshing(false);
		}
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Campaigns</h1>
					<p className="text-xs text-muted-foreground">
						Plan, schedule, and track email sends from your templates and audiences.
					</p>
				</div>

				<div className="mt-6">
					<CampaignsTable
						campaigns={campaigns}
						isLoading={isLoading}
						isError={Boolean(error)}
						error={error instanceof Error ? error : null}
						onRetry={() => void refetch()}
						onRefetch={refetch}
						toolbarActions={
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={handleRefresh}
									disabled={isFetching || isRefreshing || isLoading}
								>
									<RefreshCw className={`mr-2 h-4 w-4 ${isFetching || isRefreshing ? "animate-spin" : ""}`} />
									Refresh
								</Button>
								<Button size="sm" onClick={() => setIsCreateSheetOpen(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Create Campaign
								</Button>
							</>
						}
					/>
				</div>
			</div>

			<CreateCampaignSheet
				open={isCreateSheetOpen}
				onOpenChange={setIsCreateSheetOpen}
				onSuccess={() => {
					refetch();
					setIsCreateSheetOpen(false);
				}}
			/>
		</div>
	);
}
