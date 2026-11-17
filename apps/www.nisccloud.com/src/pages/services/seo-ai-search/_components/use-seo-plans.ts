import * as React from "react";
import { fetchSeoPlansPublic, type SharedHostingPlan } from "@/lib/vps-plans-api.ts";
import { planTermPrice } from "@/lib/plan-catalog.ts";
import { SEO_PLANS, STANDARD_PLAN_KEYS } from "@/lib/seo-ai-search.ts";

export type LiveRow = { label: string; value: string; available: boolean };

export type LiveSeoPlan = {
  key: (typeof STANDARD_PLAN_KEYS)[number];
  plan: SharedHostingPlan;
  monthlyPrice: number;
  rows: LiveRow[];
  /** Short list for the card. The full scope stays in `rows`. */
  inclusions: string[];
};

function cardInclusions(plan: SharedHostingPlan, rows: LiveRow[]): string[] {
  const highlights = (plan.highlights ?? []).map((item) => item.trim()).filter(Boolean);
  if (highlights.length > 0) return highlights.slice(0, 6);
  return rows
    .filter((row) => row.available)
    .slice(0, 5)
    .map((row) => (row.value === "Included" ? row.label : `${row.label}: ${row.value}`));
}

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; plans: LiveSeoPlan[]; featureLabels: string[] };

/** Search Essentials and Search Growth as priced and scoped in nPanel. */
export function useSeoPlans() {
  const [state, setState] = React.useState<State>({ status: "loading" });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    fetchSeoPlansPublic()
      .then((data) => {
        if (!active) return;
        const plans = STANDARD_PLAN_KEYS.flatMap((key) => {
          const plan = data.plans.find((p) => p.id === SEO_PLANS[key].planId);
          if (!plan) return [];
          const price = planTermPrice(plan.niscPrice, plan.billingCycle, "MONTHLY");
          if (price <= 0) return [];
          const rows = data.productFeatures.map((feature, i) => {
            const value = plan.featureValues[i];
            const available = Boolean(value?.available);
            return {
              label: feature.label,
              available,
              value: !available ? "Not included" : value?.valueOverride?.trim() || "Included",
            };
          });
          return [{ key, plan, monthlyPrice: price, rows, inclusions: cardInclusions(plan, rows) }];
        });
        setState(
          plans.length === STANDARD_PLAN_KEYS.length
            ? { status: "ready", plans, featureLabels: data.productFeatures.map((f) => f.label) }
            : { status: "error" },
        );
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = React.useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
