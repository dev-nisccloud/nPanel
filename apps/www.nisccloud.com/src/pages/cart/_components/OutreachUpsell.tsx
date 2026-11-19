import * as React from "react";
import { Check } from "lucide-react";
import { ServiceIcon } from "./service-icon.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { convertStorefrontAmount, formatCurrency } from "@/lib/currency.ts";
import { fetchEmailMarketingPlansPublic, type SharedHostingPricingData } from "@/lib/vps-plans-api.ts";
import type { StorefrontCurrency } from "@/components/providers/currency.tsx";
import {
  billingCycleShortSuffix,
  billingCycleToMonths,
  SERVICE_BILLING_CYCLES,
  type BillingCycle,
} from "@/lib/billing-cycle.ts";

export interface SelectedOutreachPlan {
  planId: string;
  name: string;
  monthlyPrice: number;
  currency: string;
}

interface OutreachUpsellProps {
  selectedPlanId: string | null;
  onSelect: (plan: SelectedOutreachPlan | null) => void;
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  currency: StorefrontCurrency;
  kesToDisplayRate: number;
  /** The plan the order summary can add in one click. */
  onRecommendedReady?: (plan: SelectedOutreachPlan) => void;
}

function featureValue(data: SharedHostingPricingData, planIndex: number, key: string): string | null {
  const featureIndex = data.productFeatures.findIndex((f) => f.key === key);
  if (featureIndex < 0) return null;
  const value = data.plans[planIndex]?.featureValues[featureIndex];
  return value?.available ? value.valueOverride : null;
}

function termPrice(monthly: number, cycle: BillingCycle): number {
  return monthly * billingCycleToMonths(cycle);
}

export function OutreachUpsell({
  selectedPlanId,
  onSelect,
  billingCycle,
  onBillingCycleChange,
  currency,
  kesToDisplayRate,
  onRecommendedReady,
}: OutreachUpsellProps) {
  const [data, setData] = React.useState<SharedHostingPricingData | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetchEmailMarketingPlansPublic()
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const plans = React.useMemo(
    () =>
      (data?.plans ?? [])
        .map((plan, index) => ({ plan, index, price: Number.parseFloat(plan.niscPrice ?? "") }))
        .filter(({ price }) => Number.isFinite(price) && price > 0),
    [data],
  );

  React.useEffect(() => {
    const pick = plans.find((entry) => entry.plan.isPopular) ?? plans[0];
    if (!pick) return;
    onRecommendedReady?.({
      planId: pick.plan.id,
      name: `Nisc Outreach · ${pick.plan.name}`,
      monthlyPrice: pick.price,
      currency: pick.plan.niscCurrency,
    });
  }, [plans, onRecommendedReady]);

  if (failed || (data && plans.length === 0)) return null;

  return (
    <section
      aria-labelledby="cart-outreach-addon-heading"
      className="bg-card border border-border rounded-2xl p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <ServiceIcon serviceType="email_marketing" size="md" />
        <div className="min-w-0">
          <p className="type-label text-primary">Optional add-on</p>
          <h2 id="cart-outreach-addon-heading" className="mt-1 text-lg font-semibold leading-snug text-foreground">
            Add Nisc Outreach
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Agentic email marketing. Outreach fetches your brand kit and logo from your domain, then designs, sends and tracks your campaigns in nPanel. Billed as its own subscription.
          </p>
        </div>
      </div>

      {!data ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[112px] animate-pulse rounded-xl bg-muted/60 motion-reduce:animate-none" />
          ))}
        </div>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {plans.map(({ plan, index, price }) => {
            const isSelected = selectedPlanId === plan.id;
            const contacts = featureValue(data, index, "contacts");
            const emails = featureValue(data, index, "emails_per_month");
            const display = formatCurrency(
              convertStorefrontAmount(termPrice(price, billingCycle), plan.niscCurrency, currency, kesToDisplayRate),
              currency,
            );
            return (
              <li key={plan.id} className="min-w-0">
                <div
                  className={cn(
                    "relative flex h-full w-full flex-col rounded-xl border p-3.5 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                      : "border-border",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                    {isSelected ? (
                      <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5" />
                      </span>
                    ) : plan.isPopular ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Popular</span>
                    ) : null}
                  </span>
                  <span className="mt-2 text-base font-bold tabular-nums text-foreground">
                    {display}
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      /{billingCycleShortSuffix(billingCycle)}
                    </span>
                  </span>
                  {(contacts || emails) && (
                    <span className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {contacts ? `Up to ${contacts} contacts in your list` : null}
                      {contacts && emails ? <br /> : null}
                      {emails ? `${emails} emails sent a month` : null}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={isSelected}
                    onClick={() =>
                      onSelect(
                        isSelected
                          ? null
                          : { planId: plan.id, name: `Nisc Outreach · ${plan.name}`, monthlyPrice: price, currency: plan.niscCurrency },
                      )
                    }
                    className={cn(
                      "mt-3 h-8 min-h-0 w-fit rounded-full px-3 text-xs",
                      isSelected
                        ? "border-transparent text-muted-foreground hover:text-destructive"
                        : "border-primary/40 text-primary hover:bg-primary/10",
                    )}
                  >
                    {isSelected ? "Remove" : "Add to cart"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4">
        <p id="cart-outreach-term-label" className="text-sm font-semibold text-foreground">
          Billing term
        </p>
        <div
          role="radiogroup"
          aria-labelledby="cart-outreach-term-label"
          className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {SERVICE_BILLING_CYCLES.map((option) => {
            const selected = billingCycle === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onBillingCycleChange(option.value)}
                className={cn(
                  "flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  selected
                    ? "border-primary bg-primary/[0.07] text-foreground ring-1 ring-primary"
                    : "border-border text-foreground hover:border-primary/50",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
