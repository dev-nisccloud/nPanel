"use client";

import * as React from "react";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { trpc } from "@/utils/trpc";

export function HostingPricing() {
  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

  // Filter by EMAIL_HOSTING subtype for email hosting plans
  const { data: plans, isLoading } = trpc.hostingPlans.getAll.useQuery({
    planType: "HOSTING",
    hostingSubType: "EMAIL_HOSTING",
    isActive: true,
  });

  const handleBuyNow = React.useCallback((plan: any & { selectedBillingCycle?: "MONTHLY" | "YEARLY"; selectedPrice?: number }) => {
    // Transform plan to ServicePlanDetails format
    // Use the selected billing cycle and price from the pricing table
    const billingCycle = plan.selectedBillingCycle || plan.billingCycle;
    const price = plan.selectedPrice || parseFloat(plan.niscPrice || "0");

    const planDetails: ServicePlanDetails = {
      planId: plan.id,
      planName: plan.name,
      planType: "HOSTING",
      subType: "EMAIL_HOSTING",
      price: price,
      currency: plan.niscCurrency || "KES",
      billingCycle: billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY",
    };

    setSelectedPlan(planDetails);
    setBuyNowOpen(true);
  }, []);

  // Helper function to derive pricing (same as in wrapper)
  const derivePricing = (niscPrice: string | null | undefined, billingCycle: string) => {
    if (!niscPrice) {
      return { monthlyPrice: 0, yearlyPrice: 0 };
    }

    const price = parseFloat(niscPrice);
    if (isNaN(price)) {
      return { monthlyPrice: 0, yearlyPrice: 0 };
    }

    if (billingCycle === "MONTHLY") {
      return {
        monthlyPrice: Math.round(price),
        yearlyPrice: Math.round(price * 12 * 0.8),
      };
    }

    if (billingCycle === "YEARLY") {
      const monthly = Math.round(price / 12);
      return {
        monthlyPrice: monthly,
        yearlyPrice: Math.round(price),
      };
    }

    return {
      monthlyPrice: Math.round(price),
      yearlyPrice: Math.round(price * 12 * 0.8),
    };
  };

  return (
    <>
      <PricingTableWrapper
        plans={plans || []}
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
        />
      )}
    </>
  );
}
