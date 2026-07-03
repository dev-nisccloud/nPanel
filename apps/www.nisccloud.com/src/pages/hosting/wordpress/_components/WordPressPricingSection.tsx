import { HostingPlansPricingSection } from "@/pages/hosting/_components/HostingPlansPricingSection.tsx";
import { WORDPRESS_HOSTING_PRICING_CONFIG } from "@/pages/hosting/_components/hosting-pricing-configs.ts";

export function WordPressPricingSection() {
  return <HostingPlansPricingSection config={WORDPRESS_HOSTING_PRICING_CONFIG} />;
}
