"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@npanel/ui/components/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import {
	Target,
	Layers,
	FileText,
	CalendarIcon,
	TrendingUp,
	MapPin,
	Users,
	X,
	BarChart3,
	Activity,
	ChevronDown,
	ChevronUp
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	type ChartConfig,
} from "@/components/ui/chart";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	AreaChart,
	Area,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	Label,
} from "recharts";

interface CampaignDetailsDialogProps {
	campaign: any;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	customerId: string;
	timeRange?: {
		since: string;
		until: string;
	};
	currency?: string;
}

function formatPlacementLabel(label: any): string {
	if (label === null || label === undefined) return 'Unknown';
	const stringLabel = String(label);
	if (!stringLabel || stringLabel.toLowerCase() === 'null' || stringLabel.toLowerCase() === 'undefined') {
		return 'Unknown';
	}
	// Google Ads device labels: DEVICE_MOBILE -> Mobile, etc.
	return stringLabel.replace('DEVICE_', '').toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

function formatRegionLabel(region: string | null | undefined): string {
	if (!region || region.toLowerCase().includes('unknown')) return 'Other / Uncategorized';
	if (region.includes('/')) return `Region ${region.split('/').pop()}`;
	return region
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/** Targeting field component for consistency with Meta Ads */
function TargetingField({
	label,
	content,
	icon: Icon,
	emptyMessage,
}: {
	label: string;
	content: string;
	icon?: React.ComponentType<{ className?: string }>;
	emptyMessage: string;
}) {
	const [expanded, setExpanded] = React.useState(false);
	const ref = React.useRef<HTMLParagraphElement>(null);
	const [showToggle, setShowToggle] = React.useState(false);

	React.useEffect(() => {
		const el = ref.current;
		if (!el || !content) return;
		if (!expanded && el.scrollHeight > el.clientHeight) {
			setShowToggle(true);
		}
	}, [content, expanded]);

	const hasContent = content && content.trim().length > 0;
	const displayContent = hasContent ? content : emptyMessage;
	const isPlaceholder = !hasContent;

	return (
		<div className="space-y-1.5">
			<div className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
				{Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
				{label}
			</div>
			<p
				ref={ref}
				className={`text-sm tracking-wide ${!expanded ? "line-clamp-3" : ""} ${isPlaceholder ? "text-muted-foreground italic" : ""}`}
			>
				{displayContent}
			</p>
			{showToggle && hasContent && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-auto p-0 text-primary hover:bg-primary/10 text-xs font-medium"
					onClick={() => setExpanded((e) => !e)}
				>
					{expanded ? (
						<>
							<ChevronUp className="h-3.5 w-3.5 mr-0.5" />
							Show less
						</>
					) : (
						<>
							<ChevronDown className="h-3.5 w-3.5 mr-0.5" />
							Show more
						</>
					)}
				</Button>
			)}
		</div>
	);
}

export function CampaignDetailsDialog({
	campaign,
	open,
	onOpenChange,
	customerId,
	timeRange,
	currency = 'USD',
}: CampaignDetailsDialogProps) {
	// Format customer ID with dashes for API call
	const formattedCustomerId = customerId && customerId.length === 10
		? `${customerId.slice(0, 3)}-${customerId.slice(3, 6)}-${customerId.slice(6)}`
		: customerId;

	// Fetch ad groups for the campaign
	const {
		data: adGroupsData,
		isLoading: isLoadingAdGroups,
		error: adGroupsError,
	} = trpc.googleAds.adGroups.listAdGroups.useQuery(
		{
			customerId: formattedCustomerId || customerId,
			campaignId: campaign?.id,
			timeRange: timeRange ? {
				since: timeRange.since,
				until: timeRange.until,
			} : undefined,
		},
		{
			enabled: open && !!campaign?.id && !!customerId,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	const adGroups = adGroupsData?.data || [];

	// Fetch daily performance trends
	const {
		data: dailyPerformance,
		isLoading: isLoadingDaily,
	} = trpc.googleAds.insights.getDailyPerformance.useQuery(
		{
			customerId: formattedCustomerId || customerId,
			campaignId: campaign?.id,
			timeRange: timeRange || { since: format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd'), until: format(new Date(), 'yyyy-MM-dd') },
		},
		{ enabled: open && !!campaign?.id, refetchOnWindowFocus: false }
	);

	// Fetch breakdowns
	const { data: genderBreakdown, isLoading: isLoadingGender } = trpc.googleAds.insights.getBreakdowns.useQuery(
		{ customerId: formattedCustomerId || customerId, campaignId: campaign?.id, timeRange: timeRange!, breakdown: 'gender' },
		{ enabled: open && !!campaign?.id && !!timeRange, refetchOnWindowFocus: false }
	);

	const { data: deviceBreakdown, isLoading: isLoadingDevice } = trpc.googleAds.insights.getBreakdowns.useQuery(
		{ customerId: formattedCustomerId || customerId, campaignId: campaign?.id, timeRange: timeRange!, breakdown: 'device' },
		{ enabled: open && !!campaign?.id && !!timeRange, refetchOnWindowFocus: false }
	);

	const { data: regionBreakdown, isLoading: isLoadingRegion } = trpc.googleAds.insights.getBreakdowns.useQuery(
		{ customerId: formattedCustomerId || customerId, campaignId: campaign?.id, timeRange: timeRange!, breakdown: 'region' },
		{ enabled: open && !!campaign?.id && !!timeRange, refetchOnWindowFocus: false }
	);

	const { data: ageRangeBreakdown, isLoading: isLoadingAgeRange } = trpc.googleAds.insights.getBreakdowns.useQuery(
		{ customerId: formattedCustomerId || customerId, campaignId: campaign?.id, timeRange: timeRange!, breakdown: 'age_range' },
		{ enabled: open && !!campaign?.id && !!timeRange, refetchOnWindowFocus: false }
	);

	const performanceChartConfig = {
		spend: { label: "Spend", color: "var(--chart-3)" },
		impressions: { label: "Impressions", color: "var(--chart-2)" },
		clicks: { label: "Clicks", color: "var(--chart-1)" },
	} satisfies ChartConfig;

	const breakdownChartConfig = {
		value: { label: "Impressions" },
	} satisfies ChartConfig;

	const getStatusStyles = (status: string) => {
		const statusUpper = status.toUpperCase();
		if (statusUpper === "ACTIVE" || statusUpper === "ENABLED") {
			return {
				variant: "outline" as const,
				className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full",
			};
		}
		if (statusUpper === "PAUSED") return { variant: "secondary" as const };
		if (statusUpper === "REMOVED" || statusUpper === "DELETED") return { variant: "destructive" as const };
		return { variant: "outline" as const };
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[65vw] w-[65vw] h-[80vh] p-0 gap-0 overflow-hidden flex flex-col"
				hideClose
			>
				<DialogTitle className="sr-only">Campaign Details</DialogTitle>
				<DialogDescription className="sr-only">
					View details and performance metrics for campaign {campaign?.name}
				</DialogDescription>

				<div className="flex flex-col h-full min-h-0">
					{/* Custom Header */}
					<div className="flex-shrink-0 px-4 py-3 border-b flex items-center justify-between bg-background">
						<div className="flex items-center gap-2 min-w-0">
							<Target className="h-5 w-5 shrink-0" />
							<h2 className="font-semibold truncate">
								{campaign?.name || `Campaign ${campaign?.id}`}
							</h2>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 shrink-0"
							onClick={() => onOpenChange(false)}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</Button>
					</div>

					<Tabs defaultValue="overview" className="flex-1 min-h-0 flex flex-col">
						<div className="flex-shrink-0 px-4 py-2 border-b bg-muted/30">
							<TabsList className="h-9 w-full justify-start space-x-2 bg-transparent p-0">
								<TabsTrigger
									value="overview"
									className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-1.5"
								>
									Overview
								</TabsTrigger>
								<TabsTrigger
									value="performance"
									className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-1.5"
								>
									Performance Trends
								</TabsTrigger>
								<TabsTrigger
									value="geography"
									className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-1.5"
								>
									Geography
								</TabsTrigger>
							</TabsList>
						</div>

						<ScrollArea className="flex-1 min-h-0">
							<TabsContent value="overview" className="m-0 p-4 md:p-6 pb-8 space-y-6">
								{/* Campaign Information Section */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Campaign Information</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
											<div className="space-y-1">
												<p className="text-xs text-muted-foreground">Status</p>
												{campaign?.status && (
													<Badge
														variant={getStatusStyles(campaign.status).variant}
														className={getStatusStyles(campaign.status).className}
													>
														{campaign.status}
													</Badge>
												)}
											</div>
											{campaign?.advertising_channel_type && (
												<div className="space-y-1">
													<p className="text-xs text-muted-foreground">Channel Type</p>
													<p className="text-sm font-medium">{campaign.advertising_channel_type}</p>
												</div>
											)}
											{campaign?.start_date && (
												<div className="space-y-1">
													<p className="text-xs text-muted-foreground">Start Date</p>
													<p className="text-sm font-medium">
														{new Date(campaign.start_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toLocaleDateString()}
													</p>
												</div>
											)}
											{campaign?.end_date && (
												<div className="space-y-1">
													<p className="text-xs text-muted-foreground">End Date</p>
													<p className="text-sm font-medium">
														{campaign.end_date ? new Date(campaign.end_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toLocaleDateString() : '-'}
													</p>
												</div>
											)}
										</div>
										{(campaign?.budget_amount || campaign?.bidding_strategy_type) && (
											<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
												{campaign?.budget_amount && (
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">Budget</p>
														<p className="text-sm font-medium">
															{new Intl.NumberFormat('en-US', {
																style: 'currency',
																currency: currency,
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															}).format(Number(campaign.budget_amount))}
														</p>
													</div>
												)}
												{campaign?.bidding_strategy_type && (
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">Bidding Strategy</p>
														<p className="text-sm font-medium">{campaign.bidding_strategy_type}</p>
													</div>
												)}
											</div>
										)}
									</CardContent>
								</Card>

								{/* Campaign Metrics Section */}
								{campaign?.insights && (
									<Card>
										<CardHeader>
											<CardTitle className="text-lg">Campaign Performance Metrics</CardTitle>
										</CardHeader>
										<CardContent>
											<MetricsDisplay
												insights={campaign.insights}
												currency={currency}
												budget={campaign.budget_amount || null}
											/>
										</CardContent>
									</Card>
								)}

								<Separator />

								{/* Ad Groups Section */}
								<div>
									<h3 className="text-lg font-semibold mb-4">Ad Groups</h3>
									{isLoadingAdGroups ? (
										<div className="space-y-3">
											{[...Array(2)].map((_, i) => (
												<AdGroupSkeleton key={i} />
											))}
										</div>
									) : adGroupsError ? (
										<div className="flex flex-col items-center justify-center py-12 text-center">
											<p className="text-sm text-destructive mb-2">
												{adGroupsError.message || "Failed to load ad groups"}
											</p>
										</div>
									) : adGroups.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-12 text-center">
											<Layers className="h-12 w-12 text-muted-foreground mb-4" />
											<p className="text-sm text-muted-foreground">
												No ad groups found for this campaign.
											</p>
										</div>
									) : (
										<div className="space-y-4">
											{adGroups.map((adGroup: any) => (
												<AdGroupItem
													key={adGroup.id}
													adGroup={adGroup}
													customerId={formattedCustomerId || customerId}
													getStatusStyles={getStatusStyles}
													timeRange={timeRange}
													currency={currency}
												/>
											))}
										</div>
									)}
								</div>
							</TabsContent>

							<TabsContent value="performance" className="m-0 p-4 md:p-6 pb-8 space-y-6">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between pb-2">
										<div className="space-y-1">
											<CardTitle className="text-lg">Performance Trends</CardTitle>
											<CardDescription className="text-xs">
												Daily performance for the selected period
											</CardDescription>
										</div>
										<Activity className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent className="pt-4">
										{isLoadingDaily ? (
											<div className="h-[350px] flex items-center justify-center">
												<Skeleton className="h-[300px] w-full" />
											</div>
										) : dailyPerformance?.data && dailyPerformance.data.length > 0 ? (
											<ChartContainer config={performanceChartConfig} className="h-[350px] w-full">
												<LineChart
													data={dailyPerformance.data}
													margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
												>
													<CartesianGrid strokeDasharray="3 3" vertical={false} />
													<XAxis
														dataKey="date"
														axisLine={false}
														tickLine={false}
														tick={{ fontSize: 10 }}
														tickFormatter={(val) => val ? format(parseISO(val.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')), 'MMM dd') : ''}
														dy={10}
													/>
													<YAxis
														axisLine={false}
														tickLine={false}
														tick={{ fontSize: 10 }}
														dx={-10}
													/>
													<ChartTooltip content={<ChartTooltipContent />} />
													<ChartLegend content={<ChartLegendContent />} />
													<Line
														type="monotone"
														dataKey="impressions"
														stroke="var(--color-impressions)"
														strokeWidth={2}
														dot={{ r: 3, fill: "var(--color-impressions)" }}
														activeDot={{ r: 5 }}
														name="Impressions"
													/>
													<Line
														type="monotone"
														dataKey="clicks"
														stroke="var(--color-clicks)"
														strokeWidth={2}
														dot={{ r: 3, fill: "var(--color-clicks)" }}
														activeDot={{ r: 5 }}
														name="Clicks"
													/>
												</LineChart>
											</ChartContainer>
										) : (
											<div className="h-[350px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
												<BarChart3 className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
												<p className="text-sm text-muted-foreground">No trend data available for this range</p>
											</div>
										)}
									</CardContent>
								</Card>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<Card>
										<CardHeader className="flex flex-row items-center justify-between pb-2">
											<div className="space-y-1">
												<CardTitle className="text-lg">Daily Spend</CardTitle>
												<CardDescription className="text-xs">
													Campaign spend over time
												</CardDescription>
											</div>
											<TrendingUp className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent className="pt-4">
											{isLoadingDaily ? (
												<div className="h-[250px] flex items-center justify-center">
													<Skeleton className="h-[200px] w-full" />
												</div>
											) : dailyPerformance?.data && dailyPerformance.data.length > 0 ? (
												<ChartContainer config={performanceChartConfig} className="h-[250px] w-full">
													<AreaChart
														data={dailyPerformance.data}
														margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
													>
														<defs>
															<linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
																<stop offset="5%" stopColor="var(--color-spend)" stopOpacity={0.1} />
																<stop offset="95%" stopColor="var(--color-spend)" stopOpacity={0} />
															</linearGradient>
														</defs>
														<CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
														<XAxis
															dataKey="date"
															axisLine={false}
															tickLine={false}
															tick={{ fontSize: 9 }}
															tickFormatter={(val) => val ? format(parseISO(val.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')), 'MMM dd') : ''}
														/>
														<YAxis hide />
														<ChartTooltip content={<ChartTooltipContent />} />
														<Area
															type="monotone"
															dataKey="spend"
															stroke="var(--color-spend)"
															fillOpacity={1}
															fill="url(#fillSpend)"
															strokeWidth={2}
															name="Spend"
														/>
													</AreaChart>
												</ChartContainer>
											) : (
												<div className="h-[250px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
													<p className="text-xs text-muted-foreground">No spend data available</p>
												</div>
											)}
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between pb-2">
											<div className="space-y-1">
												<CardTitle className="text-lg">Interactions</CardTitle>
												<CardDescription className="text-xs">Engagement rate</CardDescription>
											</div>
											<Activity className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent className="pt-4">
											{isLoadingDaily ? (
												<div className="h-[250px] flex items-center justify-center">
													<Skeleton className="h-[200px] w-full" />
												</div>
											) : dailyPerformance?.data && dailyPerformance.data.length > 0 ? (
												<ChartContainer config={performanceChartConfig} className="h-[250px] w-full">
													<BarChart data={dailyPerformance.data}>
														<CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
														<XAxis
															dataKey="date"
															axisLine={false}
															tickLine={false}
															tick={{ fontSize: 9 }}
															tickFormatter={(val) => val ? format(parseISO(val.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')), 'MMM dd') : ''}
														/>
														<YAxis hide />
														<ChartTooltip content={<ChartTooltipContent />} />
														<Bar dataKey="interaction_rate" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
													</BarChart>
												</ChartContainer>
											) : (
												<div className="h-[250px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
													<p className="text-xs text-muted-foreground">No interaction data</p>
												</div>
											)}
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between pb-2">
											<div className="space-y-1">
												<CardTitle className="text-lg">Age Distribution</CardTitle>
												<CardDescription className="text-xs">Impressions by age group</CardDescription>
											</div>
											<Users className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent className="pt-4">
											{isLoadingAgeRange ? (
												<div className="h-[250px] flex items-center justify-center">
													<Skeleton className="h-[200px] w-full" />
												</div>
											) : ageRangeBreakdown?.data && ageRangeBreakdown.data.length > 0 ? (
												<ChartContainer config={breakdownChartConfig} className="h-[250px] w-full">
													<BarChart
														data={ageRangeBreakdown.data
															.filter((item: any) => item.age_range?.toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
															.map((item: any) => ({
																name: item.age_range,
																value: parseInt(item.impressions || '0'),
															}))}
														margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
													>
														<CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
														<XAxis
															dataKey="name"
															axisLine={false}
															tickLine={false}
															tick={{ fontSize: 9 }}
														/>
														<YAxis hide />
														<ChartTooltip content={<ChartTooltipContent />} />
														<Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
													</BarChart>
												</ChartContainer>
											) : (
												<div className="h-[250px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
													<p className="text-xs text-muted-foreground">No age data</p>
												</div>
											)}
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between pb-2">
											<div className="space-y-1">
												<CardTitle className="text-lg">Gender Distribution</CardTitle>
												<CardDescription className="text-xs">Impressions by gender</CardDescription>
											</div>
											<Users className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent className="pt-4">
											{isLoadingGender ? (
												<div className="h-[250px] flex items-center justify-center">
													<Skeleton className="h-32 w-32 rounded-full" />
												</div>
											) : genderBreakdown?.data && genderBreakdown.data.length > 0 ? (
												<ChartContainer config={breakdownChartConfig} className="h-[250px] w-full">
													<PieChart>
														<Pie
															data={genderBreakdown.data
																.filter((item: any) => item.gender?.toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
																.map((item: any) => ({
																	name: item.gender,
																	value: parseInt(item.impressions || '0'),
																}))}
															dataKey="value"
															nameKey="name"
															cx="50%"
															cy="50%"
															innerRadius={45}
															outerRadius={65}
															paddingAngle={5}
														>
															{genderBreakdown.data
																.filter((item: any) => item.gender?.toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
																.map((entry: any, index: number) => (
																	<Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
																))}
															<Label
																content={({ viewBox }) => {
																	if (viewBox && "cx" in viewBox && "cy" in viewBox) {
																		const total = genderBreakdown.data
																			.filter((item: any) => item.gender?.toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
																			.reduce((acc: number, curr: any) => acc + parseInt(curr.impressions || '0'), 0);
																		return (
																			<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
																				<tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-sm font-bold">
																					{total > 1000 ? `${(total / 1000).toFixed(1)}k` : total}
																				</tspan>
																			</text>
																		);
																	}
																}}
															/>
														</Pie>
														<ChartTooltip content={<ChartTooltipContent />} />
													</PieChart>
												</ChartContainer>
											) : (
												<div className="h-[250px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
													<p className="text-xs text-muted-foreground">No gender data</p>
												</div>
											)}
										</CardContent>
									</Card>
								</div>

								{/* Device Delivery moved from Delivery tab */}
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-base">Device Delivery</CardTitle>
										<CardDescription className="text-xs">Impressions by device type</CardDescription>
									</CardHeader>
									<CardContent className="h-[350px]">
										{isLoadingDevice ? (
											<div className="h-full flex items-center justify-center">
												<Skeleton className="h-40 w-full" />
											</div>
										) : deviceBreakdown?.data && deviceBreakdown.data.length > 0 ? (
											<ChartContainer config={breakdownChartConfig} className="h-full w-full">
												<BarChart
													data={deviceBreakdown.data
														.sort((a: any, b: any) => parseInt(b.impressions || '0') - parseInt(a.impressions || '0'))
														.map((item: any) => ({
															name: item.device || 'Unknown',
															value: parseInt(item.impressions || '0'),
														}))}
													layout="vertical"
													margin={{ left: 0, right: 30, top: 10, bottom: 10 }}
												>
													<XAxis type="number" hide />
													<YAxis
														dataKey="name"
														type="category"
														axisLine={false}
														tickLine={false}
														width={120}
														tick={{ fontSize: 10 }}
													/>
													<ChartTooltip content={<ChartTooltipContent hideLabel />} />
													<Bar dataKey="value" fill="var(--chart-1)" radius={5} barSize={24} />
												</BarChart>
											</ChartContainer>
										) : (
											<div className="h-full flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
												<p className="text-xs text-muted-foreground">No device data</p>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="geography" className="m-0 p-4 md:p-6 pb-8 space-y-6">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-base">Top Regions</CardTitle>
										<CardDescription className="text-xs">Performance by geographic region</CardDescription>
									</CardHeader>
									<CardContent className="min-h-[400px]">
										{isLoadingRegion ? (
											<div className="space-y-4 pt-4">
												{[...Array(5)].map((_, i) => (
													<Skeleton key={i} className="h-10 w-full" />
												))}
											</div>
										) : regionBreakdown?.data && regionBreakdown.data.length > 0 ? (
											<ChartContainer config={breakdownChartConfig} className="min-h-[400px] w-full">
												<BarChart
													data={regionBreakdown.data
														.sort((a: any, b: any) => parseInt(b.impressions || '0') - parseInt(a.impressions || '0'))
														.slice(0, 15)
														.map((item: any) => ({
															name: item.region || 'Unknown',
															impressions: parseInt(item.impressions || '0'), // Keep for Bar dataKey
															value: parseInt(item.impressions || '0'), // For tooltip
														}))}
													layout="vertical"
													margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
												>
													<XAxis type="number" hide />
													<YAxis
														dataKey="name"
														type="category"
														axisLine={false}
														tickLine={false}
														width={130}
														tick={{ fontSize: 11, fontWeight: 500 }}
													/>
													<ChartTooltip content={<ChartTooltipContent />} />
													<Bar
														dataKey="value"
														fill="var(--chart-1)"
														radius={[0, 4, 4, 0]}
														barSize={20}
													/>
												</BarChart>
											</ChartContainer>
										) : (
											<div className="h-[300px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
												<MapPin className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
												<p className="text-sm text-muted-foreground">No geographic data available</p>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>
						</ScrollArea>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog >
	);
}

interface AdGroupItemProps {
	adGroup: any;
	customerId: string;
	getStatusStyles: (status: string) => { variant: "default" | "secondary" | "outline" | "destructive"; className?: string };
	timeRange?: {
		since: string;
		until: string;
	};
	currency?: string;
}

function AdGroupItem({ adGroup, customerId, getStatusStyles, timeRange, currency = 'USD' }: AdGroupItemProps) {
	// Load ads immediately when ad group is rendered
	const {
		data: adsData,
		isLoading: isLoadingAds,
		error: adsError,
	} = trpc.googleAds.ads.listAds.useQuery(
		{
			customerId,
			adGroupId: adGroup.id,
			timeRange: timeRange ? {
				since: timeRange.since,
				until: timeRange.until,
			} : undefined,
		},
		{
			enabled: true,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	const ads = adsData?.data || [];

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Layers className="h-4 w-4 text-muted-foreground" />
						<div>
							<div className="flex items-center gap-2 mb-1">
								<CardTitle className="text-base">{adGroup.name}</CardTitle>
								{adGroup.status && (
									<Badge
										variant={getStatusStyles(adGroup.status).variant}
										className={getStatusStyles(adGroup.status).className}
									>
										{String(adGroup.status)}
									</Badge>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								ID: {adGroup.id}
							</p>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Ad Group Info */}
				{(adGroup.cpc_bid || adGroup.cpm_bid || adGroup.target_cpa || adGroup.type) && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
						{adGroup.cpc_bid && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">CPC Bid</p>
								<p className="text-sm font-medium">
									{new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: currency,
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}).format(Number(adGroup.cpc_bid))}
								</p>
							</div>
						)}
						{adGroup.cpm_bid && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">CPM Bid</p>
								<p className="text-sm font-medium">
									{new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: currency,
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}).format(Number(adGroup.cpm_bid))}
								</p>
							</div>
						)}
						{adGroup.target_cpa && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">Target CPA</p>
								<p className="text-sm font-medium">
									{new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: currency,
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}).format(Number(adGroup.target_cpa))}
								</p>
							</div>
						)}
						{adGroup.type && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">Type</p>
								<p className="text-sm font-medium">{adGroup.type}</p>
							</div>
						)}
					</div>
				)}

				{/* Targeting Highlights (Placeholder for parity with Meta Ads) */}
				<div className="space-y-4 pb-4 border-b">
					<TargetingField
						label="Targeting Type"
						content={adGroup.type || "Standard Targeting"}
						icon={Target}
						emptyMessage="No targeting information available"
					/>
				</div>

				{/* Ad Group Metrics */}
				<div>
					<p className="text-sm font-medium text-muted-foreground mb-3">Ad Group Performance Metrics</p>
					{adGroup.insights ? (
						<MetricsDisplay
							insights={adGroup.insights}
							currency={currency}
							budget={adGroup.cpc_bid || adGroup.cpm_bid || null}
						/>
					) : (
						<div className="flex flex-wrap gap-3">
							{[...Array(9)].map((_, i) => (
								<Skeleton key={i} className="h-16 flex-1 min-w-[140px] max-w-[200px] rounded-md" />
							))}
						</div>
					)}
				</div>

				<Separator />

				{/* Ads List */}
				<div>
					<p className="text-sm font-medium text-muted-foreground mb-3">
						Ads {ads.length > 0 && `(${ads.length})`}
					</p>
					{isLoadingAds ? (
						<div className="space-y-2">
							{[...Array(2)].map((_, i) => (
								<AdSkeleton key={i} />
							))}
						</div>
					) : adsError ? (
						<div className="flex flex-col items-center justify-center py-6 text-center">
							<p className="text-xs text-destructive mb-1">
								{adsError.message || "Failed to load ads"}
							</p>
						</div>
					) : ads.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-6 text-center">
							<FileText className="h-8 w-8 text-muted-foreground mb-2" />
							<p className="text-xs text-muted-foreground">
								No ads found for this ad group.
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{ads.map((ad: any) => (
								<Card key={ad.id} className="bg-muted/50">
									<CardContent className="p-4">
										<div className="flex items-start gap-4 mb-4">
											<div className="h-12 w-12 rounded-lg border bg-muted flex items-center justify-center shrink-0 shadow-sm">
												<FileText className="h-6 w-6 text-muted-foreground/40" />
											</div>
											<div className="flex-1 min-w-0 pt-0.5">
												<div className="flex items-center gap-2 mb-2">
													<p className="text-base font-bold truncate leading-tight">{ad.name}</p>
													{ad.status && (
														<Badge
															variant={getStatusStyles(ad.status).variant}
															className={cn("text-[10px] uppercase font-bold tracking-wider py-0 px-2", getStatusStyles(ad.status).className)}
														>
															{String(ad.status)}
														</Badge>
													)}
												</div>
												<div className="mt-2 flex items-center gap-3">
													<p className="text-[10px] font-mono text-muted-foreground/60">ID: {ad.id} {ad.type && `Ã¢â‚¬Â¢ ${ad.type}`}</p>
												</div>
											</div>
										</div>
										{/* Ad Content Preview */}
										{(ad.headlines || ad.headline_part1) && (
											<div className="mb-4 p-3 bg-background rounded-lg border border-dashed">
												<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Ad Creative Highlights</p>
												{ad.headlines && ad.headlines.length > 0 ? (
													<div className="space-y-1">
														{ad.headlines.slice(0, 3).map((headline: string, idx: number) => (
															<p key={idx} className="text-xs font-medium">{headline}</p>
														))}
													</div>
												) : (
													<div className="space-y-1">
														{ad.headline_part1 && <p className="text-xs font-medium">{ad.headline_part1}</p>}
														{ad.headline_part2 && <p className="text-xs font-medium">{ad.headline_part2}</p>}
														{ad.headline_part3 && <p className="text-xs font-medium">{ad.headline_part3}</p>}
													</div>
												)}
											</div>
										)}
										{/* Ad Metrics */}
										<div>
											<p className="text-xs font-medium text-muted-foreground mb-2">Ad Performance Metrics</p>
											{ad.insights ? (
												<MetricsDisplay insights={ad.insights} currency={currency} compact />
											) : (
												<div className="flex flex-wrap gap-2">
													{[...Array(7)].map((_, i) => (
														<Skeleton key={i} className="h-12 flex-1 min-w-[100px] rounded" />
													))}
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

// Reusable metrics display component
interface MetricsDisplayProps {
	insights: any;
	currency?: string;
	compact?: boolean;
	budget?: string | number | null;
}

function MetricsDisplay({ insights, currency = 'USD', compact = false, budget = null }: MetricsDisplayProps) {
	// Format number with commas
	const formatNumber = (value: number | string | null | undefined): string => {
		if (value === null || value === undefined || value === '') return '-';

		let val = value;
		if (Array.isArray(value)) {
			val = value[0]?.value ?? '-';
		}

		const num = typeof val === 'string' ? parseFloat(val) : val;
		if (isNaN(num)) return '-';
		if (num % 1 === 0) {
			return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
		}
		return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	};

	// Format currency
	const formatCurrency = (value: number | string | null | undefined): string => {
		if (value === null || value === undefined || value === '') return '-';

		let val = value;
		if (Array.isArray(value)) {
			val = value[0]?.value ?? '-';
		}

		const num = typeof val === 'string' ? parseFloat(val) : val;
		if (isNaN(num)) return '-';
		try {
			const formatter = new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: currency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
			return formatter.format(num);
		} catch {
			return `${currency} ${num.toFixed(2)}`;
		}
	};

	// Format percentage
	const formatPercentage = (value: number | string | null | undefined): string => {
		if (value === null || value === undefined || value === '') return '-';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(num)) return '-';
		return num < 1 ? `${(num * 100).toFixed(2)}%` : `${num.toFixed(2)}%`;
	};

	const cardPadding = compact ? 'p-2' : 'p-3';
	const labelSize = compact ? 'text-[10px]' : 'text-[11px]';
	const valueSize = compact ? 'text-xs' : 'text-sm';

	// Format budget as currency if provided
	const formatBudgetDisplay = (budgetValue: string | number | null | undefined): string => {
		if (!budgetValue || budgetValue === '' || budgetValue === '-') return '-';
		const num = typeof budgetValue === 'string' ? parseFloat(budgetValue) : (budgetValue as number);
		if (isNaN(num)) return '-';
		return formatCurrency(num);
	};

	const cost = parseFloat(insights.cost || '0');
	const convValue = parseFloat(insights.conversions_value || '0');
	const roas = cost > 0 ? (convValue / cost).toFixed(2) : '0.00';

	const metrics = [
		{ label: 'Impressions', value: formatNumber(insights.impressions), color: 'purple' },
		{ label: 'Clicks', value: formatNumber(insights.clicks), color: 'green' },
		{ label: 'Budget', value: formatBudgetDisplay(budget), color: 'purple' },
		{ label: 'Amount Spent', value: formatCurrency(insights.cost), color: 'emerald' },
		{ label: 'CPC', value: formatCurrency(insights.cpc), color: 'orange' },
		{ label: 'CTR', value: formatPercentage(insights.ctr), color: 'indigo' },
		{ label: 'Conversions', value: formatNumber(insights.conversions), color: 'blue' },
		{ label: 'Conversion Value', value: formatCurrency(insights.conversions_value), color: 'blue' },
		{ label: 'ROAS', value: `${roas}x`, color: 'indigo' },
		{ label: 'Cost per Conversion', value: formatCurrency(insights.cost_per_conversion), color: 'orange' },
	];

	const colorClasses: Record<string, { bg: string; border: string; label: string; value: string }> = {
		blue: {
			bg: 'bg-blue-50 dark:bg-blue-950/30',
			border: 'border-blue-200 dark:border-blue-900',
			label: 'text-blue-700 dark:text-blue-300',
			value: 'text-blue-900 dark:text-blue-100',
		},
		orange: {
			bg: 'bg-orange-50 dark:bg-orange-950/30',
			border: 'border-orange-200 dark:border-orange-900',
			label: 'text-orange-700 dark:text-orange-300',
			value: 'text-orange-900 dark:text-orange-100',
		},
		purple: {
			bg: 'bg-purple-50 dark:bg-purple-950/30',
			border: 'border-purple-200 dark:border-purple-900',
			label: 'text-purple-700 dark:text-purple-300',
			value: 'text-purple-900 dark:text-purple-100',
		},
		emerald: {
			bg: 'bg-emerald-50 dark:bg-emerald-950/30',
			border: 'border-emerald-200 dark:border-emerald-900',
			label: 'text-emerald-700 dark:text-emerald-300',
			value: 'text-emerald-900 dark:text-emerald-100',
		},
		green: {
			bg: 'bg-green-50 dark:bg-green-950/30',
			border: 'border-green-200 dark:border-green-900',
			label: 'text-green-700 dark:text-green-300',
			value: 'text-green-900 dark:text-green-100',
		},
		indigo: {
			bg: 'bg-indigo-50 dark:bg-indigo-950/30',
			border: 'border-indigo-200 dark:border-indigo-900',
			label: 'text-indigo-700 dark:text-indigo-300',
			value: 'text-indigo-900 dark:text-indigo-100',
		},
	};

	return (
		<div className="flex flex-wrap gap-3">
			{metrics.map((metric, index) => {
				const colors = colorClasses[metric.color] || colorClasses.blue;
				return (
					<div
						key={index}
						className={`flex-1 min-w-[140px] max-w-[200px] ${cardPadding} rounded-md ${colors.bg} border ${colors.border}`}
					>
						<div className={`${labelSize} ${colors.label} font-medium mb-1`}>
							{metric.label}
						</div>
						<div className={`${valueSize} font-semibold ${colors.value} break-words`}>
							{metric.value}
						</div>
					</div>
				);
			})}
		</div>
	);
}

// Skeleton components
function AdGroupSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48 mb-2" />
				<Skeleton className="h-4 w-32" />
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="space-y-1">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-24" />
						</div>
					))}
				</div>
				<div>
					<Skeleton className="h-4 w-40 mb-3" />
					<div className="flex flex-wrap gap-3">
						{[...Array(9)].map((_, i) => (
							<Skeleton key={i} className="h-16 flex-1 min-w-[140px] max-w-[200px] rounded-md" />
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function AdSkeleton() {
	return (
		<Card className="bg-muted/50">
			<CardContent className="p-4">
				<Skeleton className="h-4 w-32 mb-3" />
				<div className="flex flex-wrap gap-2">
					{[...Array(7)].map((_, i) => (
						<Skeleton key={i} className="h-12 flex-1 min-w-[100px] rounded" />
					))}
				</div>
			</CardContent>
		</Card>
	);
}



