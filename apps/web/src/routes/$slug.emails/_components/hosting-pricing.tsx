"use client";

import { CustomerHostingPricing } from "@/components/customer-hosting-plans-pricing/customer-hosting-pricing";
import { EMAIL_HOSTING_PRICING_CONFIG } from "@/components/customer-hosting-plans-pricing/hosting-pricing-configs";
import { trpc } from "@/utils/trpc";

type EmailHostingPricingProps = {
	className?: string;
};

/** Customer email hosting pricing - card layout matching the landing page email hosting flow. */
export function HostingPricing({ className }: EmailHostingPricingProps) {
	const { data: pricingData, isLoading, isError, error } =
		trpc.products.getEmailHostingPlansForPricing.useQuery();

	return (
		<CustomerHostingPricing
			className={className}
			config={EMAIL_HOSTING_PRICING_CONFIG}
			subType="EMAIL_HOSTING"
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
