import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Check } from "lucide-react";
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

export default function ServicePricingCards({
  title,
  subtitle,
  plans,
}: ServicePricingCardsProps) {
  return (
    <section className="@container bg-background py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-medium">{title}</h2>
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-md text-balance text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="mt-12 grid gap-3 @3xl:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative flex flex-col gap-0 p-6 shadow-sm",
                plan.fullWidth && "col-span-full",
                plan.highlighted
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border bg-card",
              )}
            >
              <div>
                <h3 className="font-medium text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mt-6">
                <span className="text-4xl font-medium">{plan.price}</span>
                {plan.period ? (
                  <span className="text-muted-foreground">{plan.period}</span>
                ) : null}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant={plan.highlighted ? "default" : "outline"}
                className="mt-8 w-full cursor-pointer"
                onClick={plan.onSelect}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
