"use client";

import * as React from "react";
import { useSearchParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { ConnectLinkedInAds } from "./agency.ad-campaigns/linkedin-ads/_components/connect-linkedin-ads";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	Target,
	BarChart3,
	RefreshCw,
	TrendingUp,
	Calendar as CalendarIcon,
	Building2,
	MousePointer2,
	ChevronDown,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import type { StoredCredentials } from "./agency.ad-campaigns/linkedin-ads/_components/schemas";

export default function LinkedInAdsPage() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const paramAccountId = searchParams.get("accountId");
	const paramFrom = searchParams.get("from");
	const paramTo = searchParams.get("to");

	const [selectedAccountId, setSelectedAccountId] = React.useState<string>(paramAccountId || "");
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
	const [isSyncing, setIsSyncing] = React.useState(false);
	const utils = trpc.useUtils();

	const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
		if (paramFrom && paramTo) {
			const fromDate = new Date(paramFrom);
			const toDate = new Date(paramTo);
			if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
				return { from: fromDate, to: toDate };
			}
		}
		return {
			from: new Date(new Date().setDate(new Date().getDate() - 30)),
			to: new Date(),
		};
	});

	const updateSearchParams = React.useCallback((updates: Record<string, string | undefined>) => {
		const current = new URLSearchParams(searchParams);
		Object.entries(updates).forEach(([key, value]) => {
			if (value) current.set(key, value);
			else current.delete(key);
		});
		setSearchParams(current, { replace: true });
	}, [searchParams, setSearchParams]);

	React.useEffect(() => {
		const updates: Record<string, string | undefined> = {};
		if (selectedAccountId) updates.accountId = selectedAccountId;
		if (dateRange?.from && dateRange?.to) {
			updates.from = format(dateRange.from, "yyyy-MM-dd");
			updates.to = format(dateRange.to, "yyyy-MM-dd");
		}
		if (Object.keys(updates).length > 0) {
			updateSearchParams(updates);
		}
	}, [selectedAccountId, dateRange, updateSearchParams]);

	const {
		data: credentialsData,
		isLoading: isLoadingCredentials,
		error: credentialsError,
		refetch: refetchCredentials,
	} = trpc.linkedInAds.auth.getStoredCredentials.useQuery(undefined, {
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const credentials = credentialsData?.data as StoredCredentials | null | undefined;
	const isConnected = credentials?.connected === true;

	const {
		data: accountsData,
		isLoading: isLoadingAccounts,
		error: accountsError,
		refetch: refetchAccounts,
	} = trpc.linkedInAds.accounts.listAdAccounts.useQuery(undefined, {
		enabled: isConnected,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const accounts = accountsData?.data || [];

	React.useEffect(() => {
		if (accounts.length > 0 && !selectedAccountId) {
			setSelectedAccountId(String(accounts[0].id));
		}
	}, [accounts, selectedAccountId]);

	const timeRange =
		dateRange?.from && dateRange?.to
			? {
				since: format(dateRange.from, "yyyy-MM-dd"),
				until: format(dateRange.to, "yyyy-MM-dd"),
			}
			: undefined;

	const {
		data: campaignsData,
		isLoading: isLoadingCampaigns,
		error: campaignsError,
		isFetching: isFetchingCampaigns,
		refetch: refetchCampaigns,
	} = trpc.linkedInAds.campaignGroups.listCampaignGroups.useQuery(
		{
			accountId: selectedAccountId,
			timeRange,
		},
		{
			enabled: !!selectedAccountId && isConnected,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	const handleSync = async () => {
		setIsSyncing(true);
		const promise = utils.linkedInAds.accounts.listAdAccounts.fetch();
		toast.promise(promise, {
			loading: "Syncing your LinkedIn ad accounts...",
			success: (data) => {
				setIsSyncing(false);
				return `Successfully synced ${data?.data?.length || 0} accounts`;
			},
			error: (err) => {
				setIsSyncing(false);
				return `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`;
			},
		});
	};

	const handleRefetchAccounts = React.useCallback(() => {
		refetchCredentials();
		refetchAccounts();
		if (selectedAccountId) {
			refetchCampaigns();
		}
	}, [refetchCredentials, refetchAccounts, selectedAccountId, refetchCampaigns]);

	React.useMemo(() => {
		if (accountsError) {
			toast.error(accountsError.message || "Failed to load LinkedIn ad accounts");
		}
		if (campaignsError) {
			toast.error(campaignsError.message || "Failed to load campaigns");
		}
	}, [accountsError, campaignsError]);

	const campaigns = campaignsData?.data || [];
	const currentAccount = accounts.find((a) => String(a.id) === selectedAccountId);
	const currency = currentAccount?.currency || "USD";

	const metrics = React.useMemo(() => {
		let totalImpressions = 0;
		let totalClicks = 0;
		let totalSpend = 0;
		let totalConversions = 0;
		let totalOneClickLeads = 0;
		let totalVideoViews = 0;
		let totalVideoCompletions = 0;
		campaigns.forEach((campaign: any) => {
			if (campaign.insights) {
				totalImpressions += Number(campaign.insights.impressions || 0);
				totalClicks += Number(campaign.insights.clicks || 0);
				totalSpend += Number(campaign.insights.spend || 0);
				totalConversions += Number(campaign.insights.externalWebsiteConversions || 0);
				totalOneClickLeads += Number(campaign.insights.oneClickLeads || 0);
				totalVideoViews += Number(campaign.insights.videoViews || 0);
				totalVideoCompletions += Number(campaign.insights.videoCompletions || 0);
			}
		});
		const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
		const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
		return {
			totalImpressions,
			totalClicks,
			totalSpend,
			totalConversions,
			totalOneClickLeads,
			totalVideoViews,
			totalVideoCompletions,
			avgCPC,
			avgCTR,
		};
	}, [campaigns]);

	const formatNumber = (value: number | string): string => {
		const num = typeof value === "string" ? parseFloat(value) : value;
		if (Number.isNaN(num)) return "0";
		if (num % 1 === 0) return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
		return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	};

	const formatCurrency = (value: number | string): string => {
		const num = typeof value === "string" ? parseFloat(value) : value;
		if (Number.isNaN(num)) return "0";
		try {
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(num);
		} catch {
			return `${currency} ${formatNumber(num)}`;
		}
	};

	const getStatusStyles = (status?: string | null) => {
		if (!status) return { variant: "secondary" as const };
		const upperStatus = status.toUpperCase();
		if (upperStatus === "ACTIVE") {
			return {
				variant: "outline" as const,
				className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full",
			};
		}
		if (upperStatus === "DISABLED" || upperStatus === "CLOSED") return { variant: "destructive" as const };
		return { variant: "secondary" as const };
	};

	const getServingStatusStyles = (servingStatus?: string | null) => {
		const value = (servingStatus || "").toUpperCase();
		if (value === "RUNNABLE") {
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
		}
		if (value === "BILLING_HOLD" || value === "ACCOUNT_TOTAL_BUDGET_HOLD" || value === "ACCOUNT_END_DATE_HOLD") {
			return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800";
		}
		if (value === "STOPPED") {
			return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800";
		}
		if (value === "RESTRICTED_HOLD" || value === "INTERNAL_HOLD") {
			return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800";
		}
		return "bg-muted text-muted-foreground border-border";
	};

	if (isLoadingCredentials && !isConnected) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex items-center justify-center py-24">
						<Spinner size={32} />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground font-sans">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-xl font-bold tracking-tight">LinkedIn Ads</h1>
					<p className="text-xs text-muted-foreground">
						Comprehensive performance metrics from your LinkedIn ad accounts.
					</p>
				</div>
				{!isConnected ? (
					<div className="mt-8 flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-muted rounded-xl">
						<ConnectLinkedInAds onConnected={handleRefetchAccounts} />
						{credentialsError && (
							<div className="mt-4 text-sm text-muted-foreground max-w-sm">
								{credentialsError.message || "Please connect your LinkedIn account to continue."}
							</div>
						)}
					</div>
				) : (
					<>
						<div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-muted pb-6">
							<div className="w-full md:max-w-md flex items-center gap-2">
								{isLoadingAccounts ? (
									<div className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-2 shadow-sm border-muted/60">
										<Spinner size={16} className="shrink-0 text-muted-foreground" />
										<span className="text-sm text-muted-foreground">Loading accounts...</span>
									</div>
								) : (
									<Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
										<SelectTrigger className="w-full h-10 shadow-sm border-muted/60">
											<SelectValue placeholder="Select an ad account">
												{(() => {
													if (!selectedAccountId) return null;
													const selected = accounts.find((a) => String(a.id) === selectedAccountId);
													if (!selected) return null;
													const statusStyles = getStatusStyles(selected.status);
													return (
														<div className="flex items-center justify-between w-full">
															<div className="flex items-center gap-2">
																<Building2 className="h-4 w-4 text-muted-foreground" />
																<span className="truncate block max-w-[120px] md:max-w-[180px] lg:max-w-[240px] font-medium">
																	{selected.name || `Account ${selected.id}`}
																</span>
															</div>
															{selected.status && (
																<Badge
																	variant={statusStyles.variant}
																	className={cn("text-[8px] px-1 py-0 font-bold uppercase shrink-0 ml-2", statusStyles.className)}
																>
																	{selected.status}
																</Badge>
															)}
														</div>
													);
												})()}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{accounts.map((account) => {
												const statusStyles = getStatusStyles(account.status);
												return (
													<SelectItem key={String(account.id)} value={String(account.id)}>
														<div className="flex items-center justify-between w-full min-w-[200px]">
															<div className="flex items-center gap-2">
																<Building2 className="h-4 w-4 text-muted-foreground" />
																<span className="font-medium">{account.name || `Account ${account.id}`}</span>
															</div>
															{account.status && (
																<Badge
																	variant={statusStyles.variant}
																	className={cn("text-[8px] px-1 py-0 font-bold uppercase ml-2", statusStyles.className)}
																>
																	{account.status}
																</Badge>
															)}
														</div>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								)}
								<Button
									variant="outline"
									size="icon"
									className="h-10 w-10 shrink-0 border-muted/60 shadow-sm"
									onClick={handleSync}
									disabled={isSyncing || isLoadingAccounts}
									title="Sync accounts"
								>
									<RefreshCw className={cn("h-4 w-4 text-muted-foreground", isSyncing && "animate-spin")} />
								</Button>
							</div>

							<div className="flex items-center gap-2 w-full md:w-auto">
								<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
									<PopoverTrigger asChild>
										<Button variant="outline" size="sm" className="h-10 w-full md:w-auto justify-start shadow-sm border-muted/60 font-medium whitespace-nowrap">
											<CalendarIcon className="mr-2 h-4 w-4" />
											{dateRange?.from && dateRange?.to
												? format(dateRange.from, "MMM dd") === format(dateRange.to, "MMM dd")
													? format(dateRange.from, "MMM dd, yyyy")
													: `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
												: "Pick a date range"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="end">
										<Calendar
											initialFocus
											mode="range"
											defaultMonth={dateRange?.from}
											selected={dateRange}
											onSelect={setDateRange}
											numberOfMonths={2}
											disabled={(date) => date > new Date()}
										/>
									</PopoverContent>
								</Popover>
								<Button
									variant="outline"
									size="icon"
									className="h-10 w-10 shadow-sm border-muted/60"
									onClick={handleRefetchAccounts}
									disabled={isLoadingCampaigns || isFetchingCampaigns || isLoadingAccounts}
								>
									<RefreshCw className={cn("h-4 w-4", (isLoadingCampaigns || isFetchingCampaigns || isLoadingAccounts) && "animate-spin")} />
								</Button>
							</div>
						</div>

						{isLoadingCampaigns || isLoadingAccounts ? (
							<div className="flex items-center justify-center py-24">
								<Spinner size={32} />
							</div>
						) : campaigns.length > 0 ? (
							<div className="mt-8 space-y-12">
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
									<MetricCard title="Total Impressions" value={formatNumber(metrics.totalImpressions)} icon={<Target className="h-4 w-4" />} color="green" />
									<MetricCard title="Total Clicks" value={formatNumber(metrics.totalClicks)} icon={<MousePointer2 className="h-4 w-4" />} color="purple" />
									<MetricCard title="Amount Spent" value={formatCurrency(metrics.totalSpend)} icon={<TrendingUp className="h-4 w-4" />} color="orange" />
									<MetricCard title="Avg CPC" value={formatCurrency(metrics.avgCPC)} icon={<BarChart3 className="h-4 w-4" />} color="blue" />
									<MetricCard title="Avg CTR" value={`${metrics.avgCTR.toFixed(2)}%`} icon={<TrendingUp className="h-4 w-4" />} color="indigo" />
									<MetricCard title="Conversions" value={formatNumber(metrics.totalConversions)} icon={<Target className="h-4 w-4" />} color="emerald" />
									<MetricCard title="One Click Leads" value={formatNumber(metrics.totalOneClickLeads)} icon={<Target className="h-4 w-4" />} color="orange" />
									<MetricCard title="Video Views" value={formatNumber(metrics.totalVideoViews)} icon={<BarChart3 className="h-4 w-4" />} color="blue" />
									<MetricCard title="Video Completions" value={formatNumber(metrics.totalVideoCompletions)} icon={<TrendingUp className="h-4 w-4" />} color="indigo" />
								</div>

								<div className="space-y-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Target className="h-4 w-4 text-primary" />
											<h2 className="text-sm font-bold tracking-tight uppercase opacity-60">Active Campaigns</h2>
										</div>
										<Badge variant="outline" className="text-[10px] font-bold opacity-60">
											{campaigns.length} total
										</Badge>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
										{campaigns.map((campaign: any) => (
											<Card
												key={campaign.id}
												className="group hover:border-primary/40 transition-all cursor-pointer shadow-none border-muted/60 overflow-hidden flex flex-col"
											onClick={() =>
												navigate(`/agency/ad-campaigns/linkedin-ads/${selectedAccountId}/campaigns/${campaign.id}`)
											}
											>
												<CardContent className="p-6 flex-1 flex flex-col justify-between gap-6">
													<div className="flex items-start justify-between gap-3">
														<div className="font-bold text-sm tracking-tight truncate group-hover:text-primary transition-colors">
															{campaign.name || `Campaign ${campaign.id}`}
														</div>
														<Badge variant="secondary" className="text-[8px] px-1.5 py-0 font-bold uppercase">
															{campaign.status || "UNKNOWN"}
														</Badge>
													</div>

													{Array.isArray(campaign.servingStatuses) && campaign.servingStatuses.length > 0 && (
														<div className="flex flex-wrap gap-1.5">
															{campaign.servingStatuses.slice(0, 3).map((s: string, idx: number) => (
																<Badge
																	key={`${campaign.id}-serving-${idx}`}
																	variant="outline"
																	className={cn("text-[8px] px-1.5 py-0 font-bold uppercase", getServingStatusStyles(s))}
																>
																	{s}
																</Badge>
															))}
														</div>
													)}

													{campaign.insights ? (
														<div className="grid grid-cols-2 gap-3">
															<div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 space-y-1">
																<p className="text-[9px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Impressions</p>
																<p className="text-sm font-bold text-blue-900 dark:text-blue-100">{formatNumber(campaign.insights.impressions || 0)}</p>
															</div>
															<div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 space-y-1">
																<p className="text-[9px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">Clicks</p>
																<p className="text-sm font-bold text-purple-900 dark:text-purple-100">{formatNumber(campaign.insights.clicks || 0)}</p>
															</div>
															<div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 space-y-1">
																<p className="text-[9px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">CTR</p>
																<p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
																	{campaign.insights.ctr ? `${Number(campaign.insights.ctr).toFixed(2)}%` : "0%"}
																</p>
															</div>
															<div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 space-y-1">
																<p className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Spent</p>
																<p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(campaign.insights.spend || 0)}</p>
															</div>
															<div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 space-y-1">
																<p className="text-[9px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">Leads</p>
																<p className="text-sm font-bold text-orange-900 dark:text-orange-100">{formatNumber(campaign.insights.oneClickLeads || 0)}</p>
															</div>
															<div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 space-y-1">
																<p className="text-[9px] font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Video Views</p>
																<p className="text-sm font-bold text-cyan-900 dark:text-cyan-100">{formatNumber(campaign.insights.videoViews || 0)}</p>
															</div>
														</div>
													) : (
														<div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-lg border border-dashed border-muted">
															<p className="text-xs text-muted-foreground font-medium">No performance data for this period</p>
														</div>
													)}

													<div className="pt-4 border-t border-muted/40 flex items-center justify-between">
														<div className="text-[9px] font-medium text-muted-foreground">
															Account: {currentAccount?.name || currentAccount?.id || selectedAccountId}
														</div>
														<div className="flex items-center gap-1 text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
															View Details <ChevronDown className="h-3 w-3 -rotate-90" />
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-32 text-center">
								<div className="p-5 rounded-full bg-muted/30 mb-5">
									<Target className="h-10 w-10 text-muted-foreground/40" />
								</div>
								<h3 className="text-lg font-bold tracking-tight">No campaign data available</h3>
								<p className="text-sm text-muted-foreground mt-2 max-w-sm">
									We couldn't find campaigns for this account in the selected period.
								</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

function MetricCard({
	title,
	value,
	icon,
	color,
}: {
	title: string;
	value: string;
	icon: React.ReactNode;
	color: "blue" | "green" | "purple" | "orange" | "indigo" | "emerald";
}) {
	const colorClasses = {
		blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
		green: "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
		purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
		orange: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
		indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
		emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
	};
	return (
		<Card className="overflow-hidden border-muted/60 shadow-none hover:border-muted-foreground/10 transition-colors">
			<CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
				<div className="flex items-center justify-between">
					<div className={cn("p-1.5 rounded-md border", colorClasses[color])}>{icon}</div>
				</div>
				<div>
					<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{title}</p>
					<h3 className="text-xl font-bold tracking-tight">{value}</h3>
				</div>
			</CardContent>
		</Card>
	);
}
