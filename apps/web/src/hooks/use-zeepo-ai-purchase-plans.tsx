"use client";

import * as React from "react";
import { useParams } from "react-router";
import { trpc } from "@/utils/trpc";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { useZeepoAiRoute } from "@/components/zeepo/zeepo-ai-route-context";
import { refreshZeepoAiTokenBalance } from "@/hooks/use-zeepo-ai-token-balance";

const SUB_TYPE = "ZEEPO_AI";

export type ZeepoAiPurchasePlan = {
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

function mapRawPlans(
	raw: Array<Record<string, unknown>>,
	productId?: string,
	productName?: string,
): ZeepoAiPurchasePlan[] {
	return raw.map((plan) => {
		const tokenGrant =
			typeof plan.tokenGrant === "number"
				? plan.tokenGrant
				: Number.parseInt(String(plan.tokenGrant ?? "0"), 10) || 0;
		const highlights = Array.isArray(plan.highlights) ? (plan.highlights as string[]) : [];
		const displayPrice = typeof plan.displayPrice === "number" ? plan.displayPrice : 0;

		return {
			id: plan.id as string,
			name: plan.name as string,
			description: (plan.description as string | null) ?? null,
			niscPrice: String(displayPrice),
			niscCurrency: (plan.displayCurrency as string) ?? "KES",
			billingCycle: "CUSTOM",
			features: [
				`${tokenGrant.toLocaleString()} tokens`,
				"One-time top-up",
				"Added to your team wallet",
				...highlights,
			],
			isPopular: Boolean(plan.isPopular),
			isRecommended: Boolean(plan.isRecommended),
			productId,
			productName,
			zeepoPlanType: "top_up",
			tokenGrant,
			displayPrice,
		};
	});
}

export function useZeepoAiPurchasePlans() {
	const { data: pricingData, isLoading } = trpc.zeepoAi.billing.listPurchasePlans.useQuery({
		displayCurrency: "KES",
	});

	const plans = React.useMemo(() => {
		const raw = pricingData?.data ?? [];
		return mapRawPlans(raw, pricingData?.productId, pricingData?.productName).sort(
			(a, b) => a.displayPrice - b.displayPrice,
		);
	}, [pricingData?.data, pricingData?.productId, pricingData?.productName]);

	return {
		plans,
		isLoading,
		productId: pricingData?.productId,
		productName: pricingData?.productName,
	};
}

export function useZeepoAiPlanCheckout() {
	const params = useParams();
	const teamSlug = typeof params?.slug === "string" ? params.slug : "";
	const { teamId } = useZeepoAiRoute();
	const utils = trpc.useUtils();

	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

	const openCheckout = React.useCallback((plan: ZeepoAiPurchasePlan) => {
		setSelectedPlan({
			planId: plan.id,
			planName: plan.name,
			planType: "HOSTING",
			subType: SUB_TYPE,
			price: plan.displayPrice,
			currency: plan.niscCurrency || "KES",
			billingCycle: "CUSTOM",
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
					if (!open) refreshZeepoAiTokenBalance(utils, teamId);
				}}
				plan={selectedPlan}
				requireDomainStep={false}
				teamId={teamId ?? undefined}
				buyDomainHref={teamSlug ? `/${teamSlug}/domains` : undefined}
			/>
		) : null;

	return { openCheckout, checkoutDialog, buyNowOpen };
}
