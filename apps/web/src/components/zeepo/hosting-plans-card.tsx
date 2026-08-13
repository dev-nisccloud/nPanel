"use client";

import * as React from "react";
import { Server, Mail, Zap } from "lucide-react";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { PricingTableWrapper } from "@/components/pricing-table-wrapper";
import { useZeepoCheckoutTeam } from "@/components/zeepo/use-zeepo-checkout-team";
import type { AgentHostingPlansResult } from "@/stores/zeepo-payment-store";

interface ZeepoHostingPlansCardProps {
  result: AgentHostingPlansResult;
}

export function ZeepoHostingPlansCard({ result }: ZeepoHostingPlansCardProps) {
  const { teamId, teamSlug } = useZeepoCheckoutTeam();
  const [buyNowOpen, setBuyNowOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);

  const isEmail = result._tool === "get_email_hosting_plans";
  const isWordpress = result._tool === "get_wordpress_hosting_plans";
  const Icon = isEmail ? Mail : isWordpress ? Zap : Server;
  const label = isEmail
    ? "Email Hosting Plans"
    : isWordpress
      ? "WordPress Hosting Plans"
      : "Web Hosting Plans";
  const subType: ServicePlanDetails["subType"] = isEmail
    ? "EMAIL_HOSTING"
    : isWordpress
      ? "WORDPRESS_HOSTING"
      : "WEB_HOSTING";

  const handleBuyNow = React.useCallback(
    (plan: any & { selectedBillingCycle?: "MONTHLY" | "YEARLY"; selectedPrice?: number }) => {
      const billingCycle = plan.selectedBillingCycle ?? plan.billingCycle;
      const price = plan.selectedPrice ?? parseFloat(plan.niscPrice ?? "0");

      const planDetails: ServicePlanDetails = {
        planId: plan.id,
        planName: plan.name,
        planType: "HOSTING",
        subType,
        price,
        currency: plan.niscCurrency ?? "KES",
        billingCycle: (billingCycle ?? "MONTHLY") as "MONTHLY" | "YEARLY" | "BIENNIALLY",
        productId: plan.productId,
      };

      setSelectedPlan(planDetails);
      setBuyNowOpen(true);
    },
    [subType],
  );

  return (
    <>
      <div className="w-full max-w-full rounded-2xl rounded-bl-md border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2.5">
          <Icon className="size-3.5 shrink-0 text-primary" />
          <span className="min-w-0 truncate text-sm font-semibold text-foreground">{label}</span>
          {result.plans.length > 0 ? (
            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {result.plans.length} {result.plans.length === 1 ? "plan" : "plans"}
            </span>
          ) : null}
        </div>

        {result.plans.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No plans available at the moment.
          </p>
        ) : (
          /* Single scroll owner lives inside PricingTable (sticky feature labels). */
          <div className="p-2.5 sm:p-3">
            <PricingTableWrapper
              plans={result.plans}
              productFeatures={result.productFeatures}
              currency="KES"
              locale="en-KE"
              onBuyNow={handleBuyNow}
              embedded
            />
          </div>
        )}
      </div>

      {selectedPlan ? (
        <BuyNowDialog
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          plan={selectedPlan}
          requireDomainStep={true}
          teamId={teamId ?? undefined}
          teamSlug={teamSlug ?? undefined}
          buyDomainHref={teamSlug ? `/${teamSlug}/domains` : undefined}
        />
      ) : null}
    </>
  );
}
