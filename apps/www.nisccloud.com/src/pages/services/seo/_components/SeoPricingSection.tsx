import { fetchSeoPlansPublic } from "@/lib/vps-plans-api.ts";
import { NpanelPricingSection } from "@/pages/services/_components/NpanelPricingSection.tsx";

export function SeoPricingSection() {
  return (
    <NpanelPricingSection
      fetchPlans={fetchSeoPlansPublic}
      title="Choose Your SEO Plan"
      description="Done-for-you SEO with keyword research, on-page and technical fixes, content optimisation, and clear performance reporting in your portal."
      checkoutServiceType="seo_reports"
      serviceName="SEO Services"
    />
  );
}
