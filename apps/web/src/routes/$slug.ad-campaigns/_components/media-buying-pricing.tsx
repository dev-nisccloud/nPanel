"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, TrendingUp } from "lucide-react";
import {
  AdminAccessGuideDialog,
  type AdPlatform,
} from "./admin-access-guide-dialog";

interface MediaBuyingPricingProps {
  platform: AdPlatform;
}

export function MediaBuyingPricing({ platform }: MediaBuyingPricingProps) {
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [guideOpen, setGuideOpen] = React.useState(false);

  const { data, isLoading } =
    trpc.clientSubscriptions.getMediaBuyingProductForSubscription.useQuery();

  React.useEffect(() => {
    if (data?.plans && data.plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(data.plans[0].id);
    }
  }, [data, selectedPlanId]);

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Loading media buying plans...
      </div>
    );
  }

  if (!data || data.plans.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Media buying plans are not configured yet.
      </div>
    );
  }

  const selectedPlan = data.plans.find((p) => p.id === selectedPlanId) ?? data.plans[0];
  const commissionRate =
    selectedPlan.agreedCommissionRate != null
      ? `${selectedPlan.agreedCommissionRate}%`
      : null;

  return (
    <>
      <section className="py-12 sm:py-16 px-4">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">
                {data.name} Pricing
              </h2>
            </div>
            <p className="text-muted-foreground text-sm max-w-xl">
              Our media buying service uses a performance-based pricing model.
              Your monthly fee is calculated at the end of each billing cycle
              based on your total ad spend  no fixed monthly charges.
            </p>
          </div>

          {/* CTA button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              className={cn(
                "gap-2 rounded-xl font-semibold tracking-tight",
                "shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
                "transition-all duration-200 border-0",
              )}
              onClick={() => setGuideOpen(true)}
            >
              Get Started
              <ArrowRight className="w-4 h-4 opacity-90" />
            </Button>
          </div>

          {/* Plan cards */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
            {data.plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const rate =
                plan.agreedCommissionRate != null
                  ? `${plan.agreedCommissionRate}%`
                  : null;

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "relative flex-1 p-5 sm:p-6 rounded-2xl text-left transition-all duration-200",
                    "border-2 bg-card/60 hover:bg-card/90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/25"
                      : "border-border/80 hover:border-primary/40 hover:shadow-md",
                  )}
                >
                  {/* Selected indicator */}
                  <div
                    className={cn(
                      "absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-opacity",
                      isSelected
                        ? "bg-primary text-primary-foreground opacity-100"
                        : "opacity-0",
                    )}
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    Selected
                  </div>

                  {/* Radio dot */}
                  <div
                    className={cn(
                      "mb-4 flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30 bg-muted/50",
                    )}
                  >
                    {isSelected && (
                      <div className="size-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>

                  {/* Plan name */}
                  <p className="text-sm font-semibold tracking-tight text-foreground uppercase mb-3 pr-20">
                    {plan.name}
                  </p>

                  {/* Commission rate display */}
                  {rate ? (
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-bold tracking-tight text-foreground">
                        {rate}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of ad spend / month
                      </span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold tracking-tight mb-3">
                      Custom rate
                    </div>
                  )}

                  {/* Commission description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    For this service we do not offer a fixed price. The monthly
                    price is instead calculated at the end of each monthly
                    billing cycle at the rate of{" "}
                    <span className="font-semibold text-foreground">
                      {rate ?? "a commission rate"}
                    </span>{" "}
                    of Total Ad spend.
                  </p>

                  {/* Selection hint */}
                  <p className="mt-3 text-[11px] text-muted-foreground/70">
                    {isSelected
                      ? "Click Get Started above to continue"
                      : "Click to select this plan"}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selected plan summary */}
          {selectedPlan && commissionRate && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {selectedPlan.name}:
              </span>{" "}
              You will be billed at{" "}
              <span className="font-semibold text-foreground">
                {commissionRate}
              </span>{" "}
              of your total monthly ad spend, invoiced at the end of each
              billing cycle.
            </div>
          )}
        </div>
      </section>

      <AdminAccessGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        platform={platform}
      />
    </>
  );
}
