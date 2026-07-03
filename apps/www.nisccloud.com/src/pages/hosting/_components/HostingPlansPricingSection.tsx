import * as React from "react";
import {
  Globe,
  HardDrive,
  Mail,
  MapPin,
  Network,
  Server,
  ShieldCheck,
  Database,
  Zap,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildSharedHostingCartParams,
  navigateToStorefrontCart,
} from "@/lib/storefront-cart-url.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import type {
  SharedHostingPlan,
  ProductFeatureRow,
  SharedHostingPricingData,
} from "@/lib/vps-plans-api.ts";

export type HostingPlanFallbackFeature = {
  label: string;
  value: string;
  description: string;
};

export type HostingPlansPricingConfig = {
  sectionId?: string;
  title: string;
  description: string;
  serviceType: string;
  fetchPlans: () => Promise<SharedHostingPricingData>;
  planIcon: LucideIcon;
  locationLabel?: string;
  highlightBadge: string;
  fallbackFeatures: HostingPlanFallbackFeature[];
};

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

function getFeatureIcon(label: string): LucideIcon {
  const value = label.toLowerCase();
  if (value.includes("website") || value.includes("domain") || value.includes("site")) return Globe;
  if (value.includes("storage") || value.includes("disk") || value.includes("nvme")) return HardDrive;
  if (value.includes("bandwidth") || value.includes("traffic")) return Network;
  if (value.includes("email") || value.includes("mailbox")) return Mail;
  if (value.includes("ssl") || value.includes("security") || value.includes("malware")) return ShieldCheck;
  if (value.includes("backup")) return Database;
  if (value.includes("cpanel") || value.includes("panel")) return Server;
  if (value.includes("wordpress") || value.includes("staging") || value.includes("cache")) return Zap;
  return Zap;
}

function getFeatureDisplay(plan: SharedHostingPlan, featureIndex: number): string | null {
  const cell = plan.featureValues?.[featureIndex];
  if (!cell?.available) return null;
  if (cell.valueOverride != null && cell.valueOverride !== "") return cell.valueOverride;
  return "Included";
}

function FeatureRow({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  const Icon = getFeatureIcon(label);

  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {description ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`More info about ${label}`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-sm">
                {description}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <p className="font-semibold text-primary">{value}</p>
      </div>
    </div>
  );
}

function HostingPlanCard({
  plan,
  productFeatures,
  isYearly,
  config,
}: {
  plan: SharedHostingPlan;
  productFeatures: ProductFeatureRow[];
  isYearly: boolean;
  config: HostingPlansPricingConfig;
}) {
  const PlanIcon = config.planIcon;
  const price = derivePricing(plan.niscPrice, plan.billingCycle);
  const displayPrice = isYearly ? price.yearly : price.monthly;
  const visibleFeatures = productFeatures
    .map((feature, index) => ({
      feature,
      value: getFeatureDisplay(plan, index),
    }))
    .filter((entry) => entry.value != null);

  const handleGetStarted = async () => {
    if (displayPrice === 0) {
      window.location.href = "/contact";
      return;
    }

    try {
      await navigateToStorefrontCart(
        buildSharedHostingCartParams(plan, config.serviceType, isYearly),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open checkout.");
    }
  };

  return (
    <Card className="group flex h-full flex-col transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
            <PlanIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col items-end gap-2">
            {plan.isPopular && <Badge variant="secondary">Popular</Badge>}
            {plan.isRecommended && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                Recommended
              </Badge>
            )}
            <Badge variant="default" className="text-[10px] uppercase">
              Available
            </Badge>
          </div>
        </div>

        <CardTitle className="line-clamp-2 text-base font-semibold" title={plan.name}>
          {plan.name}
        </CardTitle>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Server location
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <p className="line-clamp-1 text-sm font-semibold">
                {config.locationLabel ?? "Nairobi, Kenya"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary text-primary">
            {config.highlightBadge}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plan includes
            </p>
            <ScrollArea className="h-[220px] w-full">
              <div className="flex flex-col gap-3 pr-3 text-sm">
                {visibleFeatures.length > 0
                  ? visibleFeatures.map(({ feature, value }) => (
                      <FeatureRow
                        key={feature.key}
                        label={feature.label}
                        value={value!}
                        description={feature.description}
                      />
                    ))
                  : config.fallbackFeatures.map((feature) => (
                      <FeatureRow
                        key={feature.label}
                        label={feature.label}
                        value={feature.value}
                        description={feature.description}
                      />
                    ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="mt-auto rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</p>
          <div className="mt-1 flex flex-col gap-0.5">
            {displayPrice === 0 ? (
              <p className="text-xl font-bold leading-tight text-primary">Contact us</p>
            ) : (
              <p className="text-xl font-bold leading-tight text-primary">
                {formatKes(displayPrice)}
                <span className="ml-1 align-super text-xs font-semibold text-muted-foreground">
                  /{isYearly ? "yr" : "mo"}
                </span>
              </p>
            )}
            {isYearly && displayPrice > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatKes(price.monthly)} equivalent per month
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-1">
          <Button
            className="w-full bg-primary text-primary-foreground"
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="mb-2 flex justify-between">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="mt-auto h-20 w-full rounded-lg" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function HostingPlansPricingSection({
  config,
}: {
  config: HostingPlansPricingConfig;
}) {
  const [plans, setPlans] = React.useState<SharedHostingPlan[]>([]);
  const [productFeatures, setProductFeatures] = React.useState<ProductFeatureRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isYearly, setIsYearly] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    config
      .fetchPlans()
      .then((data) => {
        if (!active) return;
        setPlans(data.plans);
        setProductFeatures(data.productFeatures);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load plans");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [config.serviceType, config.fetchPlans]);

  return (
    <TooltipProvider>
      <section id={config.sectionId ?? "plans"} className="bg-muted/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">{config.title}</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{config.description}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mx-auto mb-8 max-w-2xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && plans.length > 0 && (
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/80 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsYearly(false)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    !isYearly
                      ? "border border-border/60 bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setIsYearly(true)}
                  className={[
                    "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    isYearly
                      ? "border border-border/60 bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  Yearly
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <PlanSkeleton key={index} />)
            ) : plans.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 py-12">
                <p className="mb-4 text-muted-foreground">No plans available at this time.</p>
                <Button asChild variant="outline">
                  <a href="/contact">Contact Us</a>
                </Button>
              </div>
            ) : (
              plans.map((plan) => (
                <HostingPlanCard
                  key={plan.id}
                  plan={plan}
                  productFeatures={productFeatures}
                  isYearly={isYearly}
                  config={config}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
