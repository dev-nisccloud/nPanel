"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@nPanel/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { Target, Layers, FileText, CalendarIcon, TrendingUp, MapPin, Users, Heart, Crosshair, ChevronDown, ChevronUp, X, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";
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
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	AreaChart,
	Area,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	Label,
} from "recharts";

// ---------------------------------------------------------------------------
// Targeting helpers (Meta Ad Set targeting: audience, location, age, interest)
// ---------------------------------------------------------------------------

function parseTargeting(targeting: any): {
	location: string[];
	age: { min: number | null; max: number | null };
	interests: string[];
	audience: string[];
	hasAny: boolean;
} {
	const location: string[] = [];
	const interests: string[] = [];
	const audience: string[] = [];

	if (!targeting || typeof targeting !== "object") {
		return { location: [], age: { min: null, max: null }, interests: [], audience: [], hasAny: false };
	}

	// Location: geo_locations (countries, regions, cities)
	const geo = targeting.geo_locations;
	if (geo && typeof geo === "object") {
		if (Array.isArray(geo.countries)) {
			location.push(...geo.countries);
		}
		if (Array.isArray(geo.regions)) {
			geo.regions.forEach((r: any) => {
				const name = r.name ?? r.key ?? String(r);
				if (name && !location.includes(name)) location.push(name);
			});
		}
		if (Array.isArray(geo.cities)) {
			geo.cities.forEach((c: any) => {
				const name = c.name ?? c.key ?? String(c);
				if (name && !location.includes(name)) location.push(name);
			});
		}
	}

	// Age
	const ageMin = targeting.age_min != null ? Number(targeting.age_min) : null;
	const ageMax = targeting.age_max != null ? Number(targeting.age_max) : null;
	const age = {
		min: Number.isFinite(ageMin) ? ageMin : null,
		max: Number.isFinite(ageMax) ? ageMax : null,
	};

	// Interests: top-level + from flexible_spec
	if (Array.isArray(targeting.interests)) {
		targeting.interests.forEach((i: any) => {
			const name = i?.name ?? i?.id ?? String(i);
			if (name && !interests.includes(name)) interests.push(name);
		});
	}
	const flex = targeting.flexible_spec;
	if (Array.isArray(flex)) {
		flex.forEach((group: any) => {
			if (Array.isArray(group?.interests)) {
				group.interests.forEach((i: any) => {
					const name = i?.name ?? i?.id ?? String(i);
					if (name && !interests.includes(name)) interests.push(name);
				});
			}
		});
	}

	// Audience: custom_audiences + from flexible_spec
	if (Array.isArray(targeting.custom_audiences)) {
		targeting.custom_audiences.forEach((a: any) => {
			const name = a?.name ?? a?.id ?? String(a);
			if (name && !audience.includes(name)) audience.push(name);
		});
	}
	if (Array.isArray(flex)) {
		flex.forEach((group: any) => {
			if (Array.isArray(group?.custom_audiences)) {
				group.custom_audiences.forEach((a: any) => {
					const name = a?.name ?? a?.id ?? String(a);
					if (name && !audience.includes(name)) audience.push(name);
				});
			}
		});
	}

	const hasAny =
		location.length > 0 ||
		age.min != null ||
		age.max != null ||
		interests.length > 0 ||
		audience.length > 0;

	return { location, age, interests, audience, hasAny };
}

function formatAgeRange(age: { min: number | null; max: number | null }): string {
	if (age.min == null && age.max == null) return "";
	if (age.min != null && age.max != null) return `${age.min} – ${age.max}`;
	if (age.min != null) return `${age.min}+`;
	if (age.max != null) return `Up to ${age.max}`;
	return "";
}

/** Targeting field: bold primary label, content with word spacing, Show more/less after 3 lines */
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
		// Only detect overflow when collapsed (line-clamp applied); once we show "Show more", keep toggle visible
		if (!expanded && el.scrollHeight > el.clientHeight) {
			setShowToggle(true);
		}
	}, [content, expanded]);

	const hasContent = content.trim().length > 0;
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

