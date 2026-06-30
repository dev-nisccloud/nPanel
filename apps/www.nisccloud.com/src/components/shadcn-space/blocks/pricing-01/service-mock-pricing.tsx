import ServicePricingCards from "@/components/shadcn-space/blocks/pricing-01/service-pricing-cards.tsx";
import { buildContactPlanUrl } from "@/lib/contact-plan-url.ts";
import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { motion } from "motion/react";

type ServiceAddon = {
  id: string;
  label: string;
  price: number;
  period: string;
};

const MOCK_FEATURE_COUNT = 6;

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

function normalizeFeatures(features: string[]): string[] {
  return features.slice(0, MOCK_FEATURE_COUNT);
}

function formatPlanPrice(plan: OrderPlan): { price: string; period: string } {
  const period =
    plan.period === "once"
      ? "/once"
      : plan.period === "mo" || plan.period === "month"
        ? "/month"
        : `/${plan.period}`;

  return {
    price: `KES ${plan.price.toLocaleString()}`,
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
) {
  const { price, period } = formatPlanPrice(plan);

  return {
    name: plan.name,
    description: PLAN_DESCRIPTIONS[index] ?? PLAN_DESCRIPTIONS[1],
    price,
    period,
    features: normalizeFeatures(plan.features),
    cta: "Get Started",
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
  const paidPlans = plans.filter((plan) => plan.price > 0 && plan.period !== "quote");
  const cardPlans = [
    ...paidPlans.map((plan, index) =>
      orderPlanToCardPlan(plan, index, serviceName, paidPlans.length),
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
                    KES {addon.price.toLocaleString()}/{addon.period}
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
