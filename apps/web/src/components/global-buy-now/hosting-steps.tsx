"use client";

import * as React from "react";
import { Check, Globe, Mail, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NumberFlow from "@number-flow/react";

export type HostingPlanType = "web" | "email";

export const DEFAULT_HOSTING_BILLING_CYCLE = "YEARLY" as const;
export const DEFAULT_HOSTING_BILLING_INTERVAL = "yearly" as const;

export type PlanFeatureChip = {
  label: string;
  /** Limit or value from the plan; null means included without a numeric override */
  value: string | null;
};

export type PricingPlanRow = {
  id: string;
  name: string;
  niscPrice: string | null;
  niscCurrency: string;
  billingCycle: string;
  isPopular: boolean;
  isRecommended: boolean;
  productId: string;
  productName: string;
  featureValues: Array<{ available: boolean; valueOverride: string | null }>;
};

export type ProductFeatureRow = { key: string; label: string };

export type SelectedHostingUpsell = {
  hostingType: HostingPlanType;
  productId: string;
  productName: string;
  planId: string;
  planName: string;
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY";
  price: number;
  currency: string;
};

const formatPrice = (price: number, currency = "KES") => {
  const code = currency || "KES";
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    const symbol = code === "KES" ? "KSh" : code === "USD" ? "$" : code;
    return `${symbol} ${Math.round(price)}`;
  }
};

export function getMinMonthlyFromPlans(
  plans: Array<{ niscPrice: string | null; billingCycle: string }>,
): number | null {
  let min = Infinity;
  for (const plan of plans) {
    const price = parseFloat(plan.niscPrice || "0");
    if (!price || !Number.isFinite(price)) continue;
    const monthly =
      plan.billingCycle === "YEARLY"
        ? price / 12
        : plan.billingCycle === "BIENNIALLY"
          ? price / 24
          : price;
    if (monthly < min) min = monthly;
  }
  return min === Infinity ? null : Math.round(min);
}

/** Lowest yearly total (with 20% annual discount) across plans — for upsell card “from” pricing */
export function getMinYearlyFromPlans(
  plans: Array<{ niscPrice: string | null; billingCycle: string }>,
): number | null {
  const monthlyMin = getMinMonthlyFromPlans(plans);
  if (monthlyMin == null) return null;
  return Math.round(monthlyMin * 12 * 0.8);
}

function monthlyFromPlanPrice(price: number, billingCycle: string) {
  if (billingCycle === "YEARLY") return price / 12;
  if (billingCycle === "BIENNIALLY") return price / 24;
  return price;
}

function totalForCycle(monthly: number, cycle: "MONTHLY" | "YEARLY" | "BIENNIALLY") {
  if (cycle === "YEARLY") {
    return Math.round(monthly * 12 * 0.8 * 100) / 100;
  }
  const months = cycle === "MONTHLY" ? 1 : 24;
  return Math.round(monthly * months * 100) / 100;
}

function displayPriceForCycle(monthly: number, cycle: "MONTHLY" | "YEARLY" | "BIENNIALLY") {
  if (cycle === "YEARLY") return totalForCycle(monthly, "YEARLY");
  if (cycle === "MONTHLY") return monthly;
  return totalForCycle(monthly, cycle);
}

export function getPlanFeatureChips(
  productFeatures: ProductFeatureRow[],
  featureValues: PricingPlanRow["featureValues"],
  limit = 6,
): PlanFeatureChip[] {
  const chips: PlanFeatureChip[] = [];
  for (let i = 0; i < productFeatures.length && chips.length < limit; i++) {
    const label = productFeatures[i]!.label;
    const cell = featureValues[i];
    if (!cell?.available) continue;
    const override = cell.valueOverride?.trim();
    chips.push({
      label,
      value: override && override.length > 0 ? override : null,
    });
  }
  return chips;
}

function PlanFeatureChips({ chips, extraCount }: { chips: PlanFeatureChip[]; extraCount: number }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[11px] leading-tight"
        >
          <span className="text-muted-foreground">{chip.label}</span>
          {chip.value ? (
            <span className="font-semibold text-foreground tabular-nums">{chip.value}</span>
          ) : (
            <Check className="size-3 shrink-0 text-primary" aria-hidden />
          )}
        </span>
      ))}
      {extraCount > 0 && (
        <span className="inline-flex items-center rounded-md px-2 py-1 text-[11px] text-muted-foreground">
          +{extraCount} more
        </span>
      )}
    </div>
  );
}

