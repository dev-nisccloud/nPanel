import { Button } from "@/components/ui/button.tsx";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export type ServicePricingCardPlan = {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  fullWidth?: boolean;
  onSelect?: () => void;
};

export type ServicePricingCardsProps = {
  title: string;
  subtitle?: string;
  plans: ServicePricingCardPlan[];
};

const RECOMMENDED_BADGE = "bg-brand-orange";

function PlanButton({ plan, className }: { plan: ServicePricingCardPlan; className?: string }) {
  return (
    <Button
      type="button"
      size="lg"
      variant={plan.highlighted ? "default" : "outline"}
      className={cn(
        "w-full cursor-pointer gap-2 font-bold",
        plan.highlighted
          ? `${RECOMMENDED_BADGE} text-neutral-950 shadow-lg shadow-brand-orange/30 hover:brightness-105`
          : "border-primary/40 text-primary hover:bg-primary/5",
        className,
      )}
      onClick={plan.onSelect}
    >
      {plan.cta}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

function PlanCard({ plan }: { plan: ServicePricingCardPlan }) {
  const highlighted = Boolean(plan.highlighted);
  return (
    <div
      className={cn(
        "relative rounded-3xl transition-all duration-300",
        plan.fullWidth && "col-span-full",
        highlighted
          ? "bg-gradient-to-br from-brand-orange via-orange-300 to-primary p-[2px] shadow-2xl shadow-brand-orange/20"
          : "p-px hover:-translate-y-1",
      )}
    >
      {highlighted ? (
        <span
          className={cn(
            "absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-950 shadow-md",
            RECOMMENDED_BADGE,
          )}
        >
          Recommended
        </span>
      ) : null}
      <article
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-card p-6",
          !highlighted && "border border-border transition-colors hover:border-primary/40 hover:shadow-lg",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-40",
            highlighted
              ? "bg-[radial-gradient(120%_100%_at_50%_0%,rgba(252,115,77,0.16),transparent_70%)]"
              : "bg-[radial-gradient(120%_100%_at_50%_0%,rgba(56,182,255,0.10),transparent_70%)]",
          )}
        />
        <div className={cn("relative", plan.fullWidth && "md:flex md:items-start md:justify-between md:gap-10")}>
          <div className={cn(plan.fullWidth && "md:max-w-xs")}>
            <h3 className="pt-1 text-xl font-extrabold tracking-tight">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            <p className="mt-5 flex flex-wrap items-baseline gap-1">
              <span
                className={cn(
                  "text-4xl font-extrabold tracking-tight",
                  highlighted ? "bg-gradient-to-r from-orange-600 to-sky-600 bg-clip-text text-transparent dark:from-brand-orange dark:to-primary" : "text-foreground",
                )}
              >
                {plan.price}
              </span>
              {plan.period ? <span className="text-sm font-semibold text-muted-foreground">{plan.period}</span> : null}
            </p>
            <PlanButton plan={plan} className="mt-5" />
          </div>
          <ul
            className={cn(
              "mt-6 flex-1 space-y-2",
              plan.fullWidth && "md:mt-1 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-2 md:space-y-0",
            )}
          >
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[13px] leading-snug text-foreground/85">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden="true" />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        {!plan.fullWidth && plan.features.length > 6 ? <PlanButton plan={plan} className="relative mt-6 h-10 text-sm" /> : null}
      </article>
    </div>
  );
}

export default function ServicePricingCards({ title, subtitle, plans }: ServicePricingCardsProps) {
  return (
    <section className="@container bg-background py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-[36px] font-extrabold leading-[1.15] tracking-tight">{title}</h2>
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="mt-14 grid gap-6 @3xl:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
