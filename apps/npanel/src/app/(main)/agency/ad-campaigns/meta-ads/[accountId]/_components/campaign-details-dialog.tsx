"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { Target, Layers, FileText, CalendarIcon, TrendingUp, MapPin, Users, Heart, Crosshair, ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

	const getStatusVariant = (status: string) => {
		const statusUpper = status.toUpperCase();
		if (statusUpper === "ACTIVE") return "default";
		if (statusUpper === "PAUSED") return "secondary";
		if (statusUpper === "ARCHIVED") return "outline";
		return "outline";
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
			<DialogContent className="max-w-7xl w-[95vw] max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Target className="h-5 w-5" />
						{campaign?.name || `Campaign ${campaign?.id}`}
					</DialogTitle>
					<DialogDescription>
						Campaign ID: {campaign?.id}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Campaign Information Section */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Campaign Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Status</p>
									<Badge variant={getStatusVariant(campaign?.status || '')}>
										{campaign?.status || '-'}
									</Badge>
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
						) : adSetsError ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<p className="text-sm text-destructive mb-2">
									{adSetsError.message || "Failed to load ad sets"}
								</p>
								{adSetsError.message?.includes('rate limit') && (
									<p className="text-xs text-muted-foreground">
										Please wait a moment and try again.
									</p>
								)}
							</div>
						) : adSets.length === 0 ? (
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
										getStatusVariant={getStatusVariant}
										timeRange={timeRange}
										currency={currency}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface AdSetItemProps {
	adSet: any;
	getStatusVariant: (status: string) => "default" | "secondary" | "outline" | "destructive";
	timeRange?: {
		since: string;
		until: string;
	};
	currency?: string;
}

function AdSetItem({ adSet, getStatusVariant, timeRange, currency = 'USD' }: AdSetItemProps) {
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
								<Badge variant={getStatusVariant(adSet.status)}>
									{adSet.status}
								</Badge>
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
														<Badge variant={getStatusVariant(ad.status)} className="text-xs">
															{ad.status}
														</Badge>
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
