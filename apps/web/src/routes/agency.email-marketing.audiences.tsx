"use client";

import * as React from "react";
import { Plus, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { AudiencesTable } from "./agency.email-marketing/audiences/_components/audiences-table";
import { CreateAudienceSheet } from "./agency.email-marketing/audiences/_components/create-audience-sheet";

const AudiencesTableSkeleton: React.FC = () => (
	<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
		<div className="border-b">
			<div className="grid grid-cols-4 gap-4 p-4">
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-16 ml-auto" />
			</div>
		</div>
		<div className="divide-y">
			{[...Array(5)].map((_, i) => (
				<div key={i} className="grid grid-cols-4 gap-4 p-4">
					<Skeleton className="h-4 w-52" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-32" />
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

export default function AudiencesPage() {
	const [searchTerm, setSearchTerm] = React.useState("");
	const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
	const [isRefreshing, setIsRefreshing] = React.useState(false);

	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.emailMarketing.audiences.list.useQuery(
		{ limit: 100 },
	);

	const audiences = data?.audiences ?? [];

	const filteredAudiences = React.useMemo(() => {
		if (!searchTerm.trim()) {
			return audiences;
		}
		const query = searchTerm.toLowerCase();
		return audiences.filter((audience) => {
			const name = audience.name?.toLowerCase() ?? "";
			return name.includes(query);
		});
	}, [audiences, searchTerm]);

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
						<Skeleton className="h-8 w-56" />
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
						<AudiencesTableSkeleton />
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
						title="Unable to load audiences"
						description={error.message ?? "Something went wrong while fetching audiences."}
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
					<h1 className="text-base font-semibold tracking-tight">Audiences</h1>
					<p className="text-xs text-muted-foreground">
						Organise contacts into reusable audiences you can target across email campaigns.
					</p>
				</div>

				<div className="mt-6">
					<div className="flex items-center justify-between gap-4">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search audiences by name..."
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
								title="Refresh audiences"
							>
								<RefreshCw className={`h-4 w-4 ${isFetching || isRefreshing ? "animate-spin" : ""}`} />
							</Button>
							<Button onClick={() => setIsCreateSheetOpen(true)}>
								<Plus className="mr-2 h-4 w-4" />
								Create Audience
							</Button>
						</div>
					</div>
				</div>

				<div className="mt-6">
					{audiences.length === 0 ? (
						<EmptyState
							title="No audiences yet"
							description="Create an audience to start grouping contacts for your campaigns."
							action={
								<Button onClick={() => setIsCreateSheetOpen(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Create Audience
								</Button>
							}
						/>
					) : filteredAudiences.length === 0 ? (
						<EmptyState
							title="No audiences match your search"
							description={`We couldn't find audiences for "${searchTerm}". Try updating your search.`}
						/>
					) : (
						<AudiencesTable audiences={filteredAudiences} onRefetch={refetch} />
					)}
				</div>
			</div>

			<CreateAudienceSheet
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
