"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type PlanFeatureDisplay = {
  key: string;
  label: string;
  description?: string;
  available: boolean;
  value?: string | null;
};

export type CatalogPlanOption = {
  id: string;
  name: string;
  price?: string | null;
  currency?: string | null;
  billingCycle?: string | null;
  description?: string | null;
  features?: PlanFeatureDisplay[];
  badge?: string | null;
};

export function resolvePlanFeatureDisplay(
  productFeatures: Array<{ key?: string; label?: string; description?: string }> | unknown,
  planFeatures: Array<{ key?: string; available?: boolean; valueOverride?: string | null }> | unknown,
): PlanFeatureDisplay[] {
  const catalog = Array.isArray(productFeatures) ? productFeatures : [];
  const declared = Array.isArray(planFeatures) ? planFeatures : [];
  const byKey = new Map(
    declared
      .filter((feature): feature is { key: string; available?: boolean; valueOverride?: string | null } =>
        Boolean(feature && typeof feature === "object" && typeof feature.key === "string"),
      )
      .map((feature) => [feature.key, feature]),
  );

  return catalog
    .filter((feature): feature is { key: string; label: string; description?: string } =>
      Boolean(
        feature &&
          typeof feature === "object" &&
          typeof feature.key === "string" &&
          typeof feature.label === "string",
      ),
    )
    .map((feature) => {
      const match = byKey.get(feature.key);
      return {
        key: feature.key,
        label: feature.label,
        description: feature.description,
        available: Boolean(match?.available),
        value: match?.valueOverride ?? null,
      };
    });
}

export function PlanOptionWithFeatures({
  plan,
  selected,
  onSelect,
  disabled,
  priceLabel,
  children,
}: {
  plan: CatalogPlanOption;
  selected: boolean;
  onSelect: (planId: string) => void;
  disabled?: boolean;
  priceLabel?: string;
  children?: React.ReactNode;
}) {
  const [featuresOpen, setFeaturesOpen] = React.useState(false);
  const features = plan.features ?? [];

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all",
        selected ? "border-primary bg-primary/5" : "border-border/80 bg-card",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(plan.id)}
        className="flex w-full items-start gap-3 p-3.5 text-left disabled:opacity-60"
      >
        <div
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            selected ? "border-primary bg-primary" : "border-muted-foreground/40",
          )}
        >
          {selected ? <Check className="h-3 w-3 text-primary-foreground" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{plan.name}</span>
            {plan.badge ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {plan.badge}
              </span>
            ) : null}
          </div>
          {priceLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">{priceLabel}</p>
          ) : null}
          {plan.description ? (
            <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
          ) : null}
        </div>
      </button>

      {children}

      {features.length > 0 ? (
        <Collapsible open={featuresOpen} onOpenChange={setFeaturesOpen} className="px-3.5 pb-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <span>{featuresOpen ? "Hide features" : "View features"}</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", featuresOpen && "rotate-180")}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
              {features.map((feature) => (
                <li key={feature.key} className="flex items-start gap-2 text-xs">
                  {feature.available ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  ) : (
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={cn(!feature.available && "text-muted-foreground")}>
                    {feature.label}
                    {feature.value ? `: ${feature.value}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
