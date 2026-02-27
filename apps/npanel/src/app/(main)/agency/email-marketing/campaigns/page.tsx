"use client";

import * as React from "react";
import Image from "next/image";
import { Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { CampaignsTable } from "./_components/campaigns-table";
import { CreateCampaignSheet } from "./_components/create-campaign-sheet";
import { RotatingText } from "@/components/rotating-text";

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
					<div
						className="aspect-[5/1] min-h-[248px] flex gap-x-6 p-6 items-center rounded-xl"
						style={{
							backgroundImage:
								"linear-gradient(52deg, rgba(163, 163, 163, 0.09) 0%, rgba(163, 163, 163, 0.09) 33.3%,rgba(100, 100, 100, 0.09) 33.3%, rgba(100, 100, 100, 0.09) 66.6%,rgba(162, 162, 162, 0.09) 66.6%, rgba(162, 162, 162, 0.09) 99%),linear-gradient(258deg, rgba(193, 193, 193, 0.06) 0%, rgba(193, 193, 193, 0.06) 33.3%,rgba(169, 169, 169, 0.06) 33.3%, rgba(169, 169, 169, 0.06) 66.6%,rgba(92, 92, 92, 0.06) 66.6%, rgba(92, 92, 92, 0.06) 99%),linear-gradient(129deg, rgba(45, 45, 45, 0.03) 0%, rgba(45, 45, 45, 0.03) 33.3%,rgba(223, 223, 223, 0.03) 33.3%, rgba(223, 223, 223, 0.03) 66.6%,rgba(173, 173, 173, 0.03) 66.6%, rgba(173, 173, 173, 0.03) 99%),linear-gradient(280deg, rgba(226, 226, 226, 0.06) 0%, rgba(226, 226, 226, 0.06) 33.3%,rgba(81, 81, 81, 0.06) 33.3%, rgba(81, 81, 81, 0.06) 66.6%,rgba(186, 186, 186, 0.06) 66.6%, rgba(186, 186, 186, 0.06) 99%),linear-gradient(85deg, rgba(225, 225, 225, 0.04) 0%, rgba(225, 225, 225, 0.04) 33.3%,rgba(95, 95, 95, 0.04) 33.3%, rgba(95, 95, 95, 0.04) 66.6%,rgba(39, 39, 39, 0.04) 66.6%, rgba(39, 39, 39, 0.04) 99%),linear-gradient(128deg, rgba(184, 184, 184, 0.06) 0%, rgba(184, 184, 184, 0.06) 33.3%,rgba(0, 0, 0, 0.06) 33.3%, rgba(0, 0, 0, 0.06) 66.6%,rgba(140, 140, 140, 0.06) 66.6%, rgba(140, 140, 140, 0.06) 99.89999999999999%),linear-gradient(323deg, rgba(40, 40, 40, 0.07) 0%, rgba(40, 40, 40, 0.07) 33.3%,rgba(214, 214, 214, 0.07) 33.3%, rgba(214, 214, 214, 0.07) 66.6%,rgba(190, 190, 190, 0.07) 66.6%, rgba(190, 190, 190, 0.07) 99.89999999999999%),linear-gradient(61deg, rgba(230, 230, 230, 0) 0%, rgba(230, 230, 230, 0) 33.3%,rgba(241, 241, 241, 0) 33.3%, rgba(241, 241, 241, 0) 66.6%,rgba(55, 55, 55, 0) 66.6%, rgba(55, 55, 55, 0) 99%),linear-gradient(0deg, #2625e3,#0bbaef)",
						}}
					>
						<div className="rounded-full size-28 items-center justify-center bg-white/60 hidden md:flex shrink-0">
							<div className="rounded-full size-20 flex items-center justify-center bg-white shadow-sm">
								<Image
									src="/icons/mail_campaigns.png"
									alt="Email campaigns"
									width={64}
									height={64}
									className="h-12 w-12"
								/>
							</div>
						</div>
						<div className="flex flex-col gap-y-3 text-white">
							<Skeleton className="h-7 w-64 rounded-full bg-white/20" />
							<Skeleton className="h-4 w-80 rounded-full bg-white/10" />
						</div>
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
				{/* Banner (mirrors email builder layout) */}
				<div
					className="text-white aspect-[5/1] min-h-[248px] flex gap-x-6 p-6 items-center rounded-xl"
					style={{
						backgroundImage:
							"linear-gradient(52deg, rgba(163, 163, 163, 0.09) 0%, rgba(163, 163, 163, 0.09) 33.3%,rgba(100, 100, 100, 0.09) 33.3%, rgba(100, 100, 100, 0.09) 66.6%,rgba(162, 162, 162, 0.09) 66.6%, rgba(162, 162, 162, 0.09) 0.09 99%),linear-gradient(258deg, rgba(193, 193, 193, 0.06) 0%, rgba(193, 193, 193, 0.06) 33.3%,rgba(169, 169, 169, 0.06) 33.3%, rgba(169, 169, 169, 0.06) 66.6%,rgba(92, 92, 92, 0.06) 66.6%, rgba(92, 92, 92, 0.06) 99%),linear-gradient(129deg, rgba(45, 45, 45, 0.03) 0%, rgba(45, 45, 45, 0.03) 33.3%,rgba(223, 223, 223, 0.03) 33.3%, rgba(223, 223, 223, 0.03) 66.6%,rgba(173, 173, 173, 0.03) 66.6%, rgba(173, 173, 173, 0.03) 99%),linear-gradient(280deg, rgba(226, 226, 226, 0.06) 0%, rgba(226, 226, 226, 0.06) 33.3%,rgba(81, 81, 81, 0.06) 33.3%, rgba(81, 81, 81, 0.06) 66.6%,rgba(186, 186, 186, 0.06) 66.6%, rgba(186, 186, 186, 0.06) 99%),linear-gradient(85deg, rgba(225, 225, 225, 0.04) 0%, rgba(225, 225, 225, 0.04) 33.3%,rgba(95, 95, 95, 0.04) 33.3%, rgba(95, 95, 95, 0.04) 66.6%,rgba(39, 39, 39, 0.04) 66.6%, rgba(39, 39, 39, 0.04) 99%),linear-gradient(128deg, rgba(184, 184, 184, 0.06) 0%, rgba(184, 184, 184, 0.06) 33.3%,rgba(0, 0, 0, 0.06) 33.3%, rgba(0, 0, 0, 0.06) 66.6%,rgba(140, 140, 140, 0.06) 66.6%, rgba(140, 140, 140, 0.06) 99.89999999999999%),linear-gradient(323deg, rgba(40, 40, 40, 0.07) 0%, rgba(40, 40, 40, 0.07) 33.3%,rgba(214, 214, 214, 0.07) 33.3%, rgba(214, 214, 214, 0.07) 66.6%,rgba(190, 190, 190, 0.07) 66.6%, rgba(190, 190, 190, 0.07) 99.89999999999999%),linear-gradient(61deg, rgba(230, 230, 230, 0) 0%, rgba(230, 230, 230, 0) 33.3%,rgba(241, 241, 241, 0) 33.3%, rgba(241, 241, 241, 0) 66.6%,rgba(55, 55, 55, 0) 66.6%, rgba(55, 55, 55, 0) 99%),linear-gradient(0deg, #2625e3,#0bbaef)",
					}}
				>
					<div className="rounded-full size-28 items-center justify-center bg-white/60 hidden md:flex shrink-0">
						<div className="rounded-full size-20 flex items-center justify-center bg-white shadow-sm">
							<Image
								src="/icons/mail_campaigns.png"
								alt="Email campaigns"
								width={64}
								height={64}
								className="h-12 w-12"
							/>
						</div>
					</div>
					<div className="flex flex-col gap-y-3">
						<h1 className="text-xl md:text-4xl font-extrabold tracking-tight">
							Email campaigns that{" "}
							<RotatingText
								texts={[
									"scale your outreach",
									"nurture every segment",
									"launch in a few clicks",
									"stay perfectly on schedule",
								]}
								className="ml-2 inline-block text-yellow-100"
							/>
						</h1>
						<p className="text-xs md:text-sm mb-4 max-w-lg">
							Plan, schedule, and track high-volume email sends powered by your templates, lists,
							and real-time performance insights.
						</p>
					</div>
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
