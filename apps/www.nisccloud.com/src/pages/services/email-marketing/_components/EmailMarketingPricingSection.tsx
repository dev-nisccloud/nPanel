import { fetchEmailMarketingPlansPublic } from "@/lib/vps-plans-api.ts";
import { NpanelPricingSection } from "@/pages/services/_components/NpanelPricingSection.tsx";

export function EmailMarketingPricingSection() {
  return (
    <NpanelPricingSection
      fetchPlans={fetchEmailMarketingPlansPublic}
      title="Choose your email marketing plan"
      description="Professional email design, list segmentation, automation flows, and campaign analytics managed for you, with clear reporting in your nPanel portal."
      checkoutServiceType="email_marketing"
      serviceName="Email Marketing"
    />
  );
}
