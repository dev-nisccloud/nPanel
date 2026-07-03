import { HostingPlansPricingSection } from "@/pages/hosting/_components/HostingPlansPricingSection.tsx";
import { EMAIL_HOSTING_PRICING_CONFIG } from "@/pages/hosting/_components/hosting-pricing-configs.ts";

export function EmailPricingSection() {
  return <HostingPlansPricingSection config={EMAIL_HOSTING_PRICING_CONFIG} />;
}
