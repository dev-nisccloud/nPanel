"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
	ArrowLeft,
	Target,
	BarChart3,
	RefreshCw,
	TrendingUp,
	Calendar as CalendarIcon
} from "lucide-react";

export default function MetaAdsAccountDetailPage() {
	const params = useParams();
	const router = useRouter();
	const accountId = params?.accountId as string;

	// Date range state
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
		from: new Date(new Date().setDate(new Date().getDate() - 30)), // Default to last 30 days
		to: new Date(),
	});
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

	// Campaign dialog state
	const [selectedCampaign, setSelectedCampaign] = React.useState<any | null>(null);

	const {
		data: accountData,
		isLoading: isLoadingAccount,
		error: accountError,
		refetch: refetchAccount,
	} = trpc.metaAds.accounts.getAccountDetails.useQuery(
		{ accountId },
		{
			enabled: !!accountId,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	// Prepare date range for API
	const timeRange = dateRange?.from && dateRange?.to ? {
		since: format(dateRange.from, "yyyy-MM-dd"),
		until: format(dateRange.to, "yyyy-MM-dd"),
	} : undefined;

	const {
		data: campaignsData,
		isLoading: isLoadingCampaigns,
		error: campaignsError,
		refetch: refetchCampaigns,
	} = trpc.metaAds.campaigns.listCampaigns.useQuery(
		{
			accountId,
			timeRange,
		},
		{
			enabled: !!accountId,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	React.useEffect(() => {
		if (accountError) {
			toast.error(accountError.message || "Failed to load account details");
		}
		if (campaignsError) {
			toast.error(campaignsError.message || "Failed to load campaigns");
		}
	}, [accountError, campaignsError]);

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

	if (isLoadingAccount) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6">
				<div className="flex items-center justify-center py-12">
					<Spinner size={32} />
				</div>
			</div>
		);
	}

	if (!account) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Account Not Found</CardTitle>
						<CardDescription>The requested ad account could not be found.</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={() => router.push("/agency/ad-campaigns/meta-ads")} variant="outline">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Accounts
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.push("/agency/ad-campaigns/meta-ads")}
						title="Back to accounts"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-semibold tracking-tight">
							{account.name || account.account_id || `Account ${accountId}`}
						</h1>
						<p className="text-muted-foreground">
							Manage campaigns, ad sets, and ads for this ad account
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					size="icon"
					onClick={() => {
						refetchAccount();
					}}
					title="Refresh account"
				>
					<RefreshCw className="h-4 w-4" />
				</Button>
			</div>

			{/* Performance Metrics Overview */}
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

			{/* Campaigns Section */}
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
										router.push(`/agency/ad-campaigns/meta-ads/${accountId}/campaigns/${campaign.id}`);
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

											{/* ID */}
											<div className="text-xs text-muted-foreground">
												ID: {campaign.id}
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
	);
}
