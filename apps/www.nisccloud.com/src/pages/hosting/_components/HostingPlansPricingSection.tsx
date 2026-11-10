import * as React from "react";
import { CreditCard, Headphones, Lock, ReceiptText, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  buildSharedHostingCartParams,
  navigateToStorefrontCart,
} from "@/lib/storefront-cart-url.ts";
import { buildContactPlanUrl } from "@/lib/contact-plan-url.ts";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import type {
  SharedHostingPlan,
  ProductFeatureRow,
  SharedHostingPricingData,
} from "@/lib/vps-plans-api.ts";
import { billingCyclesFor, type BillingCycle } from "@/lib/billing-cycle.ts";
import { CUSTOM_TIERS, isPlanListed } from "@/lib/plan-catalog.ts";
import { trackEvent } from "@/lib/track.ts";
import { BillingCycleSelector } from "@/components/pricing/BillingCycleSelector.tsx";
import { buildPlanModels, normaliseProductDescription, type PlanModel } from "./hosting-plan-model.ts";
import { PlanCardsSpotlight } from "./PlanCardsSpotlight.tsx";

export type HostingPlanFallbackFeature = {
  label: string;
  value: string;
  description: string;
};

export type HostingPlansPricingConfig = {
  sectionId?: string;
  title: string;
  serviceType: string;
  fetchPlans: () => Promise<SharedHostingPricingData>;
  fallbackFeatures: HostingPlanFallbackFeature[];
  /** Fixed section intro; when omitted the product description from nPanel is shown. */
  description?: string;
  /** Plans without a price open the contact form pre-filled with this service name. */
  contactServiceName?: string;
};

function fallbackProductFeatures(config: HostingPlansPricingConfig): ProductFeatureRow[] {
  return config.fallbackFeatures.map((f, i) => ({ key: `fallback_${i}`, label: f.label, description: f.description }));
}

function withFallbackValues(plans: SharedHostingPlan[], config: HostingPlansPricingConfig): SharedHostingPlan[] {
  return plans.map((p) => ({
    ...p,
    featureValues: config.fallbackFeatures.map((f) => ({ available: true, valueOverride: f.value })),
  }));
}

function TrustRow({ freeSsl }: { freeSsl: boolean }) {
  const items: { icon: LucideIcon; text: string }[] = [
    ...(freeSsl ? [{ icon: Lock, text: "Free SSL on every plan" }] : []),
    { icon: Headphones, text: "24/7 ticket support · email, chat and phone during working hours" },
    { icon: CreditCard, text: "Pay with M-Pesa or card" },
    { icon: ReceiptText, text: "Prices in KES, excluding 16% VAT" },
  ];
  return (
    <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {text}
        </li>
      ))}
    </ul>
  );
}

function PlanSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-11 w-full" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((__, j) => (
              <Skeleton key={j} className="h-14 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-28 w-full" />
        </div>
      ))}
    </div>
  );
}

export function HostingPlansPricingSection({
  config,
}: {
  config: HostingPlansPricingConfig;
}) {
  const [plans, setPlans] = React.useState<SharedHostingPlan[]>([]);
  const [productFeatures, setProductFeatures] = React.useState<ProductFeatureRow[]>([]);
  const [productDescription, setProductDescription] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [slow, setSlow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [requestKey, setRequestKey] = React.useState(0);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const cycleOptions = billingCyclesFor(config.serviceType);
  const [cycle, setCycle] = React.useState<BillingCycle>("MONTHLY");
  const customTier = CUSTOM_TIERS[config.serviceType];

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setSlow(false);
    setError(null);
    config
      .fetchPlans()
      .then((data) => {
        if (!active) return;
        setPlans(data.plans.filter(isPlanListed));
        setProductFeatures(data.productFeatures);
        setProductDescription(normaliseProductDescription(data.description?.trim() || null));
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
  }, [config.serviceType, config.fetchPlans, requestKey]);

  React.useEffect(() => {
    if (!loading) return;
    const id = window.setTimeout(() => setSlow(true), 4_000);
    return () => window.clearTimeout(id);
  }, [loading, requestKey]);

  React.useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) setPendingId(null);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const models = React.useMemo(() => {
    if (plans.length === 0) return [];
    return productFeatures.length > 0
      ? buildPlanModels(plans, productFeatures)
      : buildPlanModels(withFallbackValues(plans, config), fallbackProductFeatures(config));
  }, [plans, productFeatures, config]);

  const freeSsl =
    models.length > 0 && models.every((m) => m.features.some((f) => f.key === "free_ssl" && f.value));

  const intro = config.description ?? productDescription;

  const changeCycle = (next: BillingCycle) => {
    setCycle(next);
    trackEvent("pricing_cycle_change", { service_type: config.serviceType, billing_cycle: next });
  };

  const handleChoose = async (model: PlanModel) => {
    if (model.monthlyPrice === 0) {
      window.location.href = config.contactServiceName
        ? buildContactPlanUrl({ serviceName: config.contactServiceName, planName: model.displayName, planPrice: 0, planPeriod: "month" })
        : "/contact";
      return;
    }
    setPendingId(model.plan.id);
    try {
      await navigateToStorefrontCart(buildSharedHostingCartParams(model.plan, config.serviceType, cycle));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open checkout.");
      setPendingId(null);
    }
  };

  return (
    <section id={config.sectionId ?? "plans"} className="bg-muted/10 py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col items-center gap-2 text-center">
          <h2 className="text-[36px] font-extrabold leading-[1.15] tracking-tight">{config.title}</h2>
          {intro ? (
            <p className="mx-auto max-w-2xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{intro}</p>
          ) : loading ? (
            <Skeleton className="h-5 w-full max-w-xl" />
          ) : null}
        </div>

        {loading ? (
          <>
            <p className="sr-only" aria-live="polite">
              Loading current prices
            </p>
            {slow ? (
              <p className="mb-6 text-center text-sm text-muted-foreground" role="status">
                Still loading current prices from our billing system…
              </p>
            ) : null}
            <PlanSkeleton />
          </>
        ) : error ? (
          <Alert variant="destructive" className="mx-auto max-w-2xl">
            <AlertDescription>
              <p>We could not load current prices.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" onClick={() => setRequestKey((key) => key + 1)}>
                  Try again
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Contact sales</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : models.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 py-12">
            <p className="mb-4 text-muted-foreground">
              These plans are being updated. Contact us for current options.
            </p>
            <Button asChild variant="outline">
              <Link to="/contact">Contact sales</Link>
            </Button>
          </div>
        ) : (
          <>
            {cycleOptions.length > 1 ? (
              <div className="mb-8 flex flex-col items-center gap-2">
                <BillingCycleSelector options={cycleOptions} value={cycle} onChange={changeCycle} />
                <p className="text-xs text-muted-foreground">The same monthly rate applies on every term. Pay monthly or up front.</p>
              </div>
            ) : null}
            <PlanCardsSpotlight
              models={models}
              cycle={cycle}
              customTier={customTier}
              pendingId={pendingId}
              onChoose={handleChoose}
            />
            <TrustRow freeSsl={freeSsl} />
          </>
        )}
      </div>
    </section>
  );
}
