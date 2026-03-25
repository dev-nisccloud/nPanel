"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
	Target,
	BarChart3,
	RefreshCw,
	TrendingUp,
	Calendar as CalendarIcon,
	Building2,
	Eye,
	MousePointer2,
	ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { ConnectGoogleAds } from "./agency.ad-campaigns/google-ads/_components/connect-google-ads";
import type { StoredCredentials } from "./agency.ad-campaigns/google-ads/_components/schemas";
import type { GoogleAdsAccount } from "./agency.ad-campaigns/google-ads/_components/schemas";

/** Format customer ID with dashes for display (XXXXXXXXXX -> XXX-XXX-XXXX) */
function formatCustomerIdDisplay(customerId: string): string {
	const raw = customerId.replace(/-/g, "");
	return raw.length === 10
		? `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`
		: customerId;
}

/** Format customer ID for API (accepts with or without dashes; API normalizes) */
function formatCustomerIdForApi(customerId: string): string {
	return customerId.replace(/-/g, "");
}

export default function GoogleAdsPage() {
	const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
	const [isSyncing, setIsSyncing] = React.useState(false);
	const utils = trpc.useUtils();
	const navigate = useNavigate();

	// Date range state
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
		from: new Date(new Date().setDate(new Date().getDate() - 30)),
		to: new Date(),
	});
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

	// Check credentials
	const {
		data: credentialsData,
		isLoading: isLoadingCredentials,
		error: credentialsError,
		refetch: refetchCredentials,
	} = trpc.googleAds.auth.getStoredCredentials.useQuery(undefined, {
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const credentials = credentialsData?.data as StoredCredentials | null | undefined;
	const isConnected = credentials?.connected === true;

	// Fetch accounts if connected
	const {
		data: accountsData,
		isLoading: isLoadingAccounts,
		error: accountsError,
		refetch: refetchAccounts,
	} = trpc.googleAds.accounts.listAccessibleAccounts.useQuery({ forceRefresh: false }, {
		enabled: isConnected,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const accounts = accountsData?.data || [];

	// Auto-select first account if available and none selected
	React.useMemo(() => {
		if (accounts.length > 0 && !selectedCustomerId) {
			const first = accounts[0] as GoogleAdsAccount;
			setSelectedCustomerId(first.customerId ?? "");
		}
	}, [accounts, selectedCustomerId]);

	const formattedCustomerId = selectedCustomerId
		? formatCustomerIdDisplay(selectedCustomerId)
		: "";

	// Fetch account details when account is selected
	const {
		data: accountData,
		isLoading: isLoadingAccount,
		error: accountError,
		refetch: refetchAccount,
	} = trpc.googleAds.accounts.getAccountDetails.useQuery(
		{ customerId: formattedCustomerId || selectedCustomerId },
		{
			enabled: !!selectedCustomerId && isConnected,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	// Prepare date range for API
	const timeRange =
		dateRange?.from && dateRange?.to
			? {
				since: format(dateRange.from, "yyyy-MM-dd"),
				until: format(dateRange.to, "yyyy-MM-dd"),
			}
			: undefined;

	// Fetch campaigns when account is selected
	const {
		data: campaignsData,
		isLoading: isLoadingCampaigns,
		error: campaignsError,
		isFetching: isFetchingCampaigns,
		refetch: refetchCampaigns,
	} = trpc.googleAds.campaigns.listCampaigns.useQuery(
		{
			customerId: formattedCustomerId || selectedCustomerId,
			timeRange,
		},
		{
			enabled: !!selectedCustomerId && isConnected,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	// Handle errors
	React.useMemo(() => {
		if (accountError) {
			toast.error(accountError.message || "Failed to load account details");
		}
		if (campaignsError) {
			toast.error(campaignsError.message || "Failed to load campaigns");
		}
		if (accountsError) {
			toast.error(accountsError.message || "Failed to load Google Ads accounts");
		}
	}, [accountError, campaignsError, accountsError]);

	const account = accountData?.data;
	const campaigns = campaignsData?.data || [];
	const currency = account?.currencyCode ?? "USD";

	const calculateAggregatedMetrics = () => {
		let totalImpressions = 0;
		let totalClicks = 0;
		let totalSpend = 0;
		let totalConversions = 0;
		let campaignsWithInsights = 0;

		campaigns.forEach((campaign: any) => {
			if (campaign.insights) {
				campaignsWithInsights++;
				totalImpressions += parseFloat(campaign.insights.impressions || "0");
				totalClicks += parseFloat(campaign.insights.clicks || "0");
				totalSpend += parseFloat(campaign.insights.cost || "0");
				totalConversions += parseFloat(campaign.insights.conversions || "0");
			}
		});

		const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
		const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

		return {
			totalImpressions,
			totalClicks,
			totalSpend,
			totalConversions,
			avgCPC,
			avgCTR,
			campaignsWithInsights,
			totalCampaigns: campaigns.length,
		};
	};

	const metrics = calculateAggregatedMetrics();

	const formatNumber = (value: number | string): string => {
		const num = typeof value === "string" ? parseFloat(value) : value;
		if (Number.isNaN(num)) return "0";
		if (num % 1 === 0) {
			return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
		}
		return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	};

	const formatCurrency = (value: number | string): string => {
		const num = typeof value === "string" ? parseFloat(value) : value;
		if (Number.isNaN(num)) return "0";
		try {
			const formatter = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
			return formatter.format(num);
		} catch {
			return `${currency} ${formatNumber(num)}`;
		}
	};

	const getStatusVariant = (status?: string) => {
		if (!status) return { variant: "secondary" as const };
		const upper = status.toUpperCase();
		if (upper === "ACTIVE" || upper === "ENABLED") {
			return {
				variant: "outline" as const,
				className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full",
			};
		}
		if (upper === "PAUSED" || upper === "REMOVED") return { variant: "destructive" as const };
		return { variant: "secondary" as const };
	};

	const getCampaignStatusVariant = (status?: string | number) => {
		if (status === undefined || status === null) return { variant: "secondary" as const };
		const upper = String(status).toUpperCase();
		if (upper === "ENABLED" || upper === "ACTIVE") {
			return {
				variant: "outline" as const,
				className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full",
			};
		}
		if (upper === "REMOVED" || upper === "DELETED") return { variant: "destructive" as const };
		return { variant: "secondary" as const };
	};

	const formatGoogleDate = (yyyyMMdd: string | undefined): string => {
		if (!yyyyMMdd) return "No date";
		try {
			const normalized = yyyyMMdd.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
			return format(new Date(normalized), "MMM dd, yyyy");
		} catch {
			return yyyyMMdd;
		}
	};

	const handleRefetchAccounts = React.useCallback(() => {
		refetchCredentials();
		refetchAccounts();
		if (selectedCustomerId) {
			refetchAccount();
			refetchCampaigns();
		}
	}, [refetchCredentials, refetchAccounts, selectedCustomerId, refetchAccount, refetchCampaigns]);

	const handleSync = async () => {
		setIsSyncing(true);
		const promise = utils.googleAds.accounts.listAccessibleAccounts.fetch({ forceRefresh: true });

		toast.promise(promise, {
			loading: 'Syncing your Google Ads accounts...',
			success: (data) => {
				setIsSyncing(false);
				return `Successfully synced ${data?.data?.length || 0} accounts`;
			},
			error: (err) => {
				setIsSyncing(false);
				return `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
			},
		});
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
				{/* Header */}
				<div className="flex flex-col gap-2">
					<h1 className="text-xl font-bold tracking-tight">Google Ads</h1>
					<p className="text-xs text-muted-foreground">
						Comprehensive performance metrics from your Google Ads accounts.
					</p>
				</div>

				{!isConnected ? (
					<div className="mt-8 flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-muted rounded-xl">
						<ConnectGoogleAds onConnected={handleRefetchAccounts} />
						{credentialsError && (
							<div className="mt-4 text-sm text-muted-foreground max-w-sm">
								{credentialsError.message || "Please connect your Google Ads account to continue."}
							</div>
						)}
					</div>
				) : (
					<>
						{/* Account Switcher & Date Picker (Unified Row) */}
						<div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-muted pb-6">
							<div className="w-full md:max-w-md flex items-center gap-2">
								<Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
									<SelectTrigger className="w-full h-10 shadow-sm border-muted/60">
										<SelectValue placeholder="Select an ad account">
											{(() => {
												const currentAccount = accounts.find((acc: GoogleAdsAccount) => acc.customerId === selectedCustomerId);
												if (selectedCustomerId && currentAccount) {
													const statusStyles = getStatusVariant(currentAccount.status);
													return (
														<div className="flex items-center justify-between w-full">
															<div className="flex items-center gap-2">
																<Building2 className="h-4 w-4 text-muted-foreground" />
																<span className="truncate block max-w-[120px] md:max-w-[180px] lg:max-w-[240px] font-medium">
																	{currentAccount.accountName || `Account ${formatCustomerIdDisplay(selectedCustomerId)}`}
																</span>
															</div>
															{currentAccount.status && (
																<Badge
																	variant={statusStyles.variant}
																	className={cn("text-[8px] px-1 py-0 font-bold uppercase shrink-0 ml-2", statusStyles.className)}
																>
																	{currentAccount.status}
																</Badge>
															)}
														</div>
													);
												}
												return null;
											})()}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{accounts.map((accountItem: GoogleAdsAccount) => {
											const statusStyles = getStatusVariant(accountItem.status);
											return (
												<SelectItem key={accountItem.customerId} value={accountItem.customerId}>
													<div className="flex items-center justify-between w-full min-w-[200px]">
														<div className="flex items-center gap-2">
															<Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
															<span className="font-medium">{accountItem.accountName ?? `Account ${accountItem.customerId}`}</span>
														</div>
														{accountItem.status && (
															<Badge
																variant={statusStyles.variant}
																className={cn("text-[8px] px-1 py-0 font-bold uppercase ml-2", statusStyles.className)}
															>
																{accountItem.status}
															</Badge>
														)}
													</div>
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									size="icon"
									className="h-10 w-10 shrink-0 border-muted/60 shadow-sm"
									onClick={handleSync}
									disabled={isSyncing}
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
											{dateRange?.from && dateRange?.to ? (
												format(dateRange.from, "MMM dd") === format(dateRange.to, "MMM dd") ? (
													format(dateRange.from, "MMM dd, yyyy")
												) : (
													<>{format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}</>
												)
											) : (
												"Pick a date range"
											)}
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
									disabled={isLoadingAccount || isFetchingCampaigns || isLoadingAccounts}
								>
									<RefreshCw className={cn("h-4 w-4", (isLoadingAccount || isFetchingCampaigns || isLoadingAccounts) && "animate-spin")} />
								</Button>
							</div>
						</div>

						{isLoadingAccount || isLoadingCampaigns || isLoadingAccounts ? (
							<div className="flex items-center justify-center py-24">
								<Spinner size={32} />
							</div>
						) : campaigns.length > 0 ? (
							<div className="mt-8 space-y-12">
								{/* Overview Scorecards (Standardized) */}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
									<MetricCard
										title="Total Impressions"
										value={formatNumber(metrics.totalImpressions)}
										icon={<Target className="h-4 w-4" />}
										color="purple"
									/>
									<MetricCard
										title="Total Clicks"
										value={formatNumber(metrics.totalClicks)}
										icon={<MousePointer2 className="h-4 w-4" />}
										color="green"
									/>
									<MetricCard
										title="Amount Spent"
										value={formatCurrency(metrics.totalSpend)}
										icon={<TrendingUp className="h-4 w-4" />}
										color="emerald"
									/>
									<MetricCard
										title="Avg CPC"
										value={formatCurrency(metrics.avgCPC)}
										icon={<BarChart3 className="h-4 w-4" />}
										color="orange"
									/>
									<MetricCard
										title="Avg CTR"
										value={`${metrics.avgCTR.toFixed(2)}%`}
										icon={<TrendingUp className="h-4 w-4" />}
										color="indigo"
									/>
									<MetricCard
										title="Conversions"
										value={formatNumber(metrics.totalConversions)}
										icon={<Target className="h-4 w-4" />}
										color="blue"
									/>
								</div>

								{/* Campaigns Section */}
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
												onClick={() => {
													navigate(`/agency/ad-campaigns/google-ads/campaigns/${campaign.id}?customerId=${selectedCustomerId}`);
												}}
											>
												<CardHeader className="py-4 px-6 border-b border-muted/60 bg-muted/5 group-hover:bg-primary/[0.02] transition-colors">
													<div className="flex items-start justify-between gap-3">
														<div className="flex flex-col gap-1 min-w-0">
															<div className="font-bold text-sm tracking-tight truncate group-hover:text-primary transition-colors">
																{campaign.name ?? `Campaign ${campaign.id}`}
															</div>
															<div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
																<span className="flex items-center gap-1">
																	<TrendingUp className="h-3 w-3" />
																	{campaign.advertising_channel_type || "SEARCH"}
																</span>
															</div>
														</div>
														<Badge
															variant={getCampaignStatusVariant(campaign.status).variant}
															className={cn("text-[8px] px-1.5 py-0 font-bold uppercase", getCampaignStatusVariant(campaign.status).className)}
														>
															{campaign.status}
														</Badge>
													</div>
												</CardHeader>
												<CardContent className="p-6 flex-1 flex flex-col justify-between gap-6">
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
																	{(() => {
																		const ctr = campaign.insights.ctr;
																		if (!ctr || ctr === '0') return '0%';
																		const ctrNum = typeof ctr === 'string' ? parseFloat(ctr) : ctr;
																		return `${ctrNum.toFixed(2)}%`;
																	})()}
																</p>
															</div>
															<div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 space-y-1">
																<p className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Spent</p>
																<p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(campaign.insights.cost || 0)}</p>
															</div>
														</div>
													) : (
														<div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-lg border border-dashed border-muted">
															<p className="text-xs text-muted-foreground font-medium">No performance data for this period</p>
														</div>
													)}

													<div className="pt-4 border-t border-muted/40 flex items-center justify-between">
														<div className="flex flex-col gap-1">
															<div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground">
																<CalendarIcon className="h-3 w-3" />
																<span>
																	{formatGoogleDate(campaign.start_date)}
																	{" — "}
																	{campaign.end_date ? formatGoogleDate(campaign.end_date) : "Ongoing"}
																</span>
															</div>
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
									We couldn't find any campaigns for "{formattedCustomerId || selectedCustomerId}" during this period.
								</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

/**
 * Standardized Metric Card (Replicated from Meta Ads & SEO Reports)
 */
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
					<div className={cn("p-1.5 rounded-md border", colorClasses[color])}>
						{icon}
					</div>
				</div>
				<div>
					<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{title}</p>
					<h3 className="text-xl font-bold tracking-tight">{value}</h3>
				</div>
			</CardContent>
		</Card>
	);
}
