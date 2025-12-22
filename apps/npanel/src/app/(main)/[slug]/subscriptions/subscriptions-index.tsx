"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { SubscriptionsList } from "./_components/subscriptions-list";

const SubscriptionsSkeleton: React.FC = () => (
	<div className="@container/main flex flex-col gap-4 md:gap-6">
		<div className="flex flex-col gap-2">
			<Skeleton className="h-8 w-48" />
			<Skeleton className="h-4 w-96" />
		</div>
		<div className="flex items-center justify-between gap-4">
			<Skeleton className="h-10 flex-1 max-w-sm" />
			<div className="flex items-center gap-2">
				<Skeleton className="h-10 w-10" />
			</div>
		</div>
		<div className="space-y-2">
			{[...Array(3)].map((_, index) => (
				<Skeleton key={index} className="h-48 w-full" />
			))}
		</div>
	</div>
);

const EmptyState: React.FC<{
	title: string;
	description: string;
}> = ({ title, description }) => (
	<div className="flex flex-col items-center justify-center py-12 text-center">
		<p className="text-lg font-semibold mb-2">{title}</p>
		<p className="text-muted-foreground mb-4">{description}</p>
	</div>
);

export default function SubscriptionsIndex() {
	const pathname = usePathname();
	const teamSlug = pathname.split("/")[1];
	const [searchTerm, setSearchTerm] = React.useState("");

	// Get teamId from slug
	const { data: teamData, isLoading: isTeamLoading } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{
			enabled: !!teamSlug,
			staleTime: 5 * 60 * 1000, // 5 minutes
		}
	);

	const {
		data: subscriptions,
		isLoading: isSubscriptionsLoading,
		isFetching,
		error,
		refetch,
	} = trpc.serviceSubscriptions.getAll.useQuery(
		{
			teamId: teamData?.id || undefined,
		},
		{
			enabled: !!teamData?.id,
		}
	);

	const isLoading = isTeamLoading || isSubscriptionsLoading;

	const filteredSubscriptions = React.useMemo(() => {
		if (!subscriptions) return [];
		const transformed = subscriptions.map((subscription) => ({
			...subscription,
			nextRenewalDate: subscription.nextRenewalDate
				? new Date(subscription.nextRenewalDate)
				: null,
			subscriptionDate: subscription.subscriptionDate
				? new Date(subscription.subscriptionDate)
				: null,
		}));
		if (!searchTerm.trim()) {
			return transformed;
		}
		const query = searchTerm.toLowerCase();
		return transformed.filter((subscription) => {
			const planName = subscription.planName?.toLowerCase() ?? "";
			const planType = subscription.planType?.toLowerCase() ?? "";
			const status = subscription.status.toLowerCase();
			return (
				planName.includes(query) ||
				planType.includes(query) ||
				status.includes(query)
			);
		});
	}, [subscriptions, searchTerm]);

	if (isLoading) {
		return <SubscriptionsSkeleton />;
	}

	if (error) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6">
				<EmptyState
					title="Unable to load subscriptions"
					description={error.message ?? "Something went wrong while fetching subscriptions."}
				/>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
				<p className="text-muted-foreground">
					View and manage your team's active service subscriptions.
				</p>
			</div>

			<div className="flex items-center justify-between gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search subscriptions by plan name, type, or status..."
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => refetch()}
						disabled={isFetching}
						title="Refresh subscriptions"
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</Button>
				</div>
			</div>

			{!subscriptions || subscriptions.length === 0 ? (
				<EmptyState
					title="You do not have any subscriptions yet"
					description="Subscriptions for your team will appear here once they are created."
				/>
			) : filteredSubscriptions.length === 0 ? (
				<EmptyState
					title="No subscriptions match your search"
					description={`We couldn't find subscriptions for "${searchTerm}". Try updating your search.`}
				/>
			) : (
				<SubscriptionsList subscriptions={filteredSubscriptions} onRefetch={refetch} />
			)}
		</div>
	);
}

