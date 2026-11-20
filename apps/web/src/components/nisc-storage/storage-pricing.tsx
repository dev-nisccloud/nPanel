"use client";

import * as React from "react";
import { HardDrive } from "lucide-react";

import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { CustomerHostingPlansPricingSection } from "@/components/customer-hosting-plans-pricing/customer-hosting-plans-pricing-section";
import type { HostingPlan } from "@/components/customer-hosting-plans-pricing/types";
import { trpc } from "@/utils/trpc";

import { formatFileBytes, formatPlanBytes } from "./format";

const STORAGE_FEATURES = [
	{
		key: "quota",
		label: "Storage",
		description: "Total space in the private bucket for this plan.",
	},
	{
		key: "file",
		label: "File size",
		description: "The largest single file that can be uploaded on this plan.",
	},
	{
		key: "access",
		label: "Access",
		description: "The bucket stays private. The owner chooses who can open each folder.",
	},
];

export function StoragePricing({ teamId, teamSlug }: { teamId?: string; teamSlug?: string }) {
	const plansQuery = trpc.niscStorage.plans.useQuery();
	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

	const plans = React.useMemo<HostingPlan[]>(() => {
		return (plansQuery.data ?? []).map((plan) => ({
			id: plan.id,
			name: plan.name,
			niscPrice: plan.price,
			niscCurrency: plan.currency ?? "KES",
			billingCycle: plan.billingCycle || "MONTHLY",
			isPopular: Boolean(plan.isPopular),
			isRecommended: Boolean(plan.isRecommended),
			productId: "nisc_storage",
			productName: "Object storage",
			featureValues: [
				{ available: true, valueOverride: formatPlanBytes(plan.quotaBytes) },
				{ available: true, valueOverride: `${formatFileBytes(Number(plan.maxObjectBytes))} per file` },
				{ available: true, valueOverride: "Private bucket" },
			],
		}));
	}, [plansQuery.data]);

	return (
		<>
			<CustomerHostingPlansPricingSection
				config={{
					title: "Choose your storage plan",
					planIcon: HardDrive,
					highlightBadge: "Private bucket",
					fallbackFeatures: [],
				}}
				productDescription="Private object storage for this team. Each plan is one bucket, with its own size and a limit on each file."
				plans={plans}
				productFeatures={STORAGE_FEATURES}
				isLoading={plansQuery.isLoading}
				error={plansQuery.isError ? plansQuery.error.message : null}
				onGetStarted={(plan, displayPrice) => {
					setSelectedPlan({
						planId: plan.id,
						planName: plan.name,
						planType: "OBJECT_STORAGE",
						price: displayPrice,
						currency: plan.niscCurrency || "KES",
						billingCycle: "MONTHLY",
						productId: plan.productId,
					});
					setBuyNowOpen(true);
				}}
			/>
			{selectedPlan ? (
				<BuyNowDialog
					open={buyNowOpen}
					onOpenChange={setBuyNowOpen}
					plan={selectedPlan}
					requireDomainStep={false}
					teamSlug={teamSlug}
					teamId={teamId}
				/>
			) : null}
		</>
	);
}
