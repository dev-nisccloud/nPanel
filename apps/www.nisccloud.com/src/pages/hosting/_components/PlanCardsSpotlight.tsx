import { useState } from "react";
import { ArrowRight, Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { billingCycleToMonths, type BillingCycle } from "@/lib/billing-cycle.ts";
import { customTierEnquiryUrl, planTermPrice, type CustomTier } from "@/lib/plan-catalog.ts";
import {
  FAIR_USE_HREF,
  getFeatureIcon,
  inlineLabel,
  tileLabel,
  type PlanFeature,
  type PlanModel,
} from "./hosting-plan-model.ts";
import {
  convertStorefrontAmount,
  formatCurrency,
} from "@/lib/currency.ts";
import type { StorefrontCurrency } from "@/components/providers/currency.tsx";

type Props = {
  models: PlanModel[];
  cycle: BillingCycle;
  customTier?: CustomTier;
  pendingId: string | null;
  onChoose: (model: PlanModel) => void;
  currency: StorefrontCurrency;
  kesToCurrencyRate: number | null;
};

const RECOMMENDED_BADGE = "bg-brand-orange";

/** Features buyers compare first; the rest stay one click away. */
const SPEC_PRIORITY = [/ssl/i, /email/i, /database/i, /wordpress toolkit/i, /uptime/i, /support/i];
const VISIBLE_SPECS = 6;

function prioritiseSpecs(specs: PlanFeature[]): PlanFeature[] {
  const rank = (f: PlanFeature) => {
    const i = SPEC_PRIORITY.findIndex((re) => re.test(f.label));
    return i === -1 ? SPEC_PRIORITY.length : i;
  };
  return [...specs].sort((a, b) => rank(a) - rank(b));
}

function FairUseMark() {
  return <sup className="ml-0.5 font-normal text-muted-foreground">*</sup>;
}

function termWords(cycle: BillingCycle): { every: string; per: string } {
  const months = billingCycleToMonths(cycle);
  if (months === 1) return { every: "every month", per: "month" };
  if (months === 12) return { every: "every year", per: "year" };
  return { every: `every ${months / 12} years`, per: `${months / 12} years` };
}

function SpecTile({ feature, featured, wide }: { feature: PlanFeature; featured: boolean; wide: boolean }) {
  const Icon = getFeatureIcon(feature.key, feature.label);
  return (
    <div
      className={cn("rounded-xl border border-border/70 bg-muted/30 p-3 dark:bg-white/[0.03]", wide && "col-span-2")}
      title={feature.description}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", featured ? "text-brand-orange" : "text-primary")} />
        <span className="line-clamp-1 text-[11px] font-medium">{tileLabel(feature)}</span>
      </div>
      <p className="mt-1.5 text-base font-bold leading-tight tracking-tight text-foreground">
        {feature.value ?? <span className="text-muted-foreground/60">—</span>}
        {feature.fairUse ? <FairUseMark /> : null}
      </p>
    </div>
  );
}

function Tick({ featured }: { featured: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
        featured ? "bg-brand-orange/15 text-brand-orange" : "bg-primary/12 text-primary",
      )}
    >
      <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
    </span>
  );
}

function SpecLine({ feature, featured }: { feature: PlanFeature; featured: boolean }) {
  const listValue = feature.value && !feature.boolean && (/,/.test(feature.value) || !/^\d/.test(feature.value));
  return (
    <li className="flex items-start gap-2.5 text-[13px] leading-snug" title={feature.description}>
      <Tick featured={featured} />
      <span className="text-foreground/85">
        {feature.boolean ? (
          feature.label
        ) : listValue ? (
          <>
            {feature.label}: <span className="font-semibold text-foreground">{feature.value}</span>
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">{feature.value}</span> {inlineLabel(feature.label)}
          </>
        )}
        {feature.fairUse ? <FairUseMark /> : null}
      </span>
    </li>
  );
}

function PriceBlock({
  model,
  cycle,
  currency,
  kesToCurrencyRate,
}: {
  model: PlanModel;
  cycle: BillingCycle;
  currency: StorefrontCurrency;
  kesToCurrencyRate: number | null;
}) {
  const total = planTermPrice(model.plan.niscPrice, model.plan.billingCycle, cycle);
  if (total === 0) {
    return <p className="text-3xl font-extrabold tracking-tight text-foreground">Contact us</p>;
  }
  if (kesToCurrencyRate == null) {
    return <p className="text-sm text-muted-foreground">Updating price…</p>;
  }
  const sourceCurrency = model.plan.niscCurrency || "KES";
  const displayTotal = convertStorefrontAmount(
    total,
    sourceCurrency,
    currency,
    kesToCurrencyRate,
  );
  const months = billingCycleToMonths(cycle);
  const perMonth = months === 1 ? displayTotal : displayTotal / months;
  const { every, per } = termWords(cycle);
  return (
    <div>
      <p className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums">{formatCurrency(perMonth, currency)}</span>
        <span className="text-sm font-medium text-muted-foreground">/month</span>
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {months === 1 ? (
          <>Billed monthly · excl. 16% VAT</>
        ) : (
          <>
            <span className="font-semibold text-foreground tabular-nums">{formatCurrency(displayTotal, currency)}</span> billed {every} · excl.
            16% VAT
          </>
        )}
        {" "}<br />
        Renews at {formatCurrency(displayTotal, currency)}
        {months <= 12 ? `/${per}` : ` ${every}`}
      </p>
    </div>
  );
}

