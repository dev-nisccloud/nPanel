"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
	Target,
	BarChart3,
	RefreshCw,
	TrendingUp,
	Calendar as CalendarIcon,
	Building2
} from "lucide-react";
import { ConnectMetaAds } from "./_components/connect-meta-ads";
import type { StoredCredentials } from "./_components/schemas";
import type { MetaAdsAccount } from "./_components/schemas";

export default function MetaAdsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	// Initialize state from URL search params
	const paramAccountId = searchParams.get("accountId");
	const paramFrom = searchParams.get("from");
	const paramTo = searchParams.get("to");

	const [selectedAccountId, setSelectedAccountId] = React.useState<string>(paramAccountId || "");

	// Date range state
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
		if (paramFrom && paramTo) {
			const fromDate = new Date(paramFrom);
			const toDate = new Date(paramTo);
			if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
				return { from: fromDate, to: toDate };
			}
		}
		return {
			from: new Date(new Date().setDate(new Date().getDate() - 30)), // Default to last 30 days
			to: new Date(),
		};
	});
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

	/**
	 * Update URL search parameters
	 */
	const updateSearchParams = React.useCallback((updates: Record<string, string | undefined>) => {
		const current = new URLSearchParams(Array.from(searchParams.entries()));

		Object.entries(updates).forEach(([key, value]) => {
			if (value) {
				current.set(key, value);
			} else {
				current.delete(key);
			}
		});

		const search = current.toString();
		const query = search ? `?${search}` : "";
		router.replace(`${pathname}${query}`, { scroll: false });
	}, [searchParams, pathname, router]);

	// Sync selection changes to URL
	React.useEffect(() => {
		const updates: Record<string, string | undefined> = {};

		if (selectedAccountId) {
			updates.accountId = selectedAccountId;
		}

		if (dateRange?.from && dateRange?.to) {
			updates.from = format(dateRange.from, "yyyy-MM-dd");
			updates.to = format(dateRange.to, "yyyy-MM-dd");
		}

		if (Object.keys(updates).length > 0) {
			updateSearchParams(updates);
		}
	}, [selectedAccountId, dateRange, updateSearchParams]);

	// Campaign dialog state
	const [selectedCampaign, setSelectedCampaign] = React.useState<any | null>(null);

	// Check credentials
	const {
		data: credentialsData,
		isLoading: isLoadingCredentials,
		error: credentialsError,
		refetch: refetchCredentials,
	} = trpc.metaAds.auth.getStoredCredentials.useQuery(undefined, {
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
	} = trpc.metaAds.accounts.listAdAccounts.useQuery(undefined, {
		enabled: isConnected,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const accounts = accountsData?.data || [];

	// Auto-select first account if available and none selected
	React.useMemo(() => {
		if (accounts.length > 0 && !selectedAccountId) {
			setSelectedAccountId(accounts[0].accountId);
		}
	}, [accounts, selectedAccountId]);

	// Fetch account details when account is selected
	const {
		data: accountData,
		isLoading: isLoadingAccount,
		error: accountError,
		refetch: refetchAccount,
	} = trpc.metaAds.accounts.getAccountDetails.useQuery(
		{ accountId: selectedAccountId },
		{
			enabled: !!selectedAccountId && isConnected,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	// Check if error requires reconnection (OAuth token invalidated)
	const requiresReconnect = React.useMemo(() => {
		if (accountsError && accountsError.data && typeof accountsError.data === 'object' && 'cause' in accountsError.data) {
			const cause = accountsError.data.cause as any;
			return cause?.requiresReconnect === true;
		}
		if (accountError && accountError.data && typeof accountError.data === 'object' && 'cause' in accountError.data) {
			const cause = accountError.data.cause as any;
			return cause?.requiresReconnect === true;
		}
		return false;
	}, [accountsError, accountError]);

	// If OAuth error detected, refetch credentials to update connection status
	React.useMemo(() => {
		if (requiresReconnect) {
			refetchCredentials();
			setSelectedAccountId(""); // Clear selected account
		}
	}, [requiresReconnect, refetchCredentials]);

	// Prepare date range for API
	const timeRange = dateRange?.from && dateRange?.to ? {
		since: format(dateRange.from, "yyyy-MM-dd"),
		until: format(dateRange.to, "yyyy-MM-dd"),
	} : undefined;

	// Fetch campaigns when account is selected
	const {
		data: campaignsData,
		isLoading: isLoadingCampaigns,
		error: campaignsError,
		refetch: refetchCampaigns,
	} = trpc.metaAds.campaigns.listCampaigns.useQuery(
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

	// Handle errors without useEffect - use React.useMemo to show toasts
	React.useMemo(() => {
		if (accountError) {
			toast.error(accountError.message || "Failed to load account details");
		}
		if (campaignsError) {
			toast.error(campaignsError.message || "Failed to load campaigns");
		}
		if (accountsError) {
			toast.error(accountsError.message || "Failed to load Meta ad accounts");
		}
	}, [accountError, campaignsError, accountsError]);

	const account = accountData?.data;
	const campaigns = campaignsData?.data || [];
	const currency = account?.currency || 'USD'; // Default to USD if not available

	/**
	 * Calculate aggregated metrics from all campaigns
	 */
	const calculateAggregatedMetrics = () => {
		let totalReach = 0;
		let totalImpressions = 0;
		let totalLinkClicks = 0;
		let totalSpend = 0;
		let totalClicks = 0;
		let campaignsWithInsights = 0;

		campaigns.forEach((campaign: any) => {
			if (campaign.insights) {
				campaignsWithInsights++;
				totalReach += parseFloat(campaign.insights.reach || '0');
				totalImpressions += parseFloat(campaign.insights.impressions || '0');
				totalLinkClicks += parseFloat(campaign.insights.link_clicks || campaign.insights.clicks || '0');
				totalClicks += parseFloat(campaign.insights.clicks || '0');
				totalSpend += parseFloat(campaign.insights.spend || '0');
			}
		});

		// Calculate averages
		const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
		const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

		return {
			totalReach,
			totalImpressions,
			totalLinkClicks,
			totalSpend,
			avgCPC,
			avgCTR,
			campaignsWithInsights,
			totalCampaigns: campaigns.length,
		};
	};

	const metrics = calculateAggregatedMetrics();

	/**
	 * Format number with commas (e.g., 3,000 or 100,000.00 or 1,000,000.00)
	 */
	const formatNumber = (value: number | string): string => {
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(num)) return '0';

		// If it's a whole number, don't show decimals
		if (num % 1 === 0) {
			return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
		}
		// Otherwise show 2 decimal places
		return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	};

	/**
	 * Format currency amount with proper symbol
	 */
	const formatCurrency = (value: number | string): string => {
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(num)) return '0';

		try {
			const formatter = new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: currency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
			return formatter.format(num);
		} catch (error) {
			// Fallback if currency code is invalid
			return `${currency} ${formatNumber(num)}`;
		}
	};

	const getStatusStyles = (status?: string) => {
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

	const getCampaignStatusStyles = (status?: string) => {
		if (!status) return { variant: "secondary" as const };
		const upperStatus = status.toUpperCase();
		if (upperStatus === "ACTIVE") {
			return {
				variant: "outline" as const,
				className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full",
			};
		}
		if (upperStatus === "DELETED") return { variant: "destructive" as const };
		return { variant: "secondary" as const };
	};

	/**
	 * Parse objective field - if format is OUTCOME_XXX, extract XXX
	 * Otherwise return as is
	 */
	const parseObjective = (objective?: string): string => {
		if (!objective) return "";
		// Check if it starts with OUTCOME_
		if (objective.startsWith("OUTCOME_")) {
			return objective.replace("OUTCOME_", "");
		}
		// Return as is if format is different
		return objective;
	};

	const handleRefetchAccounts = React.useCallback(() => {
		refetchCredentials();
		refetchAccounts();
	}, [refetchCredentials, refetchAccounts]);

	if (isLoadingCredentials) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex items-center justify-center py-12">
						<Spinner size={32} />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Meta Ads</h1>
					<p className="text-xs text-muted-foreground">
						Manage your Meta (Facebook/Instagram) ad campaigns, ad sets, and ads from one place.
					</p>
				</div>

				{!isConnected || requiresReconnect ? (
					<div className="mt-6 flex flex-col items-center justify-center py-12">
						<ConnectMetaAds onConnected={handleRefetchAccounts} />
						{(credentialsError || requiresReconnect) && (
							<div className="mt-4 text-sm text-muted-foreground">
								{requiresReconnect
									? "Your Facebook session has been invalidated. Please reconnect your account."
									: credentialsError?.message || "Please connect your Meta account to continue."
								}
							</div>
						)}
					</div>
				) : (
					<>
						{/* Account Dropdown */}
						<div className="mt-6">
							{isLoadingAccounts ? (
								<Card>
									<CardHeader>
										<CardTitle>Meta Ad Accounts</CardTitle>
										<CardDescription>Loading your accessible Meta ad accounts...</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-center py-8">
											<Spinner size={32} />
										</div>
									</CardContent>
								</Card>
							) : accounts.length === 0 ? (
								<Card>
									<CardHeader>
										<CardTitle>Meta Ad Accounts</CardTitle>
										<CardDescription>No accessible Meta ad accounts found.</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex flex-col items-center justify-center py-8 text-center">
											<Building2 className="h-12 w-12 text-muted-foreground mb-4" />
											<p className="text-sm text-muted-foreground">
												No Meta ad accounts are accessible with your current integration.
											</p>
											<p className="text-xs text-muted-foreground mt-2">
												Make sure you have access to at least one Meta ad account.
											</p>
										</div>
									</CardContent>
								</Card>
							) : (
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle>Select Ad Account</CardTitle>
												<CardDescription>
													{accounts.length} {accounts.length === 1 ? "account" : "accounts"} accessible
												</CardDescription>
											</div>
											<Button
												variant="outline"
												size="icon"
												onClick={handleRefetchAccounts}
												title="Refresh accounts"
											>
												<RefreshCw className="h-4 w-4" />
											</Button>
										</div>
									</CardHeader>
									<CardContent>
										<Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
											<SelectTrigger className="w-full h-12 text-base">
												<SelectValue placeholder="Select an ad account">
													{selectedAccountId && accounts.find((acc: MetaAdsAccount) => acc.accountId === selectedAccountId) && (
														<div className="flex items-center gap-2">
															<Building2 className="h-5 w-5 text-muted-foreground" />
															<span className="font-medium">
																{accounts.find((acc: MetaAdsAccount) => acc.accountId === selectedAccountId)?.accountName ||
																	`Account ${selectedAccountId}`}
															</span>
															{(() => {
																const account = accounts.find((acc: MetaAdsAccount) => acc.accountId === selectedAccountId);
																if (!account?.status) return null;
																const styles = getStatusStyles(account.status);
																return (
																	<Badge variant={styles.variant} className={styles.className}>
																		{account.status}
																	</Badge>
																);
															})()}
														</div>
													)}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{accounts.map((account: MetaAdsAccount) => (
													<SelectItem key={account.accountId} value={account.accountId}>
														<div className="flex items-center justify-between w-full gap-4">
															<div className="flex items-center gap-2 flex-1 min-w-0">
																<Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
																<span className="font-medium truncate">
																	{account.accountName || `Account ${account.accountId}`}
																</span>
															</div>
															{account.status && (
																<Badge
																	variant={getStatusStyles(account.status).variant}
																	className={cn("flex-shrink-0", getStatusStyles(account.status).className)}
																>
																	{account.status}
																</Badge>
															)}
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</CardContent>
								</Card>
							)}
						</div>

						{/* Account Details - Show when account is selected */}
						{selectedAccountId && (
							<>
								{isLoadingAccount ? (
									<div className="mt-6 flex items-center justify-center py-12">
										<Spinner size={32} />
									</div>
								) : account ? (
									<>
										{/* Performance Metrics Overview */}
										<div className="mt-6">
											<Card>
												<CardHeader>
													<CardTitle>Performance Overview</CardTitle>
													<CardDescription>
														Aggregated metrics from {metrics.campaignsWithInsights} of {metrics.totalCampaigns} campaigns
														{dateRange?.from && dateRange?.to && (
															<span className="ml-2">
																({format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")})
															</span>
														)}
													</CardDescription>
												</CardHeader>
												<CardContent>
													<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
														{/* Reach */}
														<div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
															<div className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Total Reach</div>
															<div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
																{formatNumber(metrics.totalReach)}
															</div>
														</div>

														{/* Impressions */}
														<div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
															<div className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">Total Impressions</div>
															<div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
																{formatNumber(metrics.totalImpressions)}
															</div>
														</div>

														{/* Link Clicks */}
														<div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
															<div className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">Total Link Clicks</div>
															<div className="text-lg font-semibold text-green-900 dark:text-green-100">
																{formatNumber(metrics.totalLinkClicks)}
															</div>
														</div>

														{/* Amount Spent */}
														<div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
															<div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">Total Amount Spent</div>
															<div className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
																{formatCurrency(metrics.totalSpend)}
															</div>
														</div>

														{/* Average CPC */}
														<div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
															<div className="text-xs text-orange-700 dark:text-orange-300 font-medium mb-1">Avg CPC</div>
															<div className="text-lg font-semibold text-orange-900 dark:text-orange-100">
																{formatCurrency(metrics.avgCPC)}
															</div>
														</div>

														{/* Average CTR */}
														<div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
															<div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-1">Avg CTR</div>
															<div className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
																{metrics.avgCTR.toFixed(2)}%
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
										</div>

										{/* Campaigns Section */}
										<div className="mt-6">
											<Card>
												<CardHeader>
													<div className="flex items-center justify-between">
														<div>
															<CardTitle>Campaigns</CardTitle>
															<CardDescription>
																{campaigns.length} {campaigns.length === 1 ? "campaign" : "campaigns"} found
															</CardDescription>
														</div>
														<div className="flex items-center gap-2">
															<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
																<PopoverTrigger asChild>
																	<Button variant="outline" size="sm">
																		<CalendarIcon className="mr-2 h-4 w-4" />
																		{dateRange?.from && dateRange?.to ? (
																			format(dateRange.from, "MMM dd") === format(dateRange.to, "MMM dd") ? (
																				format(dateRange.from, "MMM dd, yyyy")
																			) : (
																				<>
																					{format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
																				</>
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
																		disabled={(date) =>
																			date > new Date() || date < new Date("1900-01-01")
																		}
																	/>
																</PopoverContent>
															</Popover>
															<Button
																variant="outline"
																size="icon"
																onClick={() => {
																	refetchCampaigns();
																	refetchAccount();
																}}
																title="Refresh campaigns"
															>
																<RefreshCw className="h-4 w-4" />
															</Button>
														</div>
													</div>
												</CardHeader>
												<CardContent>
													{isLoadingCampaigns ? (
														<div className="flex items-center justify-center py-12">
															<Spinner size={32} />
														</div>
													) : campaigns.length === 0 ? (
														<div className="flex flex-col items-center justify-center py-12 text-center">
															<Target className="h-12 w-12 text-muted-foreground mb-4" />
															<p className="text-sm text-muted-foreground">
																No campaigns found for this ad account.
															</p>
														</div>
													) : (
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
															{campaigns.map((campaign: any) => (
																<Card
																	key={campaign.id}
																	className="hover:bg-accent/50 transition-colors cursor-pointer"
																	onClick={() => {
																		router.push(`/agency/ad-campaigns/meta-ads/${selectedAccountId}/campaigns/${campaign.id}`);
																	}}
																>
																	<CardContent className="p-4">
																		<div className="flex flex-col gap-3">
																			{/* Status at the top on its own row */}
																			{campaign.status && (
																				<div>
																					<Badge
																						variant={getCampaignStatusStyles(campaign.status).variant}
																						className={getCampaignStatusStyles(campaign.status).className}
																					>
																						{campaign.status}
																					</Badge>
																				</div>
																			)}

																			{/* Campaign name - 2 rows max with ellipsis */}
																			<div className="font-medium line-clamp-2 min-h-[2.5rem]">
																				{campaign.name || `Campaign ${campaign.id}`}
																			</div>

																			{/* Objective */}
																			{campaign.objective && (
																				<div className="flex items-center gap-1.5 text-xs">
																					<TrendingUp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
																					<span className="text-muted-foreground">
																						{parseObjective(campaign.objective)}
																					</span>
																				</div>
																			)}

																			{/* Start Date */}
																			<div className="flex items-center gap-1.5 text-xs">
																				<CalendarIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
																				<span className="text-muted-foreground">
																					Start: {campaign.start_time
																						? new Date(campaign.start_time).toLocaleDateString()
																						: "-"
																					}
																				</span>
																			</div>

																			{/* End Date */}
																			<div className="flex items-center gap-1.5 text-xs">
																				<CalendarIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
																				<span className="text-muted-foreground">
																					End: {campaign.stop_time
																						? new Date(campaign.stop_time).toLocaleDateString()
																						: "-"
																					}
																				</span>
																			</div>

																			{/* Metrics Section */}
																			<div className="mt-4 pt-4 border-t">
																				{campaign.insights ? (
																					<div className="grid grid-cols-2 gap-2">
																						{/* Reach */}
																						<div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
																							<div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium mb-0.5">Reach</div>
																							<div className="text-xs font-semibold text-blue-900 dark:text-blue-100">
																								{formatNumber(campaign.insights.reach || 0)}
																							</div>
																						</div>

																						{/* Impressions */}
																						<div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
																							<div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium mb-0.5">Impressions</div>
																							<div className="text-xs font-semibold text-purple-900 dark:text-purple-100">
																								{formatNumber(campaign.insights.impressions || 0)}
																							</div>
																						</div>

																						{/* Link Clicks */}
																						<div className="p-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
																							<div className="text-[10px] text-green-700 dark:text-green-300 font-medium mb-0.5">Link Clicks</div>
																							<div className="text-xs font-semibold text-green-900 dark:text-green-100">
																								{formatNumber(campaign.insights.link_clicks || campaign.insights.clicks || 0)}
																							</div>
																						</div>

																						{/* Cost Per Click */}
																						<div className="p-2 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
																							<div className="text-[10px] text-orange-700 dark:text-orange-300 font-medium mb-0.5">CPC</div>
																							<div className="text-xs font-semibold text-orange-900 dark:text-orange-100">
																								{formatCurrency(campaign.insights.cpc || 0)}
																							</div>
																						</div>

																						{/* CTR */}
																						<div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
																							<div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium mb-0.5">CTR</div>
																							<div className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
																								{(() => {
																									const ctr = campaign.insights.ctr;
																									if (!ctr || ctr === '0') return '0%';
																									// CTR might already be a percentage string or a decimal
																									const ctrNum = typeof ctr === 'string' ? parseFloat(ctr) : ctr;
																									// If it's less than 1, it's likely a decimal (e.g., 0.0123 = 1.23%)
																									// If it's >= 1, it might already be a percentage
																									return ctrNum < 1 ? `${(ctrNum * 100).toFixed(2)}%` : `${ctrNum.toFixed(2)}%`;
																								})()}
																							</div>
																						</div>

																						{/* Amount Spent */}
																						<div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
																							<div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mb-0.5">Amount Spent</div>
																							<div className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
																								{formatCurrency(campaign.insights.spend || 0)}
																							</div>
																						</div>
																					</div>
																				) : (
																					<div className="flex flex-col items-center justify-center py-6 text-center">
																						<BarChart3 className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
																						<p className="text-xs text-muted-foreground">
																							No performance data available
																						</p>
																						<p className="text-[10px] text-muted-foreground mt-1">
																							Insights may not be available for this campaign or date range
																						</p>
																					</div>
																				)}
																			</div>
																		</div>
																	</CardContent>
																</Card>
															))}
														</div>
													)}
												</CardContent>
											</Card>
										</div>

										{/* Campaign Details Dialog - Commented out, now using dedicated page */}
										{/* {selectedCampaign && (
											<CampaignDetailsDialog
												campaign={selectedCampaign}
												open={!!selectedCampaign}
												onOpenChange={(open) => {
													if (!open) {
														setSelectedCampaign(null);
													}
												}}
												timeRange={timeRange}
												currency={currency}
											/>
										)} */}
									</>
								) : accountError ? (
									<div className="mt-6">
										<Card>
											<CardHeader>
												<CardTitle>Account Not Found</CardTitle>
												<CardDescription>The selected ad account could not be found.</CardDescription>
											</CardHeader>
											<CardContent>
												<Button onClick={handleRefetchAccounts} variant="outline">
													<RefreshCw className="mr-2 h-4 w-4" />
													Refresh Accounts
												</Button>
											</CardContent>
										</Card>
									</div>
								) : null}
							</>
						)}
					</>
				)}
			</div>
		</div>
	);
}
