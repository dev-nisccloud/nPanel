"use client";

import * as React from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { EmailDomainsTable } from "./$slug.nisc-email-marketing/domain-configuration/_components/email-domains-table";
import { AddDomainSheet } from "./$slug.nisc-email-marketing/domain-configuration/_components/add-domain-sheet";
import { NiscEmailMarketingPricing } from "./$slug.nisc-email-marketing/_components/nisc-email-marketing-pricing";
import { useTeamNiscEmailMarketingSubscriptions } from "./$slug.nisc-email-marketing/_components/use-team-nisc-email-marketing-subscriptions";

const EmailDomainsTableSkeleton: React.FC = () => (
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

export default function TeamDomainConfigurationPage() {
	const params = useParams();
	const teamSlug = typeof params.slug === "string" ? params.slug : "";
	const {
		data: niscEmSubscriptions,
		isLoading: isSubsLoading,
		isError: isSubsError,
		error: subsError,
		refetch: refetchSubscriptions,
	} = useTeamNiscEmailMarketingSubscriptions(teamSlug);
	const hasNiscEmSubscription = (niscEmSubscriptions?.length ?? 0) > 0;

	const { data: teamData, isLoading: isTeamLoading, isError: isTeamError } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug: teamSlug },
		{ enabled: teamSlug.length > 0 && hasNiscEmSubscription },
	);
	const teamId = teamData?.id;

	const [searchTerm, setSearchTerm] = React.useState("");
	const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
	const [isRefreshing, setIsRefreshing] = React.useState(false);

	const {
		data,
		isLoading: isDomainsLoading,
		isFetching,
		error,
		refetch,
	} = trpc.niscEmailMarketing.domains.listLegacy.useQuery(
		{ limit: 100, teamId: teamId ?? undefined },
		{ enabled: Boolean(teamId) && hasNiscEmSubscription },
	);

	const domains = data?.domains ?? [];

	const filteredDomains = React.useMemo(() => {
		if (!searchTerm.trim()) {
			return domains;
		}
		const query = searchTerm.toLowerCase();
		return domains.filter((domain) => {
			const domainName = domain.domainName?.toLowerCase() ?? "";
			const status = domain.status?.toLowerCase() ?? "";
			return domainName.includes(query) || status.includes(query);
		});
	}, [domains, searchTerm]);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsRefreshing(false);
		}
	};

	const isPageLoading =
		isSubsLoading || (hasNiscEmSubscription && (isTeamLoading || (Boolean(teamId) && isDomainsLoading)));

	if (isSubsError) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<EmptyState
						title="Unable to load subscriptions"
						description={subsError?.message ?? "Something went wrong while checking your Nisc Email Marketing subscription."}
						action={
							<Button onClick={() => refetchSubscriptions()} variant="outline">
								Try again
							</Button>
						}
					/>
				</div>
			</div>
		);
	}

	if (!isSubsLoading && !hasNiscEmSubscription) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">Email domains</h1>
						<p className="text-xs text-muted-foreground">
							Choose a Nisc Email Marketing plan to add and verify sending domains.
						</p>
					</div>
					<div className="mt-6">
						<NiscEmailMarketingPricing />
					</div>
				</div>
			</div>
		);
	}

	if (isPageLoading) {
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
						<EmailDomainsTableSkeleton />
					</div>
				</div>
			</div>
		);
	}

	if (isTeamError || !teamId) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<EmptyState
						title="Unable to load team"
						description="We could not resolve this team. Check the URL or switch team from the sidebar."
					/>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<EmptyState
						title="Unable to load domains"
						description={error.message ?? "Something went wrong while fetching domains."}
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
					<h1 className="text-base font-semibold tracking-tight">Manage your email domains</h1>
					<p className="text-xs text-muted-foreground">
						Add, remove, and configure your email domains for sending and receiving your email campaigns.
					</p>
				</div>

				<div className="mt-6 flex items-center justify-between gap-4">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search domains by name or status..."
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
							disabled={isRefreshing || isFetching}
							title="Refresh"
						>
							<RefreshCw className={`h-4 w-4 ${isRefreshing || isFetching ? "animate-spin" : ""}`} />
						</Button>
						<Button onClick={() => setIsAddSheetOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Add Domain
						</Button>
					</div>
				</div>

				<div className="mt-6">
					{domains.length === 0 ? (
						<EmptyState
							title="No domains yet"
							description="Add a domain to start sending emails from your own domain."
							action={
								<Button onClick={() => setIsAddSheetOpen(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Add Domain
								</Button>
							}
						/>
					) : filteredDomains.length === 0 ? (
						<EmptyState
							title="No domains match your search"
							description={`We couldn't find domains for "${searchTerm}". Try updating your search.`}
						/>
					) : (
						<EmailDomainsTable domains={filteredDomains} onRefetch={refetch} />
					)}
				</div>
			</div>

			<AddDomainSheet
				open={isAddSheetOpen}
				onOpenChange={setIsAddSheetOpen}
				fixedTeamId={teamId}
				onSuccess={() => {
					refetch();
					setIsAddSheetOpen(false);
				}}
			/>
		</div>
	);
}
