"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { trpc } from "@/utils/trpc";

const SERVICE_SLUG = "background-remover";
const SUB_TYPE = "AI_TOOLS";

export function BackgroundRemoverPricing() {
  const params = useParams();
  const teamSlug = typeof params?.slug === "string" ? params.slug : "";
  const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: !!teamSlug }
  );

  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

  const { data: pricingData, isLoading } =
    trpc.products.getPlansForPricingBySlug.useQuery(
      { slug: SERVICE_SLUG },
      { enabled: true }
    );

  const plans = React.useMemo(() => {
    const raw = pricingData?.plans ?? [];
    return [...raw].sort((a, b) => {
      const pa = Number.parseFloat(a.niscPrice ?? "0") || 0;
      const pb = Number.parseFloat(b.niscPrice ?? "0") || 0;
      if (pa === 0 && pb === 0) return 0;
      if (pa === 0) return 1;
      if (pb === 0) return -1;
      return pa - pb;
    });
  }, [pricingData?.plans]);

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
      const billingCycle =
        plan.selectedBillingCycle || plan.billingCycle || "MONTHLY";
      const price =
        plan.selectedPrice ?? Number.parseFloat(plan.niscPrice || "0");

      const planDetails: ServicePlanDetails = {
        planId: plan.id,
        planName: plan.name,
        planType: "HOSTING",
        subType: SUB_TYPE,
        price,
        currency: plan.niscCurrency || "KES",
        billingCycle: billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY",
        productId: plan.productId,
      };

      setSelectedPlan(planDetails);
      setBuyNowOpen(true);
    },
    []
  );

  return (
    <>
      <PricingTableWrapper
        plans={plans}
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
          teamId={teamData?.id}
          buyDomainHref={undefined}
        />
      )}
    </>
  );
}
