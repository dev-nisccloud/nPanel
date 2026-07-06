"use client";

import { CustomerHostingPricing } from "@/components/customer-hosting-plans-pricing/customer-hosting-pricing";
import { SHARED_HOSTING_PRICING_CONFIG } from "@/components/customer-hosting-plans-pricing/hosting-pricing-configs";
import { trpc } from "@/utils/trpc";

type WebHostingPricingProps = {
	className?: string;
};

/** Customer web hosting pricing - card layout matching the landing page shared hosting flow. */
export function HostingPricing({ className }: WebHostingPricingProps) {
	const { data: pricingData, isLoading, isError, error } =
		trpc.products.getHostingPlansForPricing.useQuery();

	return (
		<CustomerHostingPricing
			className={className}
			config={SHARED_HOSTING_PRICING_CONFIG}
			subType="WEB_HOSTING"
			plans={(pricingData?.plans ?? []).map((plan) => ({
				...plan,
				billingCycle: plan.billingCycle || "MONTHLY",
			}))}
			productFeatures={pricingData?.productFeatures ?? []}
			isLoading={isLoading}
			error={isError ? (error?.message ?? "Failed to load plans") : null}
		/>
	);
}
