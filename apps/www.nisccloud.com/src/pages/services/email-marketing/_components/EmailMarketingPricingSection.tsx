import { fetchEmailMarketingPlansPublic } from "@/lib/vps-plans-api.ts";
import { NpanelPricingSection } from "@/pages/services/_components/NpanelPricingSection.tsx";

export function EmailMarketingPricingSection() {
  return (
    <NpanelPricingSection
      fetchPlans={fetchEmailMarketingPlansPublic}
      title="Choose your Nisc Outreach plan"
      description="AI-built campaigns, audiences, sending from your own domain and campaign reports, all in nPanel."
      checkoutServiceType="email_marketing"
      serviceName="Nisc Outreach"
    />
  );
}
