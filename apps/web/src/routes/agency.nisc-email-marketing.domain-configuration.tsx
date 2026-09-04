"use client";

import * as React from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { useLocation } from "react-router";
import { EmailDomainsTable } from "./agency.nisc-email-marketing/domain-configuration/_components/email-domains-table";
import { AddDomainSheet } from "./agency.nisc-email-marketing/domain-configuration/_components/add-domain-sheet";
import { SesDomainsTable } from "./agency.nisc-email-marketing/domain-configuration/_components/ses-domains-table";
import {
	niscEmTeamScopedInput,
	useNiscEmailMarketingRoute,
} from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";

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

export default function DomainConfigurationPage() {
	const route = useNiscEmailMarketingRoute();
	const location = useLocation();
	const showUsageTab = !route.isCustomer && location.pathname.startsWith("/agency/");
	const [searchTerm, setSearchTerm] = React.useState("");
	const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
	const [isRefreshing, setIsRefreshing] = React.useState(false);
	const [tab, setTab] = React.useState<"usage" | "domains">(showUsageTab ? "usage" : "domains");

	React.useEffect(() => {
		if (!showUsageTab && tab !== "domains") setTab("domains");
	}, [showUsageTab, tab]);

	const {
		data,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.niscEmailMarketing.domains.listLegacy.useQuery(
		niscEmTeamScopedInput(route, { limit: 100 }),
		{ enabled: !route.isCustomer || Boolean(route.teamId) },
	);

	const {
		data: usageQuota,
		isLoading: usageQuotaLoading,
		refetch: refetchUsageQuota,
	} = trpc.niscEmailMarketing.sesUsage.quotaLive.useQuery(undefined, {
		enabled: showUsageTab && tab === "usage",
	});

	const {
		data: usageDomains,
		isLoading: usageDomainsLoading,
		refetch: refetchUsageDomains,
	} = trpc.niscEmailMarketing.sesUsage.listDomainsLive.useQuery(
		{ limit: 100 },
		{
			enabled: showUsageTab && tab === "usage",
		},
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
			if (tab === "usage") {
				await Promise.all([refetchUsageQuota(), refetchUsageDomains()]);
			} else {
				await refetch();
			}
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
						<EmailDomainsTableSkeleton />
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

				<div className="mt-6">
					{showUsageTab ? (
						<Tabs value={tab} onValueChange={(v) => setTab(v as "usage" | "domains")}>
							<TabsList>
								<TabsTrigger value="usage">Usage</TabsTrigger>
								<TabsTrigger value="domains">Domains</TabsTrigger>
							</TabsList>

							<div className="mt-4 flex items-center justify-between gap-4">
								<div className="relative flex-1 max-w-sm">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										type="search"
										placeholder={tab === "usage" ? "Search SES domains..." : "Search domains by name or status..."}
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
										disabled={isRefreshing || (tab === "domains" ? isFetching : false)}
										title="Refresh"
									>
										<RefreshCw className={`h-4 w-4 ${(isRefreshing || (tab === "domains" && isFetching)) ? "animate-spin" : ""}`} />
									</Button>
									{tab === "domains" && (
										<Button onClick={() => setIsAddSheetOpen(true)}>
											<Plus className="mr-2 h-4 w-4" />
											Add Domain
										</Button>
									)}
								</div>
							</div>

							<TabsContent value="usage" className="mt-6 space-y-6">
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									<Card className="shadow-none border-muted/60">
										<CardHeader className="pb-2">
											<CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
												Max send rate
											</CardTitle>
										</CardHeader>
										<CardContent className="pt-0">
											<div className="text-2xl font-bold">
												{usageQuotaLoading ? " " : `${Math.floor(usageQuota?.maxSendRate ?? 0)} / sec`}
											</div>
										</CardContent>
									</Card>
									<Card className="shadow-none border-muted/60">
										<CardHeader className="pb-2">
											<CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
												24h quota
											</CardTitle>
										</CardHeader>
										<CardContent className="pt-0">
											<div className="text-2xl font-bold">
												{usageQuotaLoading ? " " : `${Math.floor(usageQuota?.max24HourSend ?? 0).toLocaleString()}`}
											</div>
										</CardContent>
									</Card>
									<Card className="shadow-none border-muted/60">
										<CardHeader className="pb-2">
											<CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
												Sent (last 24h)
											</CardTitle>
										</CardHeader>
										<CardContent className="pt-0">
											<div className="text-2xl font-bold">
												{usageQuotaLoading ? " " : `${Math.floor(usageQuota?.sentLast24Hours ?? 0).toLocaleString()}`}
											</div>
										</CardContent>
									</Card>
									<Card className="shadow-none border-muted/60">
										<CardHeader className="pb-2">
											<CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
												Remaining (24h)
											</CardTitle>
										</CardHeader>
										<CardContent className="pt-0">
											<div className="text-2xl font-bold">
												{usageQuotaLoading ? " " : `${Math.floor(usageQuota?.remaining24HourSend ?? 0).toLocaleString()}`}
											</div>
										</CardContent>
									</Card>
								</div>

								{usageDomainsLoading ? (
									<EmailDomainsTableSkeleton />
								) : (
									<SesDomainsTable
										domains={(usageDomains?.domains ?? []).filter((d) => {
											if (!searchTerm.trim()) return true;
											const q = searchTerm.toLowerCase();
											return (d.domainName ?? "").toLowerCase().includes(q) || (d.status ?? "").toLowerCase().includes(q);
										})}
										onRefetch={() => refetchUsageDomains()}
									/>
								)}
							</TabsContent>

							<TabsContent value="domains" className="mt-6">
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
							</TabsContent>
						</Tabs>
					) : (
						<>
							<div className="flex items-center justify-between gap-4">
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
						</>
					)}
				</div>

			</div>

			<AddDomainSheet
				open={isAddSheetOpen}
				onOpenChange={setIsAddSheetOpen}
				onSuccess={() => {
					refetch();
					setIsAddSheetOpen(false);
				}}
			/>
		</div>
	);
}
