"use client";

import * as React from "react";
import { useParams } from "react-router";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";

type WordPressPricingProps = {
	className?: string;
};

/** Customer WordPress hosting pricing - scrollable layout matching other product pricing pages. */
export function WordPressPricing({ className }: WordPressPricingProps) {
	const params = useParams();
	const slug = typeof params?.slug === "string" ? params.slug : "";
	const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

	const { data: pricingData, isLoading } =
		trpc.products.getWordPressPlansForPricing.useQuery();

	const handleBuyNow = React.useCallback(
		(plan: {
			id: string;
			name: string;
			selectedBillingCycle?: "MONTHLY" | "YEARLY";
			selectedPrice?: number;
			niscPrice?: string;
			niscCurrency?: string;
			billingCycle?: string;
			productId?: string;
		}) => {
			const billingCycle = plan.selectedBillingCycle || plan.billingCycle;
			const price = plan.selectedPrice ?? parseFloat(plan.niscPrice || "0");

			const planDetails: ServicePlanDetails = {
				planId: plan.id,
				planName: plan.name,
				planType: "HOSTING",
				subType: "WORDPRESS_HOSTING",
				price,
				currency: plan.niscCurrency || "KES",
				billingCycle: (billingCycle ?? "MONTHLY") as "MONTHLY" | "YEARLY" | "BIENNIALLY",
				productId: plan.productId,
			};

			setSelectedPlan(planDetails);
			setBuyNowOpen(true);
		},
		[],
	);

	return (
		<>
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
						currency="KES"
						locale="en-KE"
						onBuyNow={handleBuyNow}
					/>
				</div>
				<ScrollBar orientation="vertical" />
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
			{selectedPlan && (
				<BuyNowDialog
					open={buyNowOpen}
					onOpenChange={setBuyNowOpen}
					plan={selectedPlan}
					requireDomainStep={true}
					teamId={teamData?.id}
					buyDomainHref={slug ? `/${slug}/domains` : undefined}
				/>
			)}
		</>
	);
}
