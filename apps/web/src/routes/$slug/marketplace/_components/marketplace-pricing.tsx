"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { trpc } from "@/utils/trpc";

/** Map service slug to plan subType for order flow (optional; backend may use productId). */
function getSubTypeForSlug(slug: string): string {
  const map: Record<string, string> = {
    "website-hosting": "WEB_HOSTING",
    "business-email": "EMAIL_HOSTING",
    "vps-hosting": "VPS_HOSTING",
    "email-marketing": "EMAIL_MARKETING",
    "seo": "SEO",
    "media-buying": "MEDIA_BUYING",
    "creatives-design": "CREATIVES",
    "background-remover": "AI_TOOLS",
    "ai-image-generator": "AI_TOOLS",
  };
  return map[slug] ?? "CUSTOM";
}

export function MarketplacePricing({ serviceSlug }: { serviceSlug: string }) {
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
      { slug: serviceSlug },
      { enabled: !!serviceSlug }
    );

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
        plan.selectedPrice ?? parseFloat(plan.niscPrice || "0");

      const planDetails: ServicePlanDetails = {
        planId: plan.id,
        planName: plan.name,
        planType: "HOSTING",
        subType: getSubTypeForSlug(serviceSlug),
        price,
        currency: plan.niscCurrency || "KES",
        billingCycle: billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY",
        productId: plan.productId,
      };

      setSelectedPlan(planDetails);
      setBuyNowOpen(true);
    },
    [serviceSlug]
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
          requireDomainStep={true}
          teamId={teamData?.id}
          buyDomainHref={teamSlug ? `/${teamSlug}/domains` : undefined}
        />
      )}
    </>
  );
}
