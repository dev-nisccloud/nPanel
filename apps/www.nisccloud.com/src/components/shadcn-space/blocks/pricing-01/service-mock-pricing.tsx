import ServicePricingCards from "@/components/shadcn-space/blocks/pricing-01/service-pricing-cards.tsx";
import { buildContactPlanUrl } from "@/lib/contact-plan-url.ts";
import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { motion } from "motion/react";
import { useCurrency } from "@/components/providers/currency.tsx";
import { convertKesForDisplay, formatCurrency } from "@/lib/currency.ts";

type ServiceAddon = {
  id: string;
  label: string;
  price: number;
  period: string;
};

const PLAN_DESCRIPTIONS = [
  "Perfect for businesses getting started.",
  "For growing teams that need more power and support.",
];

const CUSTOM_QUOTE_FEATURES = [
  "Fully bespoke scope & deliverables",
  "Dedicated account strategist",
  "Multi-brand or multi-site support",
  "Priority timeline & onboarding",
  "Custom integrations & workflows",
  "Flexible billing & contract terms",
];

/** Replaces "Everything in <Plan>" with that plan's own list so every card states its full specification. */
function expandFeatures(plan: OrderPlan, all: OrderPlan[], seen: Set<string> = new Set()): string[] {
  seen.add(plan.id);
  return plan.features.flatMap((feature) => {
    const match = feature.match(/^Everything in (.+)$/i);
    const ref = match?.[1].trim().toLowerCase();
    const base = ref
      ? all.find((p) => p.name.toLowerCase() === ref) ?? all.find((p) => p.name.toLowerCase().endsWith(` ${ref}`))
      : undefined;
    if (!base || seen.has(base.id)) return [feature];
    return expandFeatures(base, all, seen);
  });
}

function formatPlanPrice(
  plan: OrderPlan,
  displayPrice: (amount: number) => string,
): { price: string; period: string } {
  const period =
    plan.period === "once"
      ? "one-time"
      : plan.period === "mo" || plan.period === "month"
        ? "/month"
        : `/${plan.period}`;

  return {
    price: displayPrice(plan.price),
    period,
  };
}

function buildCustomQuotePlan(serviceName: string) {
  return {
    name: "Custom Quote",
    description: "For organizations with advanced or unique requirements.",
    price: "Custom",
    period: "",
    features: CUSTOM_QUOTE_FEATURES,
    cta: "Contact Sales",
    fullWidth: true,
    onSelect: () => {
      window.location.href = buildContactPlanUrl({
        serviceName,
        planName: "Custom Quote",
        planPrice: 0,
        planPeriod: "quote",
      });
    },
  };
}

function orderPlanToCardPlan(
  plan: OrderPlan,
  index: number,
  serviceName: string,
  totalPaidPlans: number,
  allPlans: OrderPlan[],
  displayPrice: (amount: number) => string,
) {
  const { price, period } = formatPlanPrice(plan, displayPrice);

  return {
    name: plan.name,
    description: PLAN_DESCRIPTIONS[index] ?? PLAN_DESCRIPTIONS[1],
    price,
    period,
    features: [...new Set(expandFeatures(plan, allPlans))],
    cta: `Choose ${plan.name}`,
    highlighted: totalPaidPlans > 1 && index === 1,
    onSelect: () => {
      window.location.href = buildContactPlanUrl({
        serviceName,
        planName: plan.name,
        planPrice: plan.price,
        planPeriod: plan.period,
      });
    },
  };
}

export function ServiceMockPricingSection({
  plans,
  serviceName,
  title = "Simple, Transparent Pricing",
  subtitle,
  pricingNote,
  addons = [],
}: {
  plans: OrderPlan[];
  serviceName: string;
  title?: string;
  subtitle?: string;
  pricingNote?: string;
  addons?: ServiceAddon[];
}) {
  const { currency, kesToCurrencyRate } = useCurrency();
  const displayPrice = (amount: number) =>
    kesToCurrencyRate == null
      ? "Updating…"
      : formatCurrency(
          convertKesForDisplay(amount, currency, kesToCurrencyRate),
          currency,
        );
  const paidPlans = plans.filter((plan) => plan.price > 0 && plan.period !== "quote");
  const cardPlans = [
    ...paidPlans.map((plan, index) =>
      orderPlanToCardPlan(
        plan,
        index,
        serviceName,
        paidPlans.length,
        plans,
        displayPrice,
      ),
    ),
    buildCustomQuotePlan(serviceName),
  ];

  return (
    <div>
      <ServicePricingCards
        title={title}
        subtitle={
          subtitle ??
          pricingNote ??
          "Choose the plan that fits your needs. All plans include onboarding support."
        }
        plans={cardPlans}
      />
      {addons.length > 0 ? (
        <div className="mx-auto max-w-5xl px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl"
          >
            <p className="mb-4 flex items-center justify-center gap-2 text-center text-sm font-medium text-muted-foreground">
              <Sparkles size={14} className="text-primary" />
              Optional Add-ons
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3.5 text-sm hover:border-primary/30"
                >
                  <span className="font-medium">{addon.label}</span>
                  <Badge variant="secondary" className="font-semibold">
                    {displayPrice(addon.price)}/{addon.period}
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