interface CampaignDetailsDialogProps {
	campaign: any;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	timeRange?: {
		since: string;
		until: string;
	};
	currency?: string;
}

export function CampaignDetailsDialog({
	campaign,
	open,
	onOpenChange,
	timeRange,
	currency = 'USD',
}: CampaignDetailsDialogProps) {
	// Fetch ad sets for the campaign - loads immediately when dialog opens
	const {
		data: adSetsData,
		isLoading: isLoadingAdSets,
		error: adSetsError,
	} = trpc.metaAds.adSets.listAdSets.useQuery(
		{
			campaignId: campaign?.id,
			timeRange: timeRange ? {
				since: timeRange.since,
				until: timeRange.until,
			} : undefined,
		},
		{
			enabled: open && !!campaign?.id,
			refetchOnWindowFocus: false,
			retry: 1,
		}
	);

	const adSets = adSetsData?.data || [];

	// Default date range if none provided (last 30 days)
	const defaultSince = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
	const defaultUntil = format(new Date(), 'yyyy-MM-dd');
	const effectiveTimeRange = timeRange || { since: defaultSince, until: defaultUntil };

	// Insights Queries
	const { data: dailyPerformance, isLoading: isLoadingDaily } = trpc.metaAds.insights.getDailyPerformance.useQuery(
		{ entityId: campaign?.id, level: 'campaign', timeRange: effectiveTimeRange },
		{ enabled: open && !!campaign?.id, refetchOnWindowFocus: false }
	);

	const { data: genderBreakdown, isLoading: isLoadingGender } = trpc.metaAds.insights.getBreakdowns.useQuery(
		{ entityId: campaign?.id, level: 'campaign', timeRange: effectiveTimeRange, breakdown: 'gender' },
		{ enabled: open && !!campaign?.id, refetchOnWindowFocus: false }
	);

	const { data: platformBreakdown, isLoading: isLoadingPlatform } = trpc.metaAds.insights.getBreakdowns.useQuery(
		{ entityId: campaign?.id, level: 'campaign', timeRange: effectiveTimeRange, breakdown: 'publisher_platform' },
		{ enabled: open && !!campaign?.id, refetchOnWindowFocus: false }
	);

	const performanceChartConfig = {
		spend: { label: "Spend", color: "var(--chart-3)" },
		impressions: { label: "Impressions", color: "var(--chart-2)" },
		link_clicks: { label: "Link Clicks", color: "var(--chart-1)" },
	} satisfies ChartConfig;

	const breakdownChartConfig = {
		value: { label: "Impressions" },
		male: { label: "Male", color: "var(--chart-1)" },
		female: { label: "Female", color: "var(--chart-2)" },
		unknown: { label: "Unknown", color: "var(--chart-3)" },
		facebook: { label: "Facebook", color: "var(--chart-1)" },
		instagram: { label: "Instagram", color: "var(--chart-2)" },
		messenger: { label: "Messenger", color: "var(--chart-3)" },
		audience_network: { label: "Audience Network", color: "var(--chart-4)" },
	} satisfies ChartConfig;

	const getStatusStyles = (status: string) => {
		const statusUpper = status.toUpperCase();
		if (statusUpper === "ACTIVE") {
			return {
				variant: "outline" as const,
				className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full",
			};
		}
		if (statusUpper === "PAUSED") return { variant: "secondary" as const };
		if (statusUpper === "ARCHIVED") return { variant: "outline" as const };
		return { variant: "outline" as const };
	};

	const parseObjective = (objective: string) => {
		if (!objective) return objective;
		if (objective.startsWith('OUTCOME_')) {
			return objective.replace('OUTCOME_', '');
		}
		return objective;
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
									value="audience"
									className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-1.5"
								>
									Audience & Delivery
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
											{campaign?.objective && (
												<div className="space-y-1">
													<p className="text-xs text-muted-foreground">Objective</p>
													<p className="text-sm font-medium">{parseObjective(campaign.objective)}</p>
												</div>
											)}
											{campaign?.start_time && (
												<div className="space-y-1">
													<p className="text-xs text-muted-foreground">Start Date</p>
													<p className="text-sm font-medium">
														{new Date(campaign.start_time).toLocaleDateString()}
													</p>
												</div>
											)}
											{campaign?.stop_time && (
												<div className="space-y-1">
													<p className="text-xs text-muted-foreground">End Date</p>
													<p className="text-sm font-medium">
														{new Date(campaign.stop_time).toLocaleDateString()}
													</p>
												</div>
											)}
										</div>
										{(campaign?.daily_budget || campaign?.lifetime_budget) && (
											<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
												{campaign?.daily_budget && (
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">Daily Budget</p>
														<p className="text-sm font-medium">{campaign.daily_budget}</p>
													</div>
												)}
												{campaign?.lifetime_budget && (
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">Lifetime Budget</p>
														<p className="text-sm font-medium">{campaign.lifetime_budget}</p>
													</div>
												)}
												{campaign?.budget_remaining && (
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">Budget Remaining</p>
														<p className="text-sm font-medium">{campaign.budget_remaining}</p>
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
												budget={campaign.daily_budget || campaign.lifetime_budget || null}
											/>
										</CardContent>
									</Card>
								)}

								<Separator />

								{/* Ad Sets Section */}
								<div>
									<h3 className="text-lg font-semibold mb-4">Ad Sets</h3>
									{isLoadingAdSets ? (
										<div className="space-y-3">
											{[...Array(2)].map((_, i) => (
												<AdSetSkeleton key={i} />
											))}
										</div>
									) : (adSets.length === 0 && !isLoadingAdSets) ? (
										<div className="flex flex-col items-center justify-center py-12 text-center">
											<Layers className="h-12 w-12 text-muted-foreground mb-4" />
											<p className="text-sm text-muted-foreground">
												No ad sets found for this campaign.
											</p>
										</div>
									) : (
										<div className="space-y-4">
											{adSets.map((adSet: any) => (
												<AdSetItem
													key={adSet.id}
													adSet={adSet}
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
													data={dailyPerformance.data
														.sort((a: any, b: any) => (a.date_start || '').localeCompare(b.date_start || ''))
														.map((item: any) => {
															const linkClicks = parseInt(item.inline_link_clicks || '0') ||
																(item.actions?.find((a: any) => a.action_type === 'link_click')?.value || 0);
															return {
																date: item.date_start ? format(parseISO(item.date_start), 'MMM dd') : '—',
																spend: parseFloat(item.spend || '0'),
																impressions: parseInt(item.impressions || '0'),
																link_clicks: parseInt(linkClicks.toString()),
															};
														})}
													margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
												>
													<CartesianGrid strokeDasharray="3 3" vertical={false} />
													<XAxis
														dataKey="date"
														axisLine={false}
														tickLine={false}
														tick={{ fontSize: 10 }}
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
														dataKey="link_clicks"
														stroke="var(--color-link_clicks)"
														strokeWidth={2}
														dot={{ r: 3, fill: "var(--color-link_clicks)" }}
														activeDot={{ r: 5 }}
														name="Link Clicks"
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
													data={dailyPerformance.data
														.sort((a: any, b: any) => (a.date_start || '').localeCompare(b.date_start || ''))
														.map((item: any) => ({
															date: item.date_start ? format(parseISO(item.date_start), 'MMM dd') : '—',
															spend: parseFloat(item.spend || '0'),
														}))}
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
							</TabsContent>

							<TabsContent value="audience" className="m-0 p-4 md:p-6 pb-8 space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-base">Gender Distribution</CardTitle>
											<CardDescription className="text-xs">Impressions by gender</CardDescription>
										</CardHeader>
										<CardContent className="h-[300px]">
											{isLoadingGender ? (
												<div className="h-full flex items-center justify-center">
													<Skeleton className="h-40 w-40 rounded-full" />
												</div>
											) : genderBreakdown?.data && genderBreakdown.data.length > 0 ? (
												<ChartContainer config={breakdownChartConfig} className="h-[250px] w-full">
													<PieChart>
														<Pie
															data={genderBreakdown.data
																.filter((item: any) => item.gender?.toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
																.map((item: any, index: number) => ({
																	gender: item.gender,
																	value: parseInt(item.impressions || '0'),
																}))}
															dataKey="value"
															nameKey="gender"
															cx="50%"
															cy="50%"
															innerRadius={60}
															outerRadius={80}
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
																			.filter((item: any) => item.gender !== 'unknown' && parseInt(item.impressions || '0') > 0)
																			.reduce((acc: number, curr: any) => acc + parseInt(curr.impressions || '0'), 0);
																		return (
																			<text
																				x={viewBox.cx}
																				y={viewBox.cy}
																				textAnchor="middle"
																				dominantBaseline="middle"
																			>
																				<tspan
																					x={viewBox.cx}
																					y={viewBox.cy}
																					className="fill-foreground text-xl font-bold"
																				>
																					{total.toLocaleString()}
																				</tspan>
																				<tspan
																					x={viewBox.cx}
																					y={(viewBox.cy || 0) + 24}
																					className="fill-muted-foreground text-xs"
																				>
																					Impressions
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
												<div className="h-full flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
													<Users className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
													<p className="text-xs text-muted-foreground">No gender data</p>
												</div>
											)}
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-base">Platform Delivery</CardTitle>
											<CardDescription className="text-xs">Impressions by publisher platform</CardDescription>
										</CardHeader>
										<CardContent className="h-[300px]">
											{isLoadingPlatform ? (
												<div className="h-full flex flex-col gap-2 justify-center">
													{[...Array(4)].map((_, i) => (
														<Skeleton key={i} className="h-8 w-full" />
													))}
												</div>
											) : platformBreakdown?.data && platformBreakdown.data.filter((item: any) => (item.publisher_platform || '').toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0).length > 0 ? (
												<ChartContainer config={breakdownChartConfig} className="h-full w-full">
													<BarChart
														data={platformBreakdown.data
															.filter((item: any) => (item.publisher_platform || '').toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
															.map((item: any) => ({
																platform: item.publisher_platform,
																value: parseInt(item.impressions || '0'),
															}))}
														layout="vertical"
														margin={{ left: 0, right: 30, top: 10, bottom: 10 }}
													>
														<XAxis type="number" hide />
														<YAxis
															dataKey="platform"
															type="category"
															axisLine={false}
															tickLine={false}
															tickFormatter={(value) => breakdownChartConfig[value as keyof typeof breakdownChartConfig]?.label as string || value}
															width={100}
															tick={{ fontSize: 10 }}
														/>
														<ChartTooltip content={<ChartTooltipContent hideLabel />} />
														<Bar
															dataKey="value"
															radius={5}
															barSize={32}
														>
															{platformBreakdown.data
																.filter((item: any) => (item.publisher_platform || '').toLowerCase() !== 'unknown' && parseInt(item.impressions || '0') > 0)
																.map((entry: any, index: number) => (
																	<Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
																))}
														</Bar>
													</BarChart>
												</ChartContainer>
											) : (
												<div className="h-full flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/20">
													<PieChartIcon className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
													<p className="text-xs text-muted-foreground">No platform data</p>
												</div>
											)}
										</CardContent>
									</Card>
								</div>
							</TabsContent>
						</ScrollArea>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface AdSetItemProps {
	adSet: any;
	getStatusStyles: (status: string) => { variant: "default" | "secondary" | "outline" | "destructive"; className?: string };
	timeRange?: {
		since: string;
		until: string;
	};
	currency?: string;
}

function AdSetItem({ adSet, getStatusStyles, timeRange, currency = 'USD' }: AdSetItemProps) {
	// Load ads when ad set is rendered
	const {
		data: adsData,
		isLoading: isLoadingAds,
		error: adsError,
	} = trpc.metaAds.ads.listAds.useQuery(
		{
			adSetId: adSet.id,
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

	// Optional: human-readable targeting (fallback to parsed targeting on error/empty)
	const { data: sentenceLinesData } = trpc.metaAds.adSets.getTargetingSentenceLines.useQuery(
		{ adSetId: adSet.id },
		{ enabled: !!adSet.id, refetchOnWindowFocus: false, retry: 0 }
	);

	const ads = adsData?.data || [];
	const sentenceLines = sentenceLinesData?.data ?? [];
	const parsed = parseTargeting(adSet.targeting);
	const hasTargeting = parsed.hasAny || sentenceLines.length > 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Layers className="h-4 w-4 text-muted-foreground" />
						<div>
							<div className="flex items-center gap-2 mb-1">
								<CardTitle className="text-base">{adSet.name}</CardTitle>
								{adSet.status && (
									<Badge
										variant={getStatusStyles(adSet.status).variant}
										className={getStatusStyles(adSet.status).className}
									>
										{adSet.status}
									</Badge>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								ID: {adSet.id}
							</p>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Ad Set Info */}
				{(adSet.daily_budget || adSet.lifetime_budget || adSet.bid_amount || adSet.start_time) && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
						{adSet.daily_budget && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">Daily Budget</p>
								<p className="text-sm font-medium">{adSet.daily_budget}</p>
							</div>
						)}
						{adSet.lifetime_budget && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">Lifetime Budget</p>
								<p className="text-sm font-medium">{adSet.lifetime_budget}</p>
							</div>
						)}
						{adSet.bid_amount && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">Bid Amount</p>
								<p className="text-sm font-medium">{adSet.bid_amount}</p>
							</div>
						)}
						{adSet.start_time && (
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">Start Date</p>
								<p className="text-sm font-medium">
									{new Date(adSet.start_time).toLocaleDateString()}
								</p>
							</div>
						)}
					</div>
				)}

				{/* Targeting: Audience, Location, Age, Interest */}
				<div className="space-y-4 pb-4 border-b">
					<p className="text-[13px] font-semibold text-primary flex items-center gap-2">
						<Crosshair className="h-4 w-4" />
						Targeting
					</p>
					{!adSet.targeting && sentenceLines.length === 0 ? (
						<div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center">
							<p className="text-xs text-muted-foreground tracking-wide">
								Targeting data unavailable for this ad set.
							</p>
						</div>
					) : sentenceLines.length > 0 ? (
						<div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-4">
							{sentenceLines.map((line: { content?: string; children?: string[] }, idx: number) => (
								<TargetingField
									key={idx}
									label={line.content ?? ""}
									content={Array.isArray(line.children) ? line.children.join(", ") : ""}
									emptyMessage="—"
								/>
							))}
						</div>
					) : hasTargeting ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<TargetingField
								label="Location"
								content={parsed.location.join(", ")}
								icon={MapPin}
								emptyMessage="No location set"
							/>
							<TargetingField
								label="Age range"
								content={formatAgeRange(parsed.age)}
								icon={Users}
								emptyMessage="No age restriction"
							/>
							<div className="sm:col-span-2">
								<TargetingField
									label="Interests"
									content={parsed.interests.join(", ")}
									icon={Heart}
									emptyMessage="No interests specified"
								/>
							</div>
							<div className="sm:col-span-2">
								<TargetingField
									label="Audience (custom / lookalike)"
									content={parsed.audience.join(", ")}
									icon={Target}
									emptyMessage="No custom audience"
								/>
							</div>
						</div>
					) : (
						<div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center">
							<p className="text-xs text-muted-foreground tracking-wide">
								No targeting criteria for this ad set.
							</p>
						</div>
					)}
				</div>

				{/* Ad Set Metrics */}
				<div>
					<p className="text-sm font-medium text-muted-foreground mb-3">Ad Set Performance Metrics</p>
					{adSet.insights ? (
						<MetricsDisplay
							insights={adSet.insights}
							currency={currency}
							budget={adSet.daily_budget || adSet.lifetime_budget || null}
						/>
					) : (
						<div className="flex flex-wrap gap-3">
							{[...Array(13)].map((_, i) => (
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
							{adsError.message?.includes('rate limit') && (
								<p className="text-[10px] text-muted-foreground">
									Please wait a moment and try again.
								</p>
							)}
						</div>
					) : ads.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-6 text-center">
							<FileText className="h-8 w-8 text-muted-foreground mb-2" />
							<p className="text-xs text-muted-foreground">
								No ads found for this ad set.
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{ads.map((ad: any) => (
								<Card key={ad.id} className="bg-muted/50">
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2 flex-1 min-w-0">
												<FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<p className="text-sm font-medium truncate">{ad.name}</p>
														{ad.status && (
															<Badge
																variant={getStatusStyles(ad.status).variant}
																className={cn("text-xs", getStatusStyles(ad.status).className)}
															>
																{ad.status}
															</Badge>
														)}
													</div>
													<p className="text-xs text-muted-foreground">
														ID: {ad.id}
													</p>
												</div>
											</div>
										</div>
										{/* Ad Metrics */}
										<div>
											<p className="text-xs font-medium text-muted-foreground mb-2">Ad Performance Metrics</p>
											{ad.insights ? (
												<MetricsDisplay insights={ad.insights} currency={currency} compact />
											) : (
												<div className="flex flex-wrap gap-2">
													{[...Array(13)].map((_, i) => (
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
	budget?: string | null;
}

function MetricsDisplay({ insights, currency = 'USD', compact = false, budget = null }: MetricsDisplayProps) {
	// Format number with commas
	const formatNumber = (value: number | string | null | undefined): string => {
		if (value === null || value === undefined || value === '') return '-';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(num)) return '-';
		if (num % 1 === 0) {
			return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
		}
		return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	};

	// Format currency
	const formatCurrency = (value: number | string | null | undefined): string => {
		if (value === null || value === undefined || value === '') return '-';
		const num = typeof value === 'string' ? parseFloat(value) : value;
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

	// Calculate derived metrics
	const impressionsNum = insights.impressions ? (typeof insights.impressions === 'string' ? parseFloat(insights.impressions) : insights.impressions) : 0;
	const clicksNum = insights.clicks ? (typeof insights.clicks === 'string' ? parseFloat(insights.clicks) : insights.clicks) : 0;
	const spendNum = insights.spend ? (typeof insights.spend === 'string' ? parseFloat(insights.spend) : insights.spend) : 0;

	// CTR (all) = (clicks / impressions) * 100
	const ctrAll = impressionsNum > 0 && clicksNum > 0 ? (clicksNum / impressionsNum) : null;

	// CPC (all) = spend / clicks
	const cpcAll = clicksNum > 0 && spendNum > 0 ? (spendNum / clicksNum) : null;

	// Format budget as currency if provided
	const formatBudgetDisplay = (budgetValue: string | null | undefined): string => {
		if (!budgetValue || budgetValue === '' || budgetValue === '-') return '-';
		const num = typeof budgetValue === 'string' ? parseFloat(budgetValue) : budgetValue;
		if (isNaN(num)) return '-';
		return formatCurrency(num);
	};

	const metrics = [
		{ label: 'Reach', value: formatNumber(insights.reach), color: 'blue' },
		{ label: 'Cost per Result', value: formatCurrency(insights.cost_per_result), color: 'orange' },
		{ label: 'Budget', value: formatBudgetDisplay(budget), color: 'purple' },
		{ label: 'Amount Spent', value: formatCurrency(insights.spend), color: 'emerald' },
		{ label: 'Impressions', value: formatNumber(insights.impressions), color: 'purple' },
		{ label: 'CPM', value: formatCurrency(insights.cpm), color: 'indigo' },
		{ label: 'Link Clicks', value: formatNumber(insights.link_clicks), color: 'green' },
		{ label: 'CPC', value: formatCurrency(insights.cpc), color: 'orange' },
		{ label: 'CTR', value: formatPercentage(insights.ctr), color: 'indigo' },
		{ label: 'Clicks (all)', value: formatNumber(insights.clicks), color: 'green' },
		{ label: 'CTR (all)', value: formatPercentage(ctrAll), color: 'indigo' },
		{ label: 'CPC (all)', value: formatCurrency(cpcAll), color: 'orange' },
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
function AdSetSkeleton() {
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
						{[...Array(13)].map((_, i) => (
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
					{[...Array(13)].map((_, i) => (
						<Skeleton key={i} className="h-12 flex-1 min-w-[100px] rounded" />
					))}
				</div>
			</CardContent>
		</Card>
	);
}