type HostingUpsellStepProps = {
  domainLabel?: string;
  selected: SelectedHostingUpsell[];
  /** Lowest yearly price (after annual discount) for marketing */
  webFromPrice: number | null;
  emailFromPrice: number | null;
  pricePeriodLabel?: string;
  isLoadingPrices?: boolean;
  onBrowsePlans: (type: HostingPlanType) => void;
  onChangePlan: (type: HostingPlanType) => void;
  onRemove: (type: HostingPlanType) => void;
};

export function HostingUpsellStep({
  domainLabel,
  selected,
  webFromPrice,
  emailFromPrice,
  pricePeriodLabel = "/yr",
  isLoadingPrices = false,
  onBrowsePlans,
  onChangePlan,
  onRemove,
}: HostingUpsellStepProps) {
  const webSelected = selected.find((p) => p.hostingType === "web");
  const emailSelected = selected.find((p) => p.hostingType === "email");

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
        <p className="text-sm font-medium text-foreground">Power up your domain</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {domainLabel
            ? `Optional hosting for ${domainLabel}. Skip anytime, you can add this later.`
            : "Add website or email hosting now, or continue without."}
        </p>
      </div>

      <div className="grid gap-3">
        <HostingServiceCard
          type="web"
          icon={Globe}
          title="Website hosting"
          description="Launch and manage your site with fast, reliable hosting."
          fromPrice={webFromPrice}
          pricePeriodLabel={pricePeriodLabel}
          isLoadingPrice={isLoadingPrices}
          selected={webSelected}
          onBrowse={() => onBrowsePlans("web")}
          onChange={() => onChangePlan("web")}
          onRemove={() => onRemove("web")}
        />
        <HostingServiceCard
          type="email"
          icon={Mail}
          title="Email hosting"
          description="Professional mailboxes on your domain for your team."
          fromPrice={emailFromPrice}
          pricePeriodLabel={pricePeriodLabel}
          isLoadingPrice={isLoadingPrices}
          selected={emailSelected}
          onBrowse={() => onBrowsePlans("email")}
          onChange={() => onChangePlan("email")}
          onRemove={() => onRemove("email")}
        />
      </div>
    </div>
  );
}