function SpotlightCard({
  model,
  cycle,
  pending,
  disabled,
  onChoose,
  currency,
  kesToCurrencyRate,
  showAllSpecs,
  onToggleSpecs,
}: {
  model: PlanModel;
  cycle: BillingCycle;
  pending: boolean;
  disabled: boolean;
  onChoose: () => void;
  currency: StorefrontCurrency;
  kesToCurrencyRate: number | null;
  showAllSpecs: boolean;
  onToggleSpecs: () => void;
}) {
  const { featured } = model;
  const specs = prioritiseSpecs(model.specs);
  const visibleSpecs = showAllSpecs ? specs : specs.slice(0, VISIBLE_SPECS);
  const hiddenCount = specs.length - VISIBLE_SPECS;
  const priced = planTermPrice(model.plan.niscPrice, model.plan.billingCycle, cycle) > 0;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-card p-6 transition-shadow duration-300",
        featured
          ? "border-primary/60 shadow-xl shadow-primary/10 ring-1 ring-primary/30 dark:shadow-primary/5"
          : "border-border hover:border-primary/35 hover:shadow-lg",
      )}
    >
      {featured ? (
        <span
          className={cn(
            "absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-950 shadow-md shadow-brand-orange/25",
            RECOMMENDED_BADGE,
          )}
        >
          Recommended
        </span>
      ) : null}

      <header>
        <h3 className="text-xl font-bold tracking-tight">{model.displayName}</h3>
        {model.audience ? <p className="mt-1 min-h-10 text-sm text-muted-foreground">{model.audience}</p> : null}
      </header>

      <div className="mt-5">
        <PriceBlock
          model={model}
          cycle={cycle}
          currency={currency}
          kesToCurrencyRate={kesToCurrencyRate}
        />
      </div>

      <Button
        size="lg"
        onClick={onChoose}
        disabled={disabled || (priced && kesToCurrencyRate == null)}
        variant={featured ? "default" : "outline"}
        className={cn(
          "mt-5 w-full gap-2 font-semibold",
          featured ? "shadow-md shadow-primary/25" : "border-primary/40 text-primary hover:bg-primary/5 hover:text-primary",
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Opening checkout…" : priced ? `Choose ${model.displayName}` : "Ask about this plan"}
        {!pending ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>

      {model.headline.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-2">
          {model.headline.map((f, i) => (
            <SpecTile
              key={f.key}
              feature={f}
              featured={featured}
              wide={model.headline.length % 2 === 1 && i === model.headline.length - 1}
            />
          ))}
        </div>
      ) : null}

      {specs.length > 0 ? (
        <div className="mt-6 flex flex-1 flex-col border-t border-border/70 pt-5">
          <ul className="space-y-2">
            {visibleSpecs.map((f) => (
              <SpecLine key={f.key} feature={f} featured={featured} />
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <button
              type="button"
              aria-expanded={showAllSpecs}
              onClick={onToggleSpecs}
              className="mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-primary"
            >
              {showAllSpecs ? "Show fewer features" : `See all features (${hiddenCount} more)`}
              <ChevronDown
                className={cn("size-4 transition-transform", showAllSpecs && "rotate-180")}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </article>
  );
}

function CustomTierCard({ tier }: { tier: CustomTier }) {
  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-white dark:border-white/10 dark:bg-neutral-900">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-primary">
        <Building2 className="h-4.5 w-4.5" />
      </span>
      <header className="mt-4">
        <h3 className="text-xl font-bold tracking-tight">{tier.name}</h3>
        <p className="mt-1 min-h-10 text-sm text-white/65">{tier.audience}</p>
      </header>
      <div className="mt-5">
        <p className="text-3xl font-extrabold tracking-tight">Custom pricing</p>
        <p className="mt-1.5 text-xs leading-relaxed text-white/60">
          Quoted to your requirements
          {" "}<br />
          No obligation until you accept the proposal
        </p>
      </div>
      <Button asChild size="lg" className="mt-5 w-full gap-2 bg-white font-semibold text-neutral-950 hover:bg-white/90">
        <a href={customTierEnquiryUrl(tier)}>
          Talk to Sales
          <ArrowRight className="h-4 w-4" />
        </a>
      </Button>
      <ul className="mt-6 flex-1 space-y-2.5 border-t border-white/10 pt-5">
        {tier.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/85">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
            </span>
            {point}
          </li>
        ))}
      </ul>
      <a
        href={customTierEnquiryUrl(tier)}
        className="mt-6 text-center text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
      >
        Request a proposal
      </a>
    </article>
  );
}

export function PlanCardsSpotlight({
  models,
  cycle,
  customTier,
  pendingId,
  onChoose,
  currency,
  kesToCurrencyRate,
}: Props) {
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const anyFairUse = models.some((m) => m.features.some((f) => f.fairUse));
  const count = models.length + (customTier ? 1 : 0);
  return (
    <div className="@container">
      <div
        className={cn(
          "grid grid-cols-1 gap-6 pt-3 @2xl:grid-cols-2",
          count >= 4 ? "@6xl:grid-cols-4" : "@4xl:grid-cols-3",
          count === 3 && "mx-auto max-w-6xl",
        )}
      >
        {models.map((model) => (
          <SpotlightCard
            key={model.plan.id}
            model={model}
            cycle={cycle}
            pending={pendingId === model.plan.id}
            disabled={pendingId !== null}
            onChoose={() => onChoose(model)}
            currency={currency}
            kesToCurrencyRate={kesToCurrencyRate}
            showAllSpecs={showAllSpecs}
            onToggleSpecs={() => setShowAllSpecs((value) => !value)}
          />
        ))}
        {customTier ? <CustomTierCard tier={customTier} /> : null}
      </div>
      {anyFairUse ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          * Unlimited allowances are subject to the{" "}
          <a href={FAIR_USE_HREF} className="underline hover:text-foreground">
            Acceptable Use Policy
          </a>{" "}
          in our Terms of Service, which prohibits excessive, unreasonable strain on shared
          infrastructure.
        </p>
      ) : null}
    </div>
  );
}
