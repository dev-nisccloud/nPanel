"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import {
	Building2,
	Calendar as CalendarIcon,
	ArrowLeft,
	Target,
	BarChart3,
	TrendingUp,
	Globe,
	Clock,
	MousePointer2,
	ChevronDown,
	Eye
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

/** Format customer ID with dashes for display (XXXXXXXXXX -> XXX-XXX-XXXX) */
function formatCustomerIdDisplay(customerId: string): string {
	const raw = customerId.replace(/-/g, "");
	return raw.length === 10
		? `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`
		: customerId;
}

export default function GoogleAdsAccountPage() {
	const params = useParams();
	const navigate = useNavigate();
	const customerId = params.customerId as string;

	const {
		data: accountData,
		isLoading: isLoadingAccount,
		error: accountError,
	} = trpc.googleAds.accounts.getAccountDetails.useQuery(
		{ customerId },
		{
			enabled: !!customerId,
			refetchOnWindowFocus: false,
		}
	);

	const {
		data: campaignsData,
		isLoading: isLoadingCampaigns,
		error: campaignsError,
	} = trpc.googleAds.campaigns.listCampaigns.useQuery(
		{ customerId },
		{
			enabled: !!customerId,
			refetchOnWindowFocus: false,
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
	const currency = account?.currencyCode || 'USD';

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
		if (!status) return { variant: "secondary" as const, className: "" };
		const upper = status.toUpperCase();
		if (upper === "ACTIVE" || upper === "ENABLED") {
			return {
				variant: "outline" as const,
				className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full",
			};
		}
		if (upper === "PAUSED" || upper === "REMOVED") return { variant: "destructive" as const, className: "" };
		return { variant: "secondary" as const, className: "" };
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

	const formatGoogleDate = (dateStr?: string) => {
		if (!dateStr || dateStr === "No date") return "No date";
		try {
			// Google Ads format is YYYYMMDD
			const year = dateStr.substring(0, 4);
			const month = dateStr.substring(4, 6);
			const day = dateStr.substring(6, 8);
			return format(new Date(`${year}-${month}-${day}`), "MMM dd, yyyy");
		} catch {
			return dateStr;
		}
	};

	if (isLoadingAccount || isLoadingCampaigns) {
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

	if (!account) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground">
				<div className="w-full max-w-7xl mx-auto">
					<Card className="border-muted/60 shadow-none">
						<CardHeader>
							<CardTitle>Account Not Found</CardTitle>
							<CardDescription>We couldn't find the Google Ads account you're looking for.</CardDescription>
						</CardHeader>
						<CardContent>
							<Button onClick={() => navigate("/agency/ad-campaigns/google-ads")} variant="outline" size="sm">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to Overview
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 text-foreground font-sans">
			<div className="w-full max-w-7xl mx-auto space-y-8">
				{/* Breadcrumbs & Header */}
				<div className="flex flex-col gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="-ml-2 h-8 w-fit text-muted-foreground hover:text-foreground group"
						onClick={() => navigate("/agency/ad-campaigns/google-ads")}
					>
						<ArrowLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
						Back to Overview
					</Button>

					<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
						<div className="space-y-1.5">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-primary/10 text-primary">
									<Building2 className="h-5 w-5" />
								</div>
								<h1 className="text-2xl font-bold tracking-tight">
									{account.accountName || `Account ${formatCustomerIdDisplay(customerId)}`}
								</h1>
								{account.status && (
									<Badge
										variant={getStatusVariant(account.status).variant}
										className={cn("text-[10px] px-2 py-0.5 font-bold uppercase", getStatusVariant(account.status).className)}
									>
										{account.status}
									</Badge>
								)}
							</div>
							<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
								<div className="flex items-center gap-1.5 font-medium">
									<Target className="h-4 w-4" />
									<span>ID: {formatCustomerIdDisplay(customerId)}</span>
								</div>
								<div className="flex items-center gap-1.5 font-medium">
									<Globe className="h-4 w-4" />
									<span>Currency: {account.currencyCode}</span>
								</div>
								<div className="flex items-center gap-1.5 font-medium">
									<Clock className="h-4 w-4" />
									<span>Timezone: {account.timeZone}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Account Stats Summary (Standardized) */}
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

				{/* Campaigns List */}
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

					{campaigns.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-32 text-center">
							<div className="p-5 rounded-full bg-muted/30 mb-5">
								<Target className="h-10 w-10 text-muted-foreground/40" />
							</div>
							<h3 className="text-lg font-bold tracking-tight">No campaign data available</h3>
							<p className="text-sm text-muted-foreground mt-2 max-w-sm">
								We couldn't find any campaigns for this account.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{campaigns.map((campaign: any) => (
								<Card
									key={campaign.id}
									className="group hover:border-primary/40 transition-all cursor-pointer shadow-none border-muted/60 overflow-hidden flex flex-col"
									onClick={() => {
										navigate(`/agency/ad-campaigns/google-ads/${customerId}/campaigns/${campaign.id}`);
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
														{" Ã¢â‚¬â€ "}
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
					)}
				</div>
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
