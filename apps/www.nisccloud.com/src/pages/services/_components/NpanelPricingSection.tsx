import * as React from "react";
import type { SharedHostingPricingData } from "@/lib/vps-plans-api.ts";
import {
  HostingPlansPricingSection,
  type HostingPlansPricingConfig,
} from "@/pages/hosting/_components/HostingPlansPricingSection.tsx";

export type NpanelPricingSectionProps = {
  fetchPlans: () => Promise<SharedHostingPricingData>;
  title: string;
  description: string;
  checkoutServiceType: string;
  serviceName: string;
  sectionId?: string;
};

export function NpanelPricingSection({
  fetchPlans,
  title,
  description,
  checkoutServiceType,
  serviceName,
  sectionId = "plans",
}: NpanelPricingSectionProps) {
  const config = React.useMemo<HostingPlansPricingConfig>(
    () => ({
      sectionId,
      title,
      description,
      serviceType: checkoutServiceType,
      fetchPlans,
      fallbackFeatures: [],
      contactServiceName: serviceName,
    }),
    [sectionId, title, description, checkoutServiceType, fetchPlans, serviceName],
  );
  return <HostingPlansPricingSection config={config} />;
}