function HostingServiceCard({
  type,
  icon: Icon,
  title,
  description,
  fromPrice,
  pricePeriodLabel = "/yr",
  isLoadingPrice,
  selected,
  onBrowse,
  onChange,
  onRemove,
}: {
  type: HostingPlanType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  fromPrice: number | null;
  isLoadingPrice: boolean;
  selected?: SelectedHostingUpsell;
  onBrowse: () => void;
  onChange: () => void;
  onRemove: () => void;
}) {
  const isSelected = !!selected;

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-all duration-200",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/80 bg-card hover:border-primary/35 hover:shadow-sm",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg border",
            isSelected ? "border-primary/30 bg-primary/10" : "border-border bg-muted/50",
          )}
        >
          <Icon className={cn("size-5", isSelected ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
            </div>
            {isSelected && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                <Check className="size-3" />
                Added
              </span>
            )}
          </div>

          {isSelected ? (
            <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground text-right line-clamp-2">{selected.planName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-medium text-foreground capitalize">
                  {selected.billingCycle.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold text-foreground">
                  {formatPrice(selected.price, selected.currency)}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={onChange}>
                  Change plan
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onRemove}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-3 pt-0.5">
              <div className="min-w-0">
                {isLoadingPrice ? (
                  <Skeleton className="h-5 w-24" />
                ) : fromPrice != null ? (
                  <>
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="text-base font-semibold text-foreground tabular-nums">
                      {formatPrice(fromPrice)}
                      <span className="text-xs font-normal text-muted-foreground">{pricePeriodLabel}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Plans available at checkout</p>
                )}
              </div>
              <Button type="button" size="sm" className="shrink-0" onClick={onBrowse}>
                View plans
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type HostingPlanSelectionStepProps = {
  planType: HostingPlanType;
  domainLabel?: string;
  plans: PricingPlanRow[];
  productFeatures: ProductFeatureRow[];
  isLoading: boolean;
  selectedPlanId: string | null;
  billingInterval: "monthly" | "yearly";
  billingCyclesByPlanId: Record<string, "MONTHLY" | "YEARLY" | "BIENNIALLY">;
  onSelectPlan: (planId: string) => void;
  onBillingIntervalChange: (interval: "monthly" | "yearly") => void;
  onPlanBillingCycleChange: (planId: string, cycle: "MONTHLY" | "YEARLY" | "BIENNIALLY") => void;
};

export function HostingPlanSelectionStep({
  planType,
  domainLabel,
  plans,
  productFeatures,
  isLoading,
  selectedPlanId,
  billingInterval,
  billingCyclesByPlanId,
  onSelectPlan,
  onBillingIntervalChange,
  onPlanBillingCycleChange,
}: HostingPlanSelectionStepProps) {
  const sortedPlans = React.useMemo(() => {
    return [...plans].sort((a, b) => {
      const am = monthlyFromPlanPrice(parseFloat(a.niscPrice || "0"), a.billingCycle);
      const bm = monthlyFromPlanPrice(parseFloat(b.niscPrice || "0"), b.billingCycle);
      if (am === 0 && bm === 0) return 0;
      if (am === 0) return 1;
      if (bm === 0) return -1;
      return am - bm;
    });
  }, [plans]);

  const title = planType === "web" ? "Website hosting" : "Email hosting";

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (sortedPlans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No {planType === "web" ? "website" : "email"} hosting plans are available right now.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {domainLabel && (
            <p className="text-xs text-muted-foreground mt-0.5">
              For <span className="font-medium text-foreground">{domainLabel}</span>
            </p>
          )}
        </div>
        <div className="inline-flex self-start rounded-full border border-border/80 bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => onBillingIntervalChange("monthly")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              billingInterval === "monthly"
                ? "bg-background text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => onBillingIntervalChange("yearly")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1",
              billingInterval === "yearly"
                ? "bg-background text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Yearly
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1 py-0.5 rounded">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {sortedPlans.map((plan) => {
          const basePrice = parseFloat(plan.niscPrice || "0");
          const baseMonthly = monthlyFromPlanPrice(basePrice, plan.billingCycle);
          const isSelected = selectedPlanId === plan.id;
          const cycle =
            billingCyclesByPlanId[plan.id] ??
            (billingInterval === "yearly" ? DEFAULT_HOSTING_BILLING_CYCLE : "MONTHLY");
          const displayAmount = displayPriceForCycle(baseMonthly, cycle);
          const allChips = getPlanFeatureChips(productFeatures, plan.featureValues, 8);
          const featureChips = allChips.slice(0, 5);
          const extraFeatureCount = allChips.length - featureChips.length;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectPlan(plan.id)}
              className={cn(
                "w-full text-left rounded-xl border-2 p-3.5 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/20"
                  : "border-border/80 bg-card hover:border-primary/40 hover:shadow-sm",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground line-clamp-2">{plan.name}</span>
                    {plan.isPopular && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        <Sparkles className="size-3" />
                        Popular
                      </span>
                    )}
                    {plan.isRecommended && (
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    {displayAmount === 0 ? (
                      <span className="text-lg font-bold text-foreground">Contact us</span>
                    ) : (
                      <>
                        <NumberFlow
                          format={{
                            style: "currency",
                            currency: plan.niscCurrency || "KES",
                            trailingZeroDisplay: "stripIfInteger",
                          }}
                          value={displayAmount}
                          className="text-lg font-bold text-foreground tabular-nums"
                        />
                        <span className="text-xs text-muted-foreground">
                          /{cycle === "YEARLY" ? "year" : "mo"}
                        </span>
                      </>
                    )}
                  </div>

                  <PlanFeatureChips chips={featureChips} extraCount={extraFeatureCount} />
                </div>

                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/35",
                  )}
                >
                  {isSelected && <Check className="size-3.5 text-primary-foreground" />}
                </div>
              </div>

              {isSelected && (
                <div
                  className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-muted-foreground">Billing period</span>
                  <Select
                    value={cycle}
                    onValueChange={(v: "MONTHLY" | "YEARLY" | "BIENNIALLY") =>
                      onPlanBillingCycleChange(plan.id, v)
                    }
                  >
                    <SelectTrigger className="h-8 w-[8.5rem] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                      <SelectItem value="BIENNIALLY">Every 2 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function planSelectionToUpsell(
  plan: PricingPlanRow,
  hostingType: HostingPlanType,
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY",
): SelectedHostingUpsell {
  const price = parseFloat(plan.niscPrice || "0");
  const monthly = monthlyFromPlanPrice(price, plan.billingCycle);
  const total = totalForCycle(monthly, billingCycle);
  return {
    hostingType,
    productId: plan.productId,
    productName: plan.productName,
    planId: plan.id,
    planName: plan.name,
    billingCycle,
    price: total,
    currency: plan.niscCurrency || "KES",
  };
}
