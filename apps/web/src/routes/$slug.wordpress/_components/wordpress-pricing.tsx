"use client";

import { CustomerHostingPricing } from "@/components/customer-hosting-plans-pricing/customer-hosting-pricing";
import { WORDPRESS_HOSTING_PRICING_CONFIG } from "@/components/customer-hosting-plans-pricing/hosting-pricing-configs";
import { trpc } from "@/utils/trpc";

type WordPressPricingProps = {
	className?: string;
};

/** Customer WordPress hosting pricing - card layout matching the landing page WordPress hosting flow. */
export function WordPressPricing({ className }: WordPressPricingProps) {
	const { data: pricingData, isLoading, isError, error } =
		trpc.products.getWordPressPlansForPricing.useQuery();

	return (
		<CustomerHostingPricing
			className={className}
			config={WORDPRESS_HOSTING_PRICING_CONFIG}
			subType="WORDPRESS_HOSTING"
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
