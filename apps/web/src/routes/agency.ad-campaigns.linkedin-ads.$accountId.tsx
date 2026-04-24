"use client";

import * as React from "react";
import { Outlet, useParams, useNavigate } from "react-router";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { 
	ArrowLeft,
	Target,
	BarChart3,
	RefreshCw,
	TrendingUp,
	Calendar as CalendarIcon,
	AlertTriangle
} from "lucide-react";
import { CreateMediaBuyingSubscriptionDialog } from "./agency.ad-campaigns/_components/create-media-buying-subscription-dialog";

export default function LinkedInAdsAccountDetailPage() {
	const params = useParams();
	const navigate = useNavigate();
	const accountId = params?.accountId as string;
	const campaignId = params?.campaignId as string | undefined;

	// Convert accountId to URN format if needed
	const accountUrn = React.useMemo(() => {
		if (!accountId) return '';
		if (accountId.startsWith('urn:li:sponsoredAccount:')) {
			return accountId;
		}
		// Extract numeric ID and create URN
		const numericId = accountId.replace(/[^0-9]/g, '');
		return numericId ? `urn:li:sponsoredAccount:${numericId}` : accountId;
	}, [accountId]);

	// Date range state
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
		from: new Date(new Date().setDate(new Date().getDate() - 30)), // Default to last 30 days
		to: new Date(),
	});
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

	const {
		data: accountData,
		isLoading: isLoadingAccount,
		error: accountError,
		refetch: refetchAccount,
	} = trpc.linkedInAds.accounts.getAccountDetails.useQuery(
		{ accountId: accountUrn },
		{
			enabled: !!accountUrn,
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
		data: campaignGroupsData,
		isLoading: isLoadingCampaignGroups,
		error: campaignGroupsError,
		refetch: refetchCampaignGroups,
	} = trpc.linkedInAds.campaignGroups.listCampaignGroups.useQuery(
		{ 
			accountId: accountUrn,
			timeRange,
		},
		{
			enabled: !!accountUrn,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	React.useEffect(() => {
		if (accountError) {
			toast.error(accountError.message || "Failed to load account details");
		}
		if (campaignGroupsError) {
			toast.error(campaignGroupsError.message || "Failed to load campaign groups");
		}
	}, [accountError, campaignGroupsError]);

	const account = accountData?.data;
	const campaignGroups = [...(campaignGroupsData?.data || [])].sort((a: any, b: any) => {
		const aTime = a.changeAuditStamps?.lastModified?.time ?? a.changeAuditStamps?.created?.time ?? 0;
		const bTime = b.changeAuditStamps?.lastModified?.time ?? b.changeAuditStamps?.created?.time ?? 0;
		return bTime - aTime;
	});
	const currency = account?.currency || 'USD'; // Default to USD if not available

	/**
	 * Calculate aggregated metrics from all campaign groups
	 */
	const calculateAggregatedMetrics = () => {
		let totalImpressions = 0;
		let totalClicks = 0;
		let totalSpend = 0;
		let totalConversions = 0;
		let campaignGroupsWithInsights = 0;

		campaignGroups.forEach((campaignGroup: any) => {
			if (campaignGroup.insights) {
				campaignGroupsWithInsights++;
				totalImpressions += campaignGroup.insights.impressions || 0;
				totalClicks += campaignGroup.insights.clicks || 0;
				totalSpend += parseFloat(campaignGroup.insights.spend || '0');
				totalConversions += campaignGroup.insights.externalWebsiteConversions || 0;
			}
		});

		// Calculate averages
		const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
		const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

		return {
			totalImpressions,
			totalClicks,
			totalSpend,
			totalConversions,
			avgCPC,
			avgCTR,
			campaignGroupsWithInsights,
			totalCampaignGroups: campaignGroups.length,
		};
	};

	const metrics = calculateAggregatedMetrics();

	/**
	 * Format number with commas
	 */
	const formatNumber = (value: number | string): string => {
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(num)) return '0';
		
		if (num % 1 === 0) {
			return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
		}
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
			return `${currency} ${formatNumber(num)}`;
		}
	};

	const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" => {
		if (!status) return "secondary";
		const upperStatus = status.toUpperCase();
		if (upperStatus === "ACTIVE") return "default";
		if (upperStatus === "DISABLED" || upperStatus === "CLOSED") return "destructive";
		return "secondary";
	};

	const getCampaignGroupStatusVariant = (status?: string): "default" | "secondary" | "destructive" => {
		if (!status) return "secondary";
		const upperStatus = status.toUpperCase();
		if (upperStatus === "ACTIVE") return "default";
		if (upperStatus === "DELETED" || upperStatus === "ARCHIVED") return "destructive";
		return "secondary";
	};

	// Flat-route parent behavior: when a campaign child route is matched,
	// render the child outlet instead of the account index view.
	if (campaignId) {
		return <Outlet />;
	}

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
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-5xl mx-auto">
					<Card className="border-dashed border-muted">
						<CardContent className="py-14">
							<div className="mx-auto max-w-lg text-center space-y-4">
								<div className="mx-auto h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
									<AlertTriangle className="h-7 w-7 text-amber-600" />
								</div>
								<div className="space-y-1">
									<h2 className="text-xl font-semibold tracking-tight">LinkedIn account unavailable</h2>
									<p className="text-sm text-muted-foreground">
										We could not load this account right now. It may have been removed, access may have changed,
										or LinkedIn may have returned a temporary error.
									</p>
								</div>
								<div className="flex items-center justify-center gap-2 pt-2">
									<Button onClick={() => navigate("/agency/ad-campaigns/linkedin-ads")} variant="outline">
										<ArrowLeft className="mr-2 h-4 w-4" />
										Back to Accounts
									</Button>
									<Button onClick={() => refetchAccount()} variant="default">
										<RefreshCw className="mr-2 h-4 w-4" />
										Try Again
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
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
						onClick={() => navigate("/agency/ad-campaigns/linkedin-ads")}
						title="Back to accounts"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-semibold tracking-tight">
							{account.name || account.id || `Account ${accountId}`}
						</h1>
						<p className="text-muted-foreground">
							Manage campaign groups, campaigns, and creatives for this ad account
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
						Aggregated metrics from {metrics.campaignGroupsWithInsights} of {metrics.totalCampaignGroups} campaign groups
						{dateRange?.from && dateRange?.to && (
							<span className="ml-2">
								({format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")})
							</span>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{/* Impressions */}
						<div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
							<div className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">Total Impressions</div>
							<div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
								{formatNumber(metrics.totalImpressions)}
							</div>
						</div>

						{/* Clicks */}
						<div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
							<div className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">Total Clicks</div>
							<div className="text-lg font-semibold text-green-900 dark:text-green-100">
								{formatNumber(metrics.totalClicks)}
							</div>
						</div>

						{/* Amount Spent */}
						<div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
							<div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">Total Amount Spent</div>
							<div className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
								{formatCurrency(metrics.totalSpend)}
							</div>
						</div>

						{/* Conversions */}
						<div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
							<div className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Total Conversions</div>
							<div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
								{formatNumber(metrics.totalConversions)}
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

			{/* Campaign Groups Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Campaign Groups</CardTitle>
							<CardDescription>
								{campaignGroups.length} {campaignGroups.length === 1 ? "campaign group" : "campaign groups"} found
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<CreateMediaBuyingSubscriptionDialog
								platform="LINKEDIN_ADS"
								accountId={accountUrn}
								accountName={account.name || null}
							/>
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
									refetchCampaignGroups();
								}}
								title="Refresh campaign groups"
							>
								<RefreshCw className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingCampaignGroups ? (
						<div className="flex items-center justify-center py-12">
							<Spinner size={32} />
						</div>
					) : campaignGroups.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<Target className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-sm text-muted-foreground">
								No campaign groups found for this ad account.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{campaignGroups.map((campaignGroup: any) => (
								<Card
									key={campaignGroup.id}
									className="hover:bg-accent/50 transition-colors cursor-pointer"
									onClick={() => {
										navigate(`/agency/ad-campaigns/linkedin-ads/${accountId}/campaigns/${campaignGroup.id}`);
									}}
								>
									<CardContent className="p-4">
										<div className="flex flex-col gap-3">
											{/* Status at the top on its own row */}
											{campaignGroup.status && (
												<div>
													<Badge variant={getCampaignGroupStatusVariant(campaignGroup.status)}>
														{campaignGroup.status}
													</Badge>
												</div>
											)}
											
											{/* Campaign group name - 2 rows max with ellipsis */}
											<div className="font-medium line-clamp-2 min-h-[2.5rem]">
												{campaignGroup.name || `Campaign Group ${campaignGroup.id}`}
											</div>
											
											{/* ID */}
											<div className="text-xs text-muted-foreground">
												ID: {campaignGroup.id}
											</div>
											
											{/* Created Date */}
											{campaignGroup.created && (
												<div className="flex items-center gap-1.5 text-xs">
													<CalendarIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
													<span className="text-muted-foreground">
														Created: {new Date(campaignGroup.created).toLocaleDateString()}
													</span>
												</div>
											)}
											
											{/* Metrics Section */}
											<div className="mt-4 pt-4 border-t">
												{campaignGroup.insights ? (
													<div className="grid grid-cols-2 gap-2">
														{/* Impressions */}
														<div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
															<div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium mb-0.5">Impressions</div>
															<div className="text-xs font-semibold text-purple-900 dark:text-purple-100">
																{formatNumber(campaignGroup.insights.impressions || 0)}
															</div>
														</div>
														
														{/* Clicks */}
														<div className="p-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
															<div className="text-[10px] text-green-700 dark:text-green-300 font-medium mb-0.5">Clicks</div>
															<div className="text-xs font-semibold text-green-900 dark:text-green-100">
																{formatNumber(campaignGroup.insights.clicks || 0)}
															</div>
														</div>
														
														{/* CPC */}
														<div className="p-2 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
															<div className="text-[10px] text-orange-700 dark:text-orange-300 font-medium mb-0.5">CPC</div>
															<div className="text-xs font-semibold text-orange-900 dark:text-orange-100">
																{formatCurrency(campaignGroup.insights.cpc || 0)}
															</div>
														</div>
														
														{/* CTR */}
														<div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
															<div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium mb-0.5">CTR</div>
															<div className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
																{(() => {
																	const ctr = campaignGroup.insights.ctr;
																	if (!ctr || ctr === '0') return '0%';
																	const ctrNum = typeof ctr === 'string' ? parseFloat(ctr) : ctr;
																	return `${ctrNum.toFixed(2)}%`;
																})()}
															</div>
														</div>
														
														{/* Amount Spent */}
														<div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
															<div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mb-0.5">Amount Spent</div>
															<div className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
																{formatCurrency(campaignGroup.insights.spend || 0)}
															</div>
														</div>
														
														{/* Conversions */}
														<div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
															<div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium mb-0.5">Conversions</div>
															<div className="text-xs font-semibold text-blue-900 dark:text-blue-100">
																{formatNumber(campaignGroup.insights.externalWebsiteConversions || 0)}
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
															Insights may not be available for this campaign group or date range
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

