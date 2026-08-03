"use client";

import * as React from "react";
import { useParams } from "react-router";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { CustomerHostingPlansPricingSection } from "./customer-hosting-plans-pricing-section";
import type {
	CustomerHostingPlansPricingConfig,
	HostingPlan,
	ProductFeatureRow,
} from "./types";

type HostingSubType = "WEB_HOSTING" | "EMAIL_HOSTING" | "WORDPRESS_HOSTING";

export type CustomerHostingPricingProps = {
	className?: string;
	config: CustomerHostingPlansPricingConfig;
	subType: HostingSubType;
	plans: HostingPlan[];
	productFeatures: ProductFeatureRow[];
	isLoading?: boolean;
	error?: string | null;
	requireDomainStep?: boolean;
};

export function CustomerHostingPricing({
	className,
	config,
	subType,
	plans,
	productFeatures,
	isLoading = false,
	error = null,
	requireDomainStep = true,
}: CustomerHostingPricingProps) {
	const params = useParams();
	const slug = typeof params?.slug === "string" ? params.slug : "";
	const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

	const handleGetStarted = React.useCallback(
		(plan: HostingPlan, isYearly: boolean, displayPrice: number) => {
			const planDetails: ServicePlanDetails = {
				planId: plan.id,
				planName: plan.name,
				planType: "HOSTING",
				subType,
				price: displayPrice,
				currency: plan.niscCurrency || "KES",
				billingCycle: isYearly ? "YEARLY" : "MONTHLY",
				productId: plan.productId,
			};

			setSelectedPlan(planDetails);
			setBuyNowOpen(true);
		},
		[subType],
	);

	return (
		<>
			<ScrollArea
				className={cn(
					"h-[min(calc(100dvh-14rem),52rem)] w-full rounded-xl border bg-card/40",
					className,
				)}
				thumbClassName="bg-primary"
			>
				<div className="min-w-0 pb-4">
					<CustomerHostingPlansPricingSection
						config={config}
						plans={plans}
						productFeatures={productFeatures}
						isLoading={isLoading}
						error={error}
						onGetStarted={handleGetStarted}
					/>
				</div>
				<ScrollBar orientation="vertical" thumbClassName="bg-primary" />
				<ScrollBar orientation="horizontal" thumbClassName="bg-primary" />
			</ScrollArea>
			{selectedPlan && (
				<BuyNowDialog
					open={buyNowOpen}
					onOpenChange={setBuyNowOpen}
					plan={selectedPlan}
					requireDomainStep={requireDomainStep}
					teamSlug={slug || undefined}
					teamId={teamData?.id}
					buyDomainHref={slug ? `/${slug}/domains` : undefined}
				/>
			)}
		</>
	);
}
