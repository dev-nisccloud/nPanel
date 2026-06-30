import { fetchEmailMarketingPlansPublic } from "@/lib/vps-plans-api.ts";
import { NpanelPricingSection } from "@/pages/services/_components/NpanelPricingSection.tsx";

export function EmailMarketingPricingSection() {
  return (
    <NpanelPricingSection
      fetchPlans={fetchEmailMarketingPlansPublic}
      title="Choose Your Email Marketing Plan"
      description="Professional email design, list segmentation, automation flows, and campaign analytics — managed for you with plans synced from nPanel."
      checkoutServiceType="email_marketing"
      serviceName="Email Marketing"
    />
  );
}
