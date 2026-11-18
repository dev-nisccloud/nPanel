import { fetchSeoPlansPublic } from "@/lib/vps-plans-api.ts";
import { SEO_CHECKOUT_SERVICE_TYPE, SEO_SERVICE_NAME } from "@/lib/seo-ai-search.ts";
import { NpanelPricingSection } from "@/pages/services/_components/NpanelPricingSection.tsx";

export function SeoPricingSection() {
  return (
    <NpanelPricingSection
      fetchPlans={fetchSeoPlansPublic}
      title="SEO & AI Search Optimisation plans"
      description="Visibility on Google, Maps and AI-powered search, with technical improvements, useful content and clear monthly reporting. Rankings and AI citations are not guaranteed."
      checkoutServiceType={SEO_CHECKOUT_SERVICE_TYPE}
      serviceName={SEO_SERVICE_NAME}
    />
  );
}
