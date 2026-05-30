"use client";

import * as React from "react";
import { Check, Globe, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingTable } from "@/components/ui/pricing-table";
import { mapHostingPlansToPricingTable } from "@/components/pricing-table-wrapper";

export type HostingPlanType = "web" | "email";

export const DEFAULT_HOSTING_BILLING_CYCLE = "YEARLY" as const;
export const DEFAULT_HOSTING_BILLING_INTERVAL = "yearly" as const;

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

export type UpsellBrowseTarget = { hostingType: HostingPlanType };

export type SelectedServiceUpsell = {
  category: "hosting";
  hostingType: HostingPlanType;
  productId: string;
  productName: string;
  planId: string;
  planName: string;
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY";
  price: number;
  currency: string;
};

/** @deprecated Use SelectedServiceUpsell */
export type SelectedHostingUpsell = SelectedServiceUpsell;

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

/** Lowest yearly total (with 20% annual discount) across plans - for upsell card “from” pricing */
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

type HostingUpsellStepProps = {
  domainLabel?: string;
  selected: SelectedServiceUpsell[];
  webFromPrice: number | null;
  emailFromPrice: number | null;
  pricePeriodLabel?: string;
  isLoadingPrices?: boolean;
  onBrowseHostingPlans: (type: HostingPlanType) => void;
  onChangeHostingPlan: (type: HostingPlanType) => void;
  onRemoveHosting: (type: HostingPlanType) => void;
};

export function HostingUpsellStep({
  domainLabel,
  selected,
  webFromPrice,
  emailFromPrice,
  pricePeriodLabel = "/yr",
  isLoadingPrices = false,
  onBrowseHostingPlans,
  onChangeHostingPlan,
  onRemoveHosting,
}: HostingUpsellStepProps) {
  const webSelected = selected.find((p) => p.hostingType === "web");
  const emailSelected = selected.find((p) => p.hostingType === "email");

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
        <p className="text-sm font-medium text-foreground">Grow with your domain</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {domainLabel
            ? `Optional cloud hosting for ${domainLabel}. Skip any time - add later from your dashboard.`
            : "Add cloud hosting now, or continue without."}
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
          onBrowse={() => onBrowseHostingPlans("web")}
          onChange={() => onChangeHostingPlan("web")}
          onRemove={() => onRemoveHosting("web")}
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
          onBrowse={() => onBrowseHostingPlans("email")}
          onChange={() => onChangeHostingPlan("email")}
          onRemove={() => onRemoveHosting("email")}
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
  selected?: SelectedServiceUpsell;
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
  /** When set, used instead of hosting-specific title */
  selectionTitle?: string;
  planType?: HostingPlanType;
  domainLabel?: string;
  plans: PricingPlanRow[];
  productFeatures: ProductFeatureRow[];
  isLoading: boolean;
  selectedPlanId: string | null;
  billingInterval: "monthly" | "yearly";
  onSelectPlan: (planId: string) => void;
  onBillingIntervalChange: (interval: "monthly" | "yearly") => void;
};

export function HostingPlanSelectionStep({
  selectionTitle,
  planType,
  domainLabel,
  plans,
  productFeatures,
  isLoading,
  selectedPlanId,
  billingInterval,
  onSelectPlan,
  onBillingIntervalChange,
}: HostingPlanSelectionStepProps) {
  const title =
    selectionTitle ??
    (planType === "web" ? "Website hosting" : planType === "email" ? "Email hosting" : "Select a plan");

  const pricingPlans = React.useMemo(
    () => mapHostingPlansToPricingTable(plans, productFeatures),
    [plans, productFeatures],
  );

  const currency = plans[0]?.niscCurrency || "KES";

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (pricingPlans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No plans are available for this service right now.
      </div>
    );
  }

  const selectedLevel = selectedPlanId ?? "";

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {domainLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">
            For <span className="font-medium text-foreground">{domainLabel}</span>
          </p>
        )}
      </div>

      <PricingTable
        embedded
        hideBadges
        hideActionButton
        plans={pricingPlans}
        productFeatures={productFeatures.length > 0 ? productFeatures : undefined}
        selectedPlanLevel={selectedLevel}
        onSelectedPlanLevelChange={onSelectPlan}
        isYearly={billingInterval === "yearly"}
        onIsYearlyChange={(yearly) => onBillingIntervalChange(yearly ? "yearly" : "monthly")}
        currency={currency}
        locale="en-KE"
      />
    </div>
  );
}

export function planSelectionToUpsell(
  plan: PricingPlanRow,
  target: UpsellBrowseTarget,
  billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY",
): SelectedServiceUpsell {
  const price = parseFloat(plan.niscPrice || "0");
  const monthly = monthlyFromPlanPrice(price, plan.billingCycle);
  const total = totalForCycle(monthly, billingCycle);
  return {
    category: "hosting",
    hostingType: target.hostingType,
    productId: plan.productId,
    productName: plan.productName,
    planId: plan.id,
    planName: plan.name,
    billingCycle,
    price: total,
    currency: plan.niscCurrency || "KES",
  };
}
