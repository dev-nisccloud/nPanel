"use client";

import * as React from "react";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
	useZeepoPlanCheckout,
	useZeepoPurchasePlans,
	type ZeepoPlanFilter,
	type ZeepoPurchasePlan,
} from "@/hooks/use-zeepo-purchase-plans";
import { cn } from "@/lib/utils";

type ZeepoAgentPricingProps = {
	/** New customers: subscription only. Existing subscribers topping up: top_up only. */
	planFilter?: ZeepoPlanFilter;
	className?: string;
};

function formatTokenGrant(tokenGrant: number): string | null {
	if (tokenGrant <= 0) return null;
	return `${tokenGrant.toLocaleString()} tokens`;
}

function getZeepoProductFeatures(planFilter: ZeepoPlanFilter) {
	if (planFilter === "top_up") {
		return [
			{ key: "tokens", label: "Tokens included" },
			{ key: "top_up", label: "One-time top-up" },
			{ key: "web_search", label: "Web search included" },
			{ key: "domain_check", label: "Domain checks included" },
		];
	}

	return [
		{ key: "tokens", label: "Monthly tokens" },
		{ key: "subscription", label: "Monthly subscription" },
		{ key: "web_search", label: "Web search included" },
		{ key: "domain_check", label: "Domain checks included" },
	];
}

/** Map Zeepo plans to pricing-table feature rows (avoids broken legacy string parsing). */
function mapZeepoPlanForPricingTable(plan: ZeepoPurchasePlan, planFilter: ZeepoPlanFilter) {
	const tokenLabel = formatTokenGrant(plan.tokenGrant);

	const featureValues =
		planFilter === "top_up"
			? [
					{ available: tokenLabel != null, valueOverride: tokenLabel },
					{ available: true, valueOverride: null },
					{ available: true, valueOverride: null },
					{ available: true, valueOverride: null },
				]
			: [
					{ available: tokenLabel != null, valueOverride: tokenLabel },
					{ available: plan.zeepoPlanType === "subscription", valueOverride: null },
					{ available: true, valueOverride: null },
					{ available: true, valueOverride: null },
				];

	return {
		id: plan.id,
		name: plan.name,
		niscPrice: plan.niscPrice,
		niscCurrency: plan.niscCurrency,
		billingCycle: plan.billingCycle,
		isPopular: plan.isPopular,
		isRecommended: plan.isRecommended,
		productId: plan.productId ?? "",
		productName: plan.productName ?? "Zeepo AI Agent",
		featureValues,
	};
}

export function ZeepoAgentPricing({
	planFilter = "subscription",
	className,
}: ZeepoAgentPricingProps) {
	const { plans, isLoading } = useZeepoPurchasePlans(planFilter);
	const { openCheckout, checkoutDialog } = useZeepoPlanCheckout();

	const productFeatures = React.useMemo(
		() => getZeepoProductFeatures(planFilter),
		[planFilter],
	);

	const tablePlans = React.useMemo(
		() => plans.map((plan) => mapZeepoPlanForPricingTable(plan, planFilter)),
		[plans, planFilter],
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
						plans={tablePlans}
						productFeatures={productFeatures}
						isLoading={isLoading}
						currency="KES"
						locale="en-KE"
						onBuyNow={(plan) => {
							const match = plans.find((p) => p.id === plan.id);
							if (match) openCheckout(match);
						}}
					/>
				</div>
				<ScrollBar orientation="vertical" />
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
			{checkoutDialog}
		</>
	);
}
