"use client";

import * as React from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { CampaignsTable } from "./_components/campaigns-table";
import { CreateCampaignSheet } from "./_components/create-campaign-sheet";

const CampaignsTableSkeleton: React.FC = () => (
	<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
		<div className="border-b">
			<div className="grid grid-cols-5 gap-4 p-4">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-16 ml-auto" />
			</div>
		</div>
		<div className="divide-y">
			{[...Array(5)].map((_, i) => (
				<div key={i} className="grid grid-cols-5 gap-4 p-4">
					<Skeleton className="h-4 w-40" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-8 w-8 ml-auto" />
				</div>
			))}
		</div>
	</div>
);

const EmptyState: React.FC<{
	title: string;
	description: string;
	action?: React.ReactNode;
}> = ({ title, description, action }) => (
	<div className="flex flex-col items-center justify-center py-12 text-center">
		<p className="text-lg font-semibold mb-2">{title}</p>
		<p className="text-muted-foreground mb-4">{description}</p>
		{action}
	</div>
);

export default function CampaignsPage() {
	const [searchTerm, setSearchTerm] = React.useState("");
	const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
	const [isRefreshing, setIsRefreshing] = React.useState(false);

	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.emailMarketing.campaigns.list.useQuery(
		{ limit: 100 },
	);

	const campaigns = data?.campaigns ?? [];

	const filteredCampaigns = React.useMemo(() => {
		if (!searchTerm.trim()) {
			return campaigns;
		}
		const query = searchTerm.toLowerCase();
		return campaigns.filter((campaign) => {
			const name = campaign.name?.toLowerCase() ?? "";
			const subject = campaign.subject?.toLowerCase() ?? "";
			const status = campaign.status?.toLowerCase() ?? "";
			return name.includes(query) || subject.includes(query) || status.includes(query);
		});
	}, [campaigns, searchTerm]);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsRefreshing(false);
		}
	};

	if (isLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-96" />
					</div>
					<div className="mt-6 flex items-center justify-between gap-4">
						<Skeleton className="h-10 flex-1 max-w-sm" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-10 w-10" />
							<Skeleton className="h-10 w-32" />
						</div>
					</div>
					<div className="mt-6">
						<CampaignsTableSkeleton />
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<EmptyState
						title="Unable to load campaigns"
						description={error.message ?? "Something went wrong while fetching campaigns."}
						action={
							<Button onClick={() => refetch()} variant="outline">
								Try again
							</Button>
						}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
					<p className="text-muted-foreground">
						Create and manage email campaigns to reach your audience.
					</p>
				</div>

				<div className="mt-6">
					<div className="flex items-center justify-between gap-4">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search campaigns by name, subject, or status..."
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								onClick={handleRefresh}
								disabled={isFetching || isRefreshing}
								title="Refresh campaigns"
							>
								<RefreshCw className={`h-4 w-4 ${isFetching || isRefreshing ? "animate-spin" : ""}`} />
							</Button>
							<Button onClick={() => setIsCreateSheetOpen(true)}>
								<Plus className="mr-2 h-4 w-4" />
								Create Campaign
							</Button>
						</div>
					</div>
				</div>

				<div className="mt-6">
					{campaigns.length === 0 ? (
						<EmptyState
							title="No campaigns yet"
							description="Start reaching many recipients at once by creating and sending a campaign."
							action={
								<Button onClick={() => setIsCreateSheetOpen(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Create Campaign
								</Button>
							}
						/>
					) : filteredCampaigns.length === 0 ? (
						<EmptyState
							title="No campaigns match your search"
							description={`We couldn't find campaigns for "${searchTerm}". Try updating your search.`}
						/>
					) : (
						<CampaignsTable campaigns={filteredCampaigns} onRefetch={refetch} />
					)}
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
