"use client";

import * as React from "react";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import {
	AdminAccessGuideDialog,
	type AdPlatform,
} from "@/routes/$slug.ad-campaigns/_components/admin-access-guide-dialog";

const PLATFORM_TITLES: Record<AdPlatform, string> = {
	meta: "Meta Ads",
	google: "Google Ads",
	linkedin: "LinkedIn Ads",
};

const PLATFORM_DESCRIPTIONS: Record<AdPlatform, string> = {
	meta: "We manage your Meta campaigns - targeting, budgets, creative, and optimization. Pay a commission on ad spend and track results with AI insights in your dashboard.",
	google: "We manage your Google Ads campaigns - search, display, and performance max. Pay a commission on ad spend and track results with AI insights in your dashboard.",
	linkedin: "We manage your LinkedIn Ads campaigns - B2B targeting, lead gen, and brand awareness. Pay a commission on ad spend and track results with AI insights in your dashboard.",
};

type MediaBuyingPricingProps = {
	platform: AdPlatform;
	className?: string;
};

type SelectedPlan = {
	id: string;
	name: string;
	commissionRate: number | null;
};

/** Shared commission pricing table for Meta, Google, and LinkedIn empty states. */
export function MediaBuyingPricing({ platform, className }: MediaBuyingPricingProps) {
	const [guideOpen, setGuideOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<SelectedPlan | null>(null);

	const { data: pricingData, isLoading } =
		trpc.products.getMediaBuyingPlansForPricing.useQuery();

	const handleGetStarted = React.useCallback(
		(plan: {
			id: string;
			name: string;
			commissionRate?: number | null;
			selectedPrice?: number;
		}) => {
			setSelectedPlan({
				id: plan.id,
				name: plan.name,
				commissionRate: plan.commissionRate ?? plan.selectedPrice ?? null,
			});
			setGuideOpen(true);
		},
		[],
	);

	return (
		<>
			<div className="@container/main flex min-h-0 flex-1 flex-col">
				<div className="flex shrink-0 flex-col gap-2 mb-6">
					<h1 className="text-base font-semibold tracking-tight">
						{PLATFORM_TITLES[platform]}
					</h1>
					<p className="text-sm text-muted-foreground max-w-2xl">
						{PLATFORM_DESCRIPTIONS[platform]}
					</p>
				</div>
				<div className="min-h-0 flex-1">
					<ScrollArea
						className={cn(
							"h-[min(calc(100dvh-14rem),52rem)] w-full rounded-xl border bg-card/40",
							className,
						)}
					>
						<div className="min-w-0 p-1 pb-4">
							<PricingTableWrapper
								plans={(pricingData?.plans ?? []).map((plan) => ({
									...plan,
									billingCycle: plan.billingCycle || "MONTHLY",
								}))}
								productFeatures={pricingData?.productFeatures}
								isLoading={isLoading}
								pricingMode="commission"
								actionButtonLabel="Get Started"
								onBuyNow={handleGetStarted}
							/>
						</div>
						<ScrollBar orientation="vertical" />
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
			</div>

			<AdminAccessGuideDialog
				open={guideOpen}
				onOpenChange={setGuideOpen}
				platform={platform}
				selectedPlanName={selectedPlan?.name}
				selectedCommissionRate={selectedPlan?.commissionRate}
			/>
		</>
	);
}
