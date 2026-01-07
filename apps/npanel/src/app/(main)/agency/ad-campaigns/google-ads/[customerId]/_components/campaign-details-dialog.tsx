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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { Target, Layers, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

	// Fetch ad groups for the campaign - loads immediately when dialog opens
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

	const getStatusVariant = (status: string | number) => {
		const statusStr = String(status).toUpperCase();
		if (statusStr === "ENABLED" || statusStr === "ACTIVE") return "default";
		if (statusStr === "PAUSED") return "secondary";
		if (statusStr === "REMOVED" || statusStr === "DELETED") return "destructive";
		return "secondary";
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
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
										{String(campaign?.status || '-')}
									</Badge>
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

interface AdGroupItemProps {
	adGroup: any;
	customerId: string;
	getStatusVariant: (status: string | number) => "default" | "secondary" | "destructive";
	timeRange?: {
		since: string;
		until: string;
	};
	currency?: string;
}

function AdGroupItem({ adGroup, customerId, getStatusVariant, timeRange, currency = 'USD' }: AdGroupItemProps) {
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
								<Badge variant={getStatusVariant(adGroup.status)}>
									{String(adGroup.status)}
								</Badge>
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

				{/* Ad Group Metrics */}
				<div>
					<p className="text-sm font-medium text-muted-foreground mb-3">Ad Group Performance Metrics</p>
					{adGroup.insights ? (
						<MetricsDisplay 
							insights={adGroup.insights} 
							currency={currency}
							budget={adGroup.cpc_bid || null}
						/>
					) : (
						<div className="flex flex-wrap gap-3">
							{[...Array(7)].map((_, i) => (
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
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2 flex-1 min-w-0">
												<FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<p className="text-sm font-medium truncate">{ad.name}</p>
														<Badge variant={getStatusVariant(ad.status)} className="text-xs">
															{String(ad.status)}
														</Badge>
													</div>
													<p className="text-xs text-muted-foreground">
														ID: {ad.id} {ad.type && `• ${ad.type}`}
													</p>
												</div>
											</div>
										</div>
										{/* Ad Content Preview */}
										{(ad.headlines || ad.headline_part1) && (
											<div className="mb-3 p-2 bg-background rounded border">
												<p className="text-xs font-medium text-muted-foreground mb-1">Ad Content:</p>
												{ad.headlines && ad.headlines.length > 0 ? (
													<div className="space-y-1">
														{ad.headlines.slice(0, 3).map((headline: string, idx: number) => (
															<p key={idx} className="text-xs">{headline}</p>
														))}
													</div>
												) : (
													<div className="space-y-1">
														{ad.headline_part1 && <p className="text-xs">{ad.headline_part1}</p>}
														{ad.headline_part2 && <p className="text-xs">{ad.headline_part2}</p>}
														{ad.headline_part3 && <p className="text-xs">{ad.headline_part3}</p>}
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

	const metrics = [
		{ label: 'Impressions', value: formatNumber(insights.impressions), color: 'purple' },
		{ label: 'Clicks', value: formatNumber(insights.clicks), color: 'green' },
		{ label: 'Amount Spent', value: formatCurrency(insights.cost), color: 'emerald' },
		{ label: 'CPC', value: formatCurrency(insights.cpc), color: 'orange' },
		{ label: 'CTR', value: formatPercentage(insights.ctr), color: 'indigo' },
		{ label: 'Conversions', value: formatNumber(insights.conversions), color: 'blue' },
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
						{[...Array(7)].map((_, i) => (
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

