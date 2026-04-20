"use client";

import * as React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
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
	Building2,
	MousePointer2,
	ChevronDown,
	Eye
} from "lucide-react";

export default function MetaAdsAccountDetailPage() {
	const params = useParams();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const accountId = params?.accountId as string;
	const publisherPlatform = (searchParams.get("platform") || "facebook") as any;

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

	const utils = trpc.useUtils();
	const {
		data: campaignsData,
		isLoading: isLoadingCampaigns,
		isFetching: isFetchingCampaigns,
		error: campaignsError,
		refetch: refetchCampaigns,
	} = trpc.metaAds.campaigns.listCampaigns.useQuery(
		{
			accountId,
			timeRange,
			publisherPlatform,
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

	const account = accountData?.data as any;
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
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex items-center justify-center py-24">
						<Spinner size={32} />
					</div>
				</div>
			</div>
		);
	}

	if (!account) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<Card className="border-muted/60 shadow-none">
						<CardHeader>
							<CardTitle>Account Not Found</CardTitle>
							<CardDescription>The requested ad account could not be found.</CardDescription>
						</CardHeader>
						<CardContent>
							<Button onClick={() => navigate("/agency/ad-campaigns/meta-ads")} variant="outline" size="sm">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to Accounts
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 font-sans">
			<div className="w-full max-w-7xl mx-auto space-y-8">
				{/* Navigation & Header */}
				<div className="flex flex-col gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate("/agency/ad-campaigns/meta-ads")}
						className="-ml-2 h-8 w-fit text-muted-foreground hover:text-foreground group"
					>
						<ArrowLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
						Back to Overview
					</Button>

					{/* Platform Tabs */}
					<div className="flex items-center justify-between mt-2">
						<Tabs
							value={searchParams.get("platform") || "facebook"}
							onValueChange={(value) => {
								const newParams = new URLSearchParams(searchParams);
								if (value === "facebook") {
									newParams.delete("platform");
								} else {
									newParams.set("platform", value);
								}
								setSearchParams(newParams);
							}}
							className="w-full sm:w-auto"
						>
							<TabsList className="bg-muted/50 border border-muted/60 p-1 h-9">
								<TabsTrigger
									value="facebook"
									className="px-6 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
								>
									Facebook
								</TabsTrigger>
								<TabsTrigger
									value="instagram"
									className="px-6 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
								>
									Instagram
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
						<div className="space-y-1.5">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-primary/10 text-primary">
									<Building2 className="h-5 w-5" />
								</div>
								<h1 className="text-2xl font-bold tracking-tight">
									{account.name || account.account_id || `Account ${accountId}`}
								</h1>
								{account.status && (
									<Badge
										variant={getStatusStyles(account.status).variant}
										className={cn("text-[10px] px-2 py-0.5 font-bold uppercase", getStatusStyles(account.status).className)}
									>
										{account.status}
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<span className="flex items-center gap-1.5 font-medium">
									Account ID: {account.account_id}
								</span>
								<span className="flex items-center gap-1.5 font-medium">
									Currency: {account.currency}
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
								<PopoverTrigger asChild>
									<Button variant="outline" size="sm" className="h-9 shadow-sm border-muted/60 font-medium">
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
								className="h-9 w-9 shadow-sm border-muted/60"
								disabled={isLoadingAccount || isFetchingCampaigns}
								onClick={() => {
									utils.metaAds.accounts.getAccountDetails.invalidate({ accountId });
									utils.metaAds.campaigns.listCampaigns.invalidate({ accountId, timeRange });
									refetchAccount();
									refetchCampaigns();
								}}
								title="Refresh account"
							>
								<RefreshCw className={cn("h-4 w-4", (isLoadingAccount || isFetchingCampaigns) && "animate-spin")} />
							</Button>
						</div>
					</div>
				</div>

				{/* Metric Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
					<MetricCard
						title="Total Reach"
						value={formatNumber(metrics.totalReach)}
						icon={<Eye className="h-4 w-4" />}
						color="blue"
					/>
					<MetricCard
						title="Total Impressions"
						value={formatNumber(metrics.totalImpressions)}
						icon={<Target className="h-4 w-4" />}
						color="green"
					/>
					<MetricCard
						title="Link Clicks"
						value={formatNumber(metrics.totalLinkClicks)}
						icon={<MousePointer2 className="h-4 w-4" />}
						color="purple"
					/>
					<MetricCard
						title="Amount Spent"
						value={formatCurrency(metrics.totalSpend)}
						icon={<TrendingUp className="h-4 w-4" />}
						color="orange"
					/>
					<MetricCard
						title="Avg CPC"
						value={formatCurrency(metrics.avgCPC)}
						icon={<BarChart3 className="h-4 w-4" />}
						color="blue"
					/>
					<MetricCard
						title="Avg CTR"
						value={`${metrics.avgCTR.toFixed(2)}%`}
						icon={<TrendingUp className="h-4 w-4" />}
						color="green"
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
									navigate(`/agency/ad-campaigns/meta-ads/${accountId}/campaigns/${campaign.id}`);
								}}
							>
								<CardHeader className="py-4 px-6 border-b border-muted/60 bg-muted/5 group-hover:bg-primary/[0.02] transition-colors">
									<div className="flex items-start justify-between gap-3">
										<div className="flex flex-col gap-1 min-w-0">
											<div className="font-bold text-sm tracking-tight truncate group-hover:text-primary transition-colors">
												{campaign.name || `Campaign ${campaign.id}`}
											</div>
											<div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
												<span className="flex items-center gap-1">
													<TrendingUp className="h-3 w-3" />
													{parseObjective(campaign.objective)}
												</span>
											</div>
										</div>
										<Badge
											variant={getCampaignStatusStyles(campaign.status).variant}
											className={cn("text-[8px] px-1.5 py-0 font-bold uppercase", getCampaignStatusStyles(campaign.status).className)}
										>
											{campaign.status}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="p-6 flex-1 flex flex-col justify-between gap-6">
									{campaign.insights ? (
										<div className="grid grid-cols-2 gap-3">
											<div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 space-y-1">
												<p className="text-[9px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Reach</p>
												<p className="text-sm font-bold text-blue-900 dark:text-blue-100">{formatNumber(campaign.insights.reach || 0)}</p>
											</div>
											<div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 space-y-1">
												<p className="text-[9px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">Impressions</p>
												<p className="text-sm font-bold text-purple-900 dark:text-purple-100">{formatNumber(campaign.insights.impressions || 0)}</p>
											</div>
											<div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 space-y-1">
												<p className="text-[9px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">CTR</p>
												<p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
													{(() => {
														const ctr = campaign.insights.ctr;
														if (!ctr || ctr === '0') return '0%';
														const ctrNum = typeof ctr === 'string' ? parseFloat(ctr) : ctr;
														return ctrNum < 1 ? `${(ctrNum * 100).toFixed(2)}%` : `${ctrNum.toFixed(2)}%`;
													})()}
												</p>
											</div>
											<div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 space-y-1">
												<p className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Spent</p>
												<p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(campaign.insights.spend || 0)}</p>
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
													{campaign.start_time ? format(new Date(campaign.start_time), "MMM dd, yyyy") : "No start date"}
													{" — "}
													{campaign.stop_time ? format(new Date(campaign.stop_time), "MMM dd, yyyy") : "Ongoing"}
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
		</div>
	);
}

/**
 * Meta-style Metric Card (Replicated from SEO Reports)
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
	color: "blue" | "green" | "purple" | "orange";
}) {
	const colorClasses = {
		blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
		green: "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
		purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
		orange: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
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
