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
import { toast } from "sonner";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
	Target,
	BarChart3,
	RefreshCw,
	TrendingUp,
	Calendar as CalendarIcon,
	Building2,
} from "lucide-react";
import { ConnectGoogleAds } from "./_components/connect-google-ads";
import { CampaignDetailsDialog } from "./[customerId]/_components/campaign-details-dialog";
import type { StoredCredentials } from "./_components/schemas";
import type { GoogleAdsAccount } from "./_components/schemas";

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

	// Date range state
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
		from: new Date(new Date().setDate(new Date().getDate() - 30)),
		to: new Date(),
	});
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

	// Campaign dialog state
	const [selectedCampaign, setSelectedCampaign] = React.useState<any | null>(null);

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
	} = trpc.googleAds.accounts.listAccessibleAccounts.useQuery(undefined, {
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

	const getStatusVariant = (
		status?: string
	): "default" | "secondary" | "destructive" => {
		if (!status) return "secondary";
		const upper = status.toUpperCase();
		if (upper === "ACTIVE" || upper === "ENABLED") return "default";
		if (upper === "PAUSED" || upper === "REMOVED") return "destructive";
		return "secondary";
	};

	const getCampaignStatusVariant = (
		status?: string | number
	): "default" | "secondary" | "destructive" => {
		if (status === undefined || status === null) return "secondary";
		const upper = String(status).toUpperCase();
		if (upper === "ENABLED" || upper === "ACTIVE") return "default";
		if (upper === "REMOVED" || upper === "DELETED") return "destructive";
		return "secondary";
	};

	const formatGoogleDate = (yyyyMMdd: string | undefined): string => {
		if (!yyyyMMdd) return "-";
		const normalized = yyyyMMdd.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
		return format(new Date(normalized), "MMM dd, yyyy");
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
					<h1 className="text-2xl font-semibold tracking-tight">Google Ads</h1>
					<p className="text-muted-foreground">
						Manage your Google Ads campaigns, keywords, and performance from one place.
					</p>
				</div>

				{!isConnected ? (
					<div className="mt-6 flex flex-col items-center justify-center py-12">
						<ConnectGoogleAds onConnected={handleRefetchAccounts} />
						{credentialsError && (
							<div className="mt-4 text-sm text-muted-foreground">
								{credentialsError.message}
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
										<CardTitle>Google Ads Accounts</CardTitle>
										<CardDescription>Loading your accessible Google Ads accounts...</CardDescription>
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
										<CardTitle>Google Ads Accounts</CardTitle>
										<CardDescription>No accessible Google Ads accounts found.</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex flex-col items-center justify-center py-8 text-center">
											<Building2 className="h-12 w-12 text-muted-foreground mb-4" />
											<p className="text-sm text-muted-foreground">
												No Google Ads accounts are accessible with your current integration.
											</p>
											<p className="text-xs text-muted-foreground mt-2">
												Make sure you have access to at least one Google Ads account.
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
										<Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
											<SelectTrigger className="w-full h-12 text-base">
												<SelectValue placeholder="Select an ad account">
													{selectedCustomerId &&
														accounts.find(
															(acc: GoogleAdsAccount) => acc.customerId === selectedCustomerId
														) && (
															<div className="flex items-center gap-2">
																<Building2 className="h-5 w-5 text-muted-foreground" />
																<span className="font-medium">
																	{(accounts.find(
																		(acc: GoogleAdsAccount) => acc.customerId === selectedCustomerId
																	) as GoogleAdsAccount)?.accountName ??
																		`Account ${formatCustomerIdDisplay(selectedCustomerId)}`}
																</span>
																{(accounts.find(
																	(acc: GoogleAdsAccount) => acc.customerId === selectedCustomerId
																) as GoogleAdsAccount)?.status && (
																	<Badge
																		variant={getStatusVariant(
																			(accounts.find(
																				(acc: GoogleAdsAccount) => acc.customerId === selectedCustomerId
																			) as GoogleAdsAccount)?.status
																		)}
																	>
																		{(accounts.find(
																			(acc: GoogleAdsAccount) => acc.customerId === selectedCustomerId
																		) as GoogleAdsAccount)?.status}
																	</Badge>
																)}
															</div>
														)}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{accounts.map((accountItem: GoogleAdsAccount) => (
													<SelectItem key={accountItem.customerId} value={accountItem.customerId}>
														<div className="flex items-center justify-between w-full gap-4">
															<div className="flex items-center gap-2 flex-1 min-w-0">
																<Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
																<span className="font-medium truncate">
																	{accountItem.accountName ?? `Account ${accountItem.customerId}`}
																</span>
															</div>
															{accountItem.status && (
																<Badge
																	variant={getStatusVariant(accountItem.status)}
																	className="flex-shrink-0"
																>
																	{accountItem.status}
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

						{/* Account content when selected */}
						{selectedCustomerId && (
							<>
								{isLoadingAccount ? (
									<div className="mt-6 flex items-center justify-center py-12">
										<Spinner size={32} />
									</div>
								) : account ? (
									<>
										{/* Performance Overview */}
										<div className="mt-6">
											<Card>
												<CardHeader>
													<CardTitle>Performance Overview</CardTitle>
													<CardDescription>
														Aggregated metrics from {metrics.campaignsWithInsights} of{" "}
														{metrics.totalCampaigns} campaigns
														{dateRange?.from && dateRange?.to && (
															<span className="ml-2">
																({format(dateRange.from, "MMM dd")} -{" "}
																{format(dateRange.to, "MMM dd, yyyy")})
															</span>
														)}
													</CardDescription>
												</CardHeader>
												<CardContent>
													<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
														<div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
															<div className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">
																Total Impressions
															</div>
															<div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
																{formatNumber(metrics.totalImpressions)}
															</div>
														</div>
														<div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
															<div className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">
																Total Clicks
															</div>
															<div className="text-lg font-semibold text-green-900 dark:text-green-100">
																{formatNumber(metrics.totalClicks)}
															</div>
														</div>
														<div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
															<div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">
																Total Amount Spent
															</div>
															<div className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
																{formatCurrency(metrics.totalSpend)}
															</div>
														</div>
														<div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
															<div className="text-xs text-orange-700 dark:text-orange-300 font-medium mb-1">
																Avg CPC
															</div>
															<div className="text-lg font-semibold text-orange-900 dark:text-orange-100">
																{formatCurrency(metrics.avgCPC)}
															</div>
														</div>
														<div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
															<div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-1">
																Avg CTR
															</div>
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
																					{format(dateRange.from, "MMM dd")} -{" "}
																					{format(dateRange.to, "MMM dd, yyyy")}
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
																No campaigns found for this Google Ads account.
															</p>
														</div>
													) : (
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
															{campaigns.map((campaign: any) => (
																<Card
																	key={campaign.id}
																	className="hover:bg-accent/50 transition-colors cursor-pointer"
																	onClick={() => setSelectedCampaign(campaign)}
																>
																	<CardContent className="p-4">
																		<div className="flex flex-col gap-3">
																			{campaign.status && (
																				<div>
																					<Badge variant={getCampaignStatusVariant(campaign.status)}>
																						{campaign.status}
																					</Badge>
																				</div>
																			)}
																			<div className="font-medium line-clamp-2 min-h-[2.5rem]">
																				{campaign.name ?? `Campaign ${campaign.id}`}
																			</div>
																			<div className="text-xs text-muted-foreground">
																				ID: {campaign.id}
																			</div>
																			{campaign.advertising_channel_type && (
																				<div className="flex items-center gap-1.5 text-xs">
																					<TrendingUp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
																					<span className="text-muted-foreground">
																						{campaign.advertising_channel_type}
																					</span>
																				</div>
																			)}
																			<div className="flex items-center gap-1.5 text-xs">
																				<CalendarIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
																				<span className="text-muted-foreground">
																					Start: {formatGoogleDate(campaign.start_date)}
																				</span>
																			</div>
																			<div className="flex items-center gap-1.5 text-xs">
																				<CalendarIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
																				<span className="text-muted-foreground">
																					End: {formatGoogleDate(campaign.end_date)}
																				</span>
																			</div>
																			<div className="mt-4 pt-4 border-t">
																				{campaign.insights ? (
																					<div className="grid grid-cols-2 gap-2">
																						<div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
																							<div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium mb-0.5">
																								Impressions
																							</div>
																							<div className="text-xs font-semibold text-purple-900 dark:text-purple-100">
																								{formatNumber(campaign.insights.impressions ?? 0)}
																							</div>
																						</div>
																						<div className="p-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
																							<div className="text-[10px] text-green-700 dark:text-green-300 font-medium mb-0.5">
																								Clicks
																							</div>
																							<div className="text-xs font-semibold text-green-900 dark:text-green-100">
																								{formatNumber(campaign.insights.clicks ?? 0)}
																							</div>
																						</div>
																						<div className="p-2 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
																							<div className="text-[10px] text-orange-700 dark:text-orange-300 font-medium mb-0.5">
																								CPC
																							</div>
																							<div className="text-xs font-semibold text-orange-900 dark:text-orange-100">
																								{formatCurrency(campaign.insights.cpc ?? 0)}
																							</div>
																						</div>
																						<div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
																							<div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium mb-0.5">
																								CTR
																							</div>
																							<div className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
																								{(() => {
																									const ctr = campaign.insights.ctr;
																									if (!ctr || ctr === "0") return "0%";
																									const n = typeof ctr === "string" ? parseFloat(ctr) : ctr;
																									return `${Number(n).toFixed(2)}%`;
																								})()}
																							</div>
																						</div>
																						<div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
																							<div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mb-0.5">
																								Amount Spent
																							</div>
																							<div className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
																								{formatCurrency(campaign.insights.cost ?? 0)}
																							</div>
																						</div>
																						{campaign.insights.conversions != null && (
																							<div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
																								<div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium mb-0.5">
																									Conversions
																								</div>
																								<div className="text-xs font-semibold text-blue-900 dark:text-blue-100">
																									{formatNumber(campaign.insights.conversions)}
																								</div>
																							</div>
																						)}
																					</div>
																				) : (
																					<div className="flex flex-col items-center justify-center py-6 text-center">
																						<BarChart3 className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
																						<p className="text-xs text-muted-foreground">
																							No performance data available
																						</p>
																						<p className="text-[10px] text-muted-foreground mt-1">
																							Metrics may not be available for this campaign or date range
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

										{selectedCampaign && (
											<CampaignDetailsDialog
												campaign={selectedCampaign}
												open={!!selectedCampaign}
												onOpenChange={(open) => {
													if (!open) setSelectedCampaign(null);
												}}
												customerId={formattedCustomerId || formatCustomerIdForApi(selectedCustomerId)}
												timeRange={timeRange}
												currency={currency}
											/>
										)}
									</>
								) : accountError ? (
									<div className="mt-6">
										<Card>
											<CardHeader>
												<CardTitle>Account Not Found</CardTitle>
												<CardDescription>
													The selected Google Ads account could not be found.
												</CardDescription>
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
