"use client";

import * as React from "react";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { useSeoReportsRoute } from "./seo-reports-route-context";

type SeoReportsPricingProps = {
	className?: string;
};

/** Customer pricing table — same scrollable layout as Nisc Email Marketing pricing. */
export function SeoReportsPricing({ className }: SeoReportsPricingProps) {
	const { teamId, teamSlug } = useSeoReportsRoute();

	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

	const { data: pricingData, isLoading } = trpc.products.getSeoPlansForPricing.useQuery();

	const seoReportsHref = teamSlug ? `/${teamSlug}/seo-reports` : undefined;

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
				subType: "SEO",
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
						plans={pricingData?.plans ?? []}
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
					requireDomainStep={false}
					teamId={teamId ?? undefined}
					seoReportsHref={seoReportsHref}
				/>
			)}
		</>
	);
}
