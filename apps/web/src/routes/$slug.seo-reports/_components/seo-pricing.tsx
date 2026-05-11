"use client";

import * as React from "react";
import { useParams } from "react-router";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { trpc } from "@/utils/trpc";

export function SeoPricing() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery({ slug }, { enabled: !!slug });

  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

  const { data: pricingData, isLoading } = trpc.products.getSeoPlansForPricing.useQuery();

  const handleBuyNow = React.useCallback(
    (plan: {
      id: string;
      name: string;
      niscPrice?: string | null;
      niscCurrency?: string;
      billingCycle?: string;
      productId?: string;
      selectedBillingCycle?: "MONTHLY" | "YEARLY";
      selectedPrice?: number;
    }) => {
      const billingCycle = plan.selectedBillingCycle || plan.billingCycle || "MONTHLY";
      const price = plan.selectedPrice ?? parseFloat(plan.niscPrice || "0");

      const planDetails: ServicePlanDetails = {
        planId: plan.id,
        planName: plan.name,
        planType: "HOSTING",
        subType: "SEO",
        price,
        currency: plan.niscCurrency || "KES",
        billingCycle: billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY",
        productId: plan.productId,
      };

      setSelectedPlan(planDetails);
      setBuyNowOpen(true);
    },
    [],
  );

  return (
    <>
      <PricingTableWrapper
        plans={pricingData?.plans ?? []}
        productFeatures={pricingData?.productFeatures}
        isLoading={isLoading}
        currency="KES"
        locale="en-KE"
        onBuyNow={handleBuyNow}
      />
      {selectedPlan && (
        <BuyNowDialog
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          plan={selectedPlan}
          teamId={teamData?.id}
          seoReportsHref={slug ? `/${slug}/seo-reports` : undefined}
        />
      )}
    </>
  );
}
