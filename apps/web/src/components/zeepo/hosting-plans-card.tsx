"use client";

import * as React from "react";
import { Server, Mail } from "lucide-react";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { useZeepoAgentRoute } from "@/components/zeepo/zeepo-agent-route-context";
import type { AgentHostingPlansResult } from "@/stores/zeepo-payment-store";

interface ZeepoHostingPlansCardProps {
  result: AgentHostingPlansResult;
}

export function ZeepoHostingPlansCard({ result }: ZeepoHostingPlansCardProps) {
  const { teamId, teamSlug } = useZeepoAgentRoute();
  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

  const isEmail = result._tool === "get_email_hosting_plans";
  const Icon = isEmail ? Mail : Server;
  const label = isEmail ? "Email Hosting Plans" : "Web Hosting Plans";

  const handleBuyNow = React.useCallback(
    (plan: any & { selectedBillingCycle?: "MONTHLY" | "YEARLY"; selectedPrice?: number }) => {
      const billingCycle = plan.selectedBillingCycle ?? plan.billingCycle;
      const price = plan.selectedPrice ?? parseFloat(plan.niscPrice ?? "0");

      const planDetails: ServicePlanDetails = {
        planId: plan.id,
        planName: plan.name,
        planType: "HOSTING",
        subType: isEmail ? "EMAIL_HOSTING" : "WEB_HOSTING",
        price,
        currency: plan.niscCurrency ?? "KES",
        billingCycle: (billingCycle ?? "MONTHLY") as "MONTHLY" | "YEARLY" | "BIENNIALLY",
        productId: plan.productId,
      };

      setSelectedPlan(planDetails);
      setBuyNowOpen(true);
    },
    [isEmail],
  );

  return (
    <>
      <div className="w-full rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {result.plans.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
              {result.plans.length} {result.plans.length === 1 ? "plan" : "plans"}
            </span>
          )}
        </div>

        {/* Pricing table - embedded removes full-page padding; overflow-x-auto scrolls on narrow chat columns */}
        {result.plans.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No plans available at the moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[560px] p-3">
              <PricingTableWrapper
                plans={result.plans}
                productFeatures={result.productFeatures}
                currency="KES"
                locale="en-KE"
                onBuyNow={handleBuyNow}
                embedded
              />
            </div>
          </div>
        )}
      </div>

      {selectedPlan && (
        <BuyNowDialog
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          plan={selectedPlan}
          requireDomainStep={true}
          teamId={teamId ?? undefined}
          teamSlug={teamSlug ?? undefined}
          buyDomainHref={teamSlug ? `/${teamSlug}/domains` : undefined}
        />
      )}
    </>
  );
}
