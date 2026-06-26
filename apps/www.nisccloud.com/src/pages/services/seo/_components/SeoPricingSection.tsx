import * as React from "react";
import { Check, ArrowRight, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  buildSharedHostingCartParams,
  navigateToStorefrontCart,
} from "@/lib/storefront-cart-url.ts";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip.tsx";
import NumberFlow from "@number-flow/react";
import {
  fetchSeoPlansPublic,
  type SharedHostingPlan,
  type ProductFeatureRow,
} from "@/lib/vps-plans-api.ts";

// ─── Pricing math ─────────────────────────────────────────────────────────────

function derivePricing(niscPrice: string | null | undefined, billingCycle: string) {
  if (!niscPrice) return { monthly: 0, yearly: 0 };
  const price = parseFloat(niscPrice);
  if (isNaN(price)) return { monthly: 0, yearly: 0 };

  if (billingCycle === "MONTHLY") {
    return { monthly: Math.round(price), yearly: Math.round(price * 12 * 0.8) };
  }
  if (billingCycle === "YEARLY") {
    return { monthly: Math.round(price / 12), yearly: Math.round(price) };
  }
  return { monthly: Math.round(price), yearly: Math.round(price * 12 * 0.8) };
}

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isSelected,
  isYearly,
  onClick,
}: {
  plan: SharedHostingPlan;
  isSelected: boolean;
  isYearly: boolean;
  onClick: () => void;
}) {
  const price = derivePricing(plan.niscPrice, plan.billingCycle);
  const displayPrice = isYearly ? price.yearly : price.monthly;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative w-full rounded-2xl text-left transition-all duration-200",
        "p-5 border-2 bg-card/60 hover:bg-card/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/25"
          : "border-border/80 hover:border-primary/40 hover:shadow-md",
      ].join(" ")}
    >
      {/* Selected badge */}
      <div
        className={[
          "absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1",
          "text-[10px] font-semibold uppercase tracking-wide transition-opacity",
          isSelected
            ? "bg-primary text-primary-foreground opacity-100"
            : "opacity-0",
        ].join(" ")}
      >
        <Check className="w-3 h-3 stroke-[2.5]" />
        Selected
      </div>

      {/* Radio circle */}
      <div
        className={[
          "mb-4 flex size-8 items-center justify-center rounded-full border-2 transition-colors",
          isSelected
            ? "border-primary bg-primary"
            : "border-muted-foreground/30 bg-muted/50",
        ].join(" ")}
      >
        {isSelected && <div className="size-2 rounded-full bg-primary-foreground" />}
      </div>

      {/* Name + badges */}
      <div className={["flex items-center justify-between gap-2 mb-3", isSelected && "pr-20"].join(" ")}>
        <span className="text-sm font-semibold tracking-tight text-foreground uppercase">
          {plan.name}
        </span>
        {!isSelected && (
          <span className="flex flex-col gap-1 items-end shrink-0">
            {plan.isPopular && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">
                Popular
              </span>
            )}
            {plan.isRecommended && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
                Recommended
              </span>
            )}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        {displayPrice === 0 ? (
          <span className="text-2xl sm:text-3xl font-bold tracking-tight">Contact us</span>
        ) : (
          <>
            <NumberFlow
              format={{
                style: "currency",
                currency: "KES",
                trailingZeroDisplay: "stripIfInteger",
              } as any}
              value={displayPrice}
              className="text-2xl sm:text-3xl font-bold tracking-tight"
            />
            <span className="text-sm text-muted-foreground">/{isYearly ? "year" : "month"}</span>
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {isSelected ? "Click Get Started above to continue" : "Click to select this plan"}
      </p>
    </button>
  );
}

// ─── Features table ───────────────────────────────────────────────────────────

