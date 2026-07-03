import { HostingPlansPricingSection } from "@/pages/hosting/_components/HostingPlansPricingSection.tsx";
import { SHARED_HOSTING_PRICING_CONFIG } from "@/pages/hosting/_components/hosting-pricing-configs.ts";

export function SharedPricingSection() {
  return <HostingPlansPricingSection config={SHARED_HOSTING_PRICING_CONFIG} />;
}
