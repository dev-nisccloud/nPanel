"use client";

import * as React from "react";
import { useParams } from "react-router";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { trpc } from "@/utils/trpc";

/** Same flow as `HostingPricing` (customer hosting) — Nisc Email Marketing product plans + checkout. */
export function NiscEmailMarketingPricing() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

  const { data: pricingData, isLoading } = trpc.products.getNiscEmailMarketingPlansForPricing.useQuery();

  const handleBuyNow = React.useCallback((plan: any & { selectedBillingCycle?: "MONTHLY" | "YEARLY"; selectedPrice?: number }) => {
    const billingCycle = plan.selectedBillingCycle || plan.billingCycle;
    const price = plan.selectedPrice ?? parseFloat(plan.niscPrice || "0");

    const planDetails: ServicePlanDetails = {
      planId: plan.id,
      planName: plan.name,
      planType: "HOSTING",
      subType: "EMAIL_MARKETING",
      price,
      currency: plan.niscCurrency || "KES",
      billingCycle: (billingCycle ?? "MONTHLY") as "MONTHLY" | "YEARLY" | "BIENNIALLY",
      productId: plan.productId,
    };

    setSelectedPlan(planDetails);
    setBuyNowOpen(true);
  }, []);

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
          requireDomainStep={false}
          startAtPayment={true}
          teamId={teamData?.id}
        />
      )}
    </>
  );
}
