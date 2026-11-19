import * as React from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import {
  ENTERPRISE_COMPARISON,
  ENTERPRISE_KEY_INCLUSIONS,
  ENTERPRISE_SCOPE,
  SCOPE_DEFINITIONS,
  SEO_PLANS,
  SEO_POLICY,
  type PlanKey,
} from "@/lib/seo-ai-search.ts";
import { ENTERPRISE_BUTTON, ENTERPRISE_CARD, ENTERPRISE_MUTED, EnterpriseBadge, EnterpriseGlow, EnterpriseTick } from "@/components/enterprise-tier.tsx";
import { type LiveSeoPlan, type useSeoPlans } from "./use-seo-plans.ts";
import { useDisplayPrice } from "./use-display-price.ts";

type PlansState = ReturnType<typeof useSeoPlans>["state"];

function Disclosure({ id, label, onDark, children }: { id: string; label: string; onDark?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("mt-5 border-t pt-3", onDark ? "border-white/15" : "border-border")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          onDark ? "text-white" : "text-foreground",
        )}
      >
        {label}
        <ChevronDown className={cn("size-4 shrink-0 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
      </button>
      <div id={id} hidden={!open} className="pt-2">
        {children}
      </div>
    </div>
  );
}

function DetailList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-border/70 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 py-2">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PlanCard({
  planKey,
  price,
  inclusions,
  detail,
  matched,
  cta,
  onSelect,
}: {
  planKey: PlanKey;
  price: React.ReactNode;
  inclusions: string[];
  detail: React.ReactNode;
  matched: boolean;
  cta: string;
  onSelect: () => void;
}) {
  const copy = SEO_PLANS[planKey];
  const featured = Boolean(copy.recommended);
  const enterprise = planKey === "enterprise";
  return (
    <article
      aria-labelledby={`plan-${planKey}`}
      className={cn(
        enterprise ? ENTERPRISE_CARD : "relative flex h-full flex-col rounded-2xl border bg-card p-6",
        !enterprise && featured && "border-primary/60 shadow-xl shadow-primary/10 ring-1 ring-primary/30 dark:shadow-primary/5",
        !enterprise && !featured && "border-border",
        matched && "outline-2 outline-offset-4 outline-brand-orange",
      )}
    >
      {enterprise ? <EnterpriseGlow /> : null}
      <div className="absolute -top-3 left-6 flex gap-2">
        {featured ? <span className="rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-brand-midnight shadow-md">Recommended</span> : null}
        {matched ? (
          <span className="rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-brand-midnight shadow-md">Matches your answers</span>
        ) : null}
      </div>
      {enterprise ? <EnterpriseBadge className="mb-3" /> : null}
      <h3 id={`plan-${planKey}`} className="type-h3">
        {copy.name}
      </h3>
      <p className={cn("mt-1 min-h-10 text-sm", enterprise ? ENTERPRISE_MUTED : "text-muted-foreground")}>{copy.suits}</p>
      <div className="mt-5 min-h-[4.5rem]">{price}</div>
      <p className={cn("mt-4 text-[15px] font-medium leading-snug", enterprise ? "text-white" : "text-foreground")}>{copy.outcome}</p>
      <ul className="mt-4 space-y-2.5">
        {inclusions.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-snug">
            {enterprise ? <EnterpriseTick /> : <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <Button
          size="lg"
          onClick={onSelect}
          variant={featured || enterprise ? "default" : "outline"}
          className={cn(
            "min-h-11 w-full gap-2 font-semibold",
            enterprise && ENTERPRISE_BUTTON,
            !enterprise && !featured && "border-primary/40 text-primary hover:bg-primary/5 hover:text-primary",
          )}
        >
          {cta} <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
      <Disclosure id={`plan-${planKey}-detail`} label="Full scope" onDark={enterprise}>
        {detail}
      </Disclosure>
    </article>
  );
}

function EnterprisePlanCard({ matched, onSelect }: { matched: boolean; onSelect: () => void }) {
  return (
    <PlanCard
      planKey="enterprise"
      price={
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-white">Custom pricing</p>
          <p className={cn("mt-1.5 text-[13px]", ENTERPRISE_MUTED)}>Priced on an agreed scope</p>
        </div>
      }
      inclusions={ENTERPRISE_KEY_INCLUSIONS}
      detail={
        <>
          <p className={cn("mb-2 text-sm", ENTERPRISE_MUTED)}>Scope can include:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-white/90">
            {ENTERPRISE_SCOPE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      }
      matched={matched}
      cta="Build my search plan"
      onSelect={onSelect}
    />
  );
}

function PriceBlock({ amount, currency }: { amount: number; currency: string }) {
  const format = useDisplayPrice();
  const formatted = format(amount, currency);
  if (!formatted) return <p className="text-sm text-muted-foreground">Updating price…</p>;
  return (
    <div>
      <p className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums">{formatted}</span>
        <span className="text-sm font-medium text-muted-foreground">/month</span>
      </p>
      <p className="mt-1.5 text-[13px] text-muted-foreground">Billed monthly · excl. 16% VAT</p>
    </div>
  );
}

function ComparisonTable({ head, rows }: { head: string[]; rows: { label: string; values: string[] }[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card" tabIndex={0} role="region" aria-label="Plan inclusions, scroll sideways on small screens">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">What each plan includes</caption>
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th scope="col" className="w-[28%] px-4 py-3 font-semibold">
              Inclusion
            </th>
            {head.map((name) => (
              <th key={name} scope="col" className="px-4 py-3 font-semibold">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border/70 last:border-0">
              <th scope="row" className="px-4 py-3 font-medium text-muted-foreground">
                {row.label}
              </th>
              {row.values.map((value, i) => (
                <td key={i} className={cn("px-4 py-3 align-top", value === "Not included" && "text-muted-foreground")}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SeoPlans({
  state,
  retry,
  matched,
  onChoose,
  onEnterprise,
  onFindPlan,
}: {
  onFindPlan: () => void;
  state: PlansState;
  retry: () => void;
  matched: PlanKey | null;
  onChoose: (plan: LiveSeoPlan) => void;
  onEnterprise: () => void;
}) {
  const [compareOpen, setCompareOpen] = React.useState(false);
  const enterpriseByLabel = React.useMemo(() => new Map(ENTERPRISE_COMPARISON.map((row) => [row.label, row.value])), []);

  const comparison = React.useMemo(() => {
    if (state.status !== "ready") return null;
    const head = [...state.plans.map((p) => SEO_PLANS[p.key].name), SEO_PLANS.enterprise.name];
    return {
      head,
      rows: state.featureLabels.map((label, i) => ({
        label,
        values: [...state.plans.map((p) => p.rows[i]?.value ?? ""), enterpriseByLabel.get(label) ?? "Agreed with you"],
      })),
    };
  }, [state, enterpriseByLabel]);

  return (
    <section id="plans" aria-labelledby="plans-heading" className="scroll-mt-24 border-y border-border/60 bg-muted/20 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="plans-heading" className="type-h2 text-balance">
            Three plans. One service.
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">Search, Maps and AI-search work in every plan. Choose by how much ongoing work you need.</p>
        </div>

        <div className="mt-12">
          {state.status === "loading" ? (
            <>
              <p className="sr-only" aria-live="polite">
                Loading current prices
              </p>
              <div className="grid gap-6 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-[520px] rounded-2xl" />
                ))}
              </div>
            </>
          ) : state.status === "error" ? (
            <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
              <Alert variant="destructive">
                <AlertDescription>
                  <p>We could not load current prices. Enterprise is still available.</p>
                  <div className="mt-4">
                    <Button type="button" className="min-h-11" onClick={retry}>
                      Try again
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
              <EnterprisePlanCard matched={matched === "enterprise"} onSelect={onEnterprise} />
            </div>
          ) : (
            <div className="grid gap-6 pt-3 lg:grid-cols-3">
              {state.plans.map((plan) => (
                <PlanCard
                  key={plan.key}
                  planKey={plan.key}
                  price={<PriceBlock amount={plan.monthlyPrice} currency={plan.plan.niscCurrency || "KES"} />}
                  inclusions={plan.inclusions}
                  detail={<DetailList rows={plan.rows} />}
                  matched={matched === plan.key}
                  cta={`Choose ${SEO_PLANS[plan.key].name}`}
                  onSelect={() => onChoose(plan)}
                />
              ))}
              <EnterprisePlanCard matched={matched === "enterprise"} onSelect={onEnterprise} />
            </div>
          )}
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-base font-semibold text-foreground">{SEO_POLICY.guarantee}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {SEO_POLICY.billing}. Prices exclude 16% VAT. {SEO_POLICY.commitment} {SEO_POLICY.expectation}
          </p>
        </div>

        {comparison ? (
          <div className="mt-8">
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 gap-2"
                aria-expanded={compareOpen}
                aria-controls="compare-inclusions"
                onClick={() => setCompareOpen((v) => !v)}
              >
                {compareOpen ? "Hide inclusions" : "Compare all inclusions"}
                <ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", compareOpen && "rotate-180")} aria-hidden />
              </Button>
            </div>
            <div id="compare-inclusions" hidden={!compareOpen} className="mt-6">
              <ComparisonTable head={comparison.head} rows={comparison.rows} />
            </div>
          </div>
        ) : null}

        <div className="mt-12">
          <h3 className="type-h3">What the limits mean</h3>
          <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {SCOPE_DEFINITIONS.map((item) => (
              <div key={item.term}>
                <dt className="font-semibold text-foreground">{item.term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-muted-foreground">
            Not sure which plan fits?{" "}
            <button
              type="button"
              onClick={onFindPlan}
              className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
            >
              Answer a few quick questions
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