function FeaturesTable({
  plans,
  productFeatures,
  selectedPlanId,
}: {
  plans: SharedHostingPlan[];
  productFeatures: ProductFeatureRow[];
  selectedPlanId: string;
}) {
  if (!productFeatures.length || !plans.length) return null;

  const gridCols =
    plans.length === 1 ? "grid-cols-1" :
    plans.length === 2 ? "sm:grid-cols-2" :
    plans.length === 3 ? "sm:grid-cols-3" :
    "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card/30">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header */}
          <div className="flex items-center px-5 py-3.5 bg-muted/60 border-b border-border/80">
            <div className="w-48 sm:w-64 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Features
            </div>
            <div className="flex items-center text-sm flex-1 gap-4 sm:gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={[
                    "flex-1 min-w-[100px] text-center font-semibold text-foreground",
                    plan.id === selectedPlanId && "text-primary",
                  ].join(" ")}
                >
                  {plan.name}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {productFeatures.map((feature, idx) => {
            const selectedPlan = plans.find((p) => p.id === selectedPlanId);
            const selectedCell = selectedPlan?.featureValues?.[idx];
            const highlight = selectedCell?.available ?? false;

            return (
              <div
                key={feature.key}
                className={[
                  "flex items-center px-5 py-3.5 transition-colors border-b border-border/50 last:border-b-0",
                  idx % 2 === 0 ? "bg-background/50" : "bg-muted/20",
                  highlight && "bg-primary/[0.06]",
                ].join(" ")}
              >
                <div className="w-48 sm:w-64 flex-shrink-0 text-sm text-foreground/90 flex items-center gap-1.5">
                  <span>{feature.label}</span>
                  {feature.description && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        {feature.description}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="flex items-center text-sm flex-1 gap-4 sm:gap-6">
                  {plans.map((plan) => {
                    const cell = plan.featureValues?.[idx];
                    const available = cell?.available ?? false;
                    const override = cell?.valueOverride ?? null;

                    return (
                      <div
                        key={plan.id}
                        className={[
                          "flex-1 min-w-[100px] flex justify-center",
                          plan.id === selectedPlanId && "font-medium text-foreground",
                        ].join(" ")}
                      >
                        {!available ? (
                          <span className="text-muted-foreground/70"></span>
                        ) : override != null && override !== "" ? (
                          <span className="text-foreground">{override}</span>
                        ) : (
                          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PricingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-44 rounded-full" />
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function SeoPricingSection() {
  const [plans, setPlans] = React.useState<SharedHostingPlan[]>([]);
  const [productFeatures, setProductFeatures] = React.useState<ProductFeatureRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isYearly, setIsYearly] = React.useState(false);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string>("");

  React.useEffect(() => {
    let active = true;
    fetchSeoPlansPublic()
      .then((data) => {
        if (!active) return;
        setPlans(data.plans);
        setProductFeatures(data.productFeatures);
        const recommended = data.plans.find((p) => p.isRecommended);
        const popular = data.plans.find((p) => p.isPopular);
        const fallback = data.plans[0];
        if (recommended) setSelectedId(recommended.id);
        else if (popular) setSelectedId(popular.id);
        else if (fallback) setSelectedId(fallback.id);
      })
      .catch((err: any) => {
        if (active) setError(err?.message ?? "Failed to load plans");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedId);
  const selectedPrice = selectedPlan
    ? derivePricing(selectedPlan.niscPrice, selectedPlan.billingCycle)
    : null;
  const displayPrice = selectedPrice ? (isYearly ? selectedPrice.yearly : selectedPrice.monthly) : 0;

  const handleGetStarted = async () => {
    if (!selectedPlan) return;
    if (displayPrice === 0) {
      window.location.href = "/contact";
      return;
    }
    setCheckoutLoading(true);
    try {
      await navigateToStorefrontCart(
        buildSharedHostingCartParams(selectedPlan, "seo_reports", isYearly),
      );
    } catch (err) {
      setCheckoutLoading(false);
      toast.error(err instanceof Error ? err.message : "Could not open checkout.");
    }
  };

  return (
    <TooltipProvider>
      <section id="plans" className="py-20 bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Choose Your SEO Plan</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Done-for-you SEO with keyword research, on-page and technical fixes, content optimization, and live performance reporting in your portal.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <PricingSkeleton />
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl bg-card/50">
            <p className="text-muted-foreground mb-4 text-lg">No plans available at this time.</p>
            <Button asChild variant="outline">
              <a href="/contact">Contact Us</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Billing toggle + CTA row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:justify-between">
              {/* Monthly / Yearly toggle */}
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/80 border border-border/80 shadow-sm self-start">
                <button
                  type="button"
                  onClick={() => setIsYearly(false)}
                  className={[
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    !isYearly
                      ? "bg-background text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setIsYearly(true)}
                  className={[
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                    isYearly
                      ? "bg-background text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  Yearly
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    Save 20%
                  </span>
                </button>
              </div>

              {/* Get Started CTA */}
              {selectedPlan && (
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  disabled={checkoutLoading}
                  className="w-full sm:w-auto gap-2 rounded-xl font-semibold tracking-tight shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  {displayPrice === 0
                    ? "Contact us"
                    : `Get started with ${selectedPlan.name}`}
                  <ArrowRight className="w-4 h-4 opacity-90" />
                </Button>
              )}
            </div>

            {/* Plan selector cards */}
            <div
              className={[
                "grid w-full gap-4 sm:gap-6",
                plans.length === 1
                  ? "grid-cols-1"
                  : plans.length === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : plans.length === 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
              ].join(" ")}
            >
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={plan.id === selectedId}
                  isYearly={isYearly}
                  onClick={() => setSelectedId(plan.id)}
                />
              ))}
            </div>

            {/* Features comparison table */}
            <FeaturesTable
              plans={plans}
              productFeatures={productFeatures}
              selectedPlanId={selectedId}
            />
          </div>
        )}
      </div>
    </section>
    </TooltipProvider>
  );
}
