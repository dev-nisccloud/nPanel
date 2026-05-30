"use client";

import * as React from "react";
import { useParams } from "react-router";
import { trpc } from "@/utils/trpc";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { useZeepoAgentRoute } from "@/components/zeepo/zeepo-agent-route-context";
import { useRefreshZeepoTokenBalance } from "@/hooks/use-zeepo-token-balance";

const SUB_TYPE = "ZEEPO_AI_AGENT";

export type ZeepoPurchasePlan = {
	id: string;
	name: string;
	description?: string | null;
	niscPrice: string;
	niscCurrency: string;
	billingCycle: string;
	features: string[];
	isPopular: boolean;
	isRecommended: boolean;
	productId?: string;
	productName?: string;
	zeepoPlanType: string;
	tokenGrant: number;
	displayPrice: number;
};

export type ZeepoPlanFilter = "all" | "subscription" | "top_up";

function mapRawPlans(
	raw: Array<Record<string, unknown>>,
	productId?: string,
	productName?: string,
): ZeepoPurchasePlan[] {
	return raw.map((plan) => {
		const tokenGrant =
			typeof plan.tokenGrant === "number"
				? plan.tokenGrant
				: Number.parseInt(String(plan.tokenGrant ?? "0"), 10) || 0;
		const highlights = Array.isArray(plan.highlights) ? (plan.highlights as string[]) : [];
		const zeepoPlanType = String(plan.zeepoPlanType ?? "subscription");
		const displayPrice =
			typeof plan.displayPrice === "number" ? plan.displayPrice : 0;

		const features = [
			zeepoPlanType === "top_up" ? "One-time top-up" : "Monthly subscription",
			"Web search included",
			"Domain checks included",
			...highlights,
		].filter(Boolean) as string[];

		return {
			id: plan.id as string,
			name: plan.name as string,
			description: (plan.description as string | null) ?? null,
			niscPrice: String(displayPrice),
			niscCurrency: (plan.displayCurrency as string) ?? "KES",
			billingCycle:
				zeepoPlanType === "top_up" ? "CUSTOM" : ((plan.billingCycle as string) ?? "MONTHLY"),
			features,
			isPopular: Boolean(plan.isPopular),
			isRecommended: Boolean(plan.isRecommended),
			productId,
			productName,
			zeepoPlanType,
			tokenGrant,
			displayPrice,
		};
	});
}

export function useZeepoPurchasePlans(planFilter: ZeepoPlanFilter = "all") {
	const { data: pricingData, isLoading } = trpc.zeepoAgent.billing.listPurchasePlans.useQuery(
		{ displayCurrency: "KES" },
	);

	const plans = React.useMemo(() => {
		const raw = pricingData?.data ?? [];
		const filtered = raw.filter((p) => {
			const type = String(p.zeepoPlanType ?? "");
			if (type === "pay_as_you_go") return false;
			if (planFilter === "subscription") return type === "subscription";
			if (planFilter === "top_up") return type === "top_up";
			return true;
		});

		return [...mapRawPlans(filtered, pricingData?.productId, pricingData?.productName)].sort(
			(a, b) => {
				if (a.zeepoPlanType !== b.zeepoPlanType) {
					return a.zeepoPlanType === "subscription" ? -1 : 1;
				}
				return a.displayPrice - b.displayPrice;
			},
		);
	}, [pricingData?.data, pricingData?.productId, pricingData?.productName, planFilter]);

	return {
		plans,
		isLoading,
		productId: pricingData?.productId,
		productName: pricingData?.productName,
	};
}

export function useZeepoPlanCheckout() {
	const params = useParams();
	const teamSlug = typeof params?.slug === "string" ? params.slug : "";
	const { teamId } = useZeepoAgentRoute();
	const refreshTokenBalance = useRefreshZeepoTokenBalance();

	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

	const openCheckout = React.useCallback((plan: ZeepoPurchasePlan) => {
		setSelectedPlan({
			planId: plan.id,
			planName: plan.name,
			planType: "HOSTING",
			subType: SUB_TYPE,
			price: plan.displayPrice,
			currency: plan.niscCurrency || "KES",
			billingCycle: plan.billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM",
			productId: plan.productId,
		});
		setBuyNowOpen(true);
	}, []);

	const checkoutDialog =
		selectedPlan != null ? (
			<BuyNowDialog
				open={buyNowOpen}
				onOpenChange={(open) => {
					setBuyNowOpen(open);
					if (!open) refreshTokenBalance(teamId);
				}}
				plan={selectedPlan}
				requireDomainStep={false}
				teamId={teamId ?? undefined}
				buyDomainHref={teamSlug ? `/${teamSlug}/domains` : undefined}
			/>
		) : null;

	return { openCheckout, checkoutDialog, buyNowOpen };
}
