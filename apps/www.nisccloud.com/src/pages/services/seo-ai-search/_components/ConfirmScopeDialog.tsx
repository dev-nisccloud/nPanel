import * as React from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { buildSharedHostingCartParams, navigateToStorefrontCart } from "@/lib/storefront-cart-url.ts";
import { trackEvent } from "@/lib/track.ts";
import { SEO_CHECKOUT_SERVICE_TYPE, SEO_PLANS, SEO_POLICY, SEO_SERVICE_NAME } from "@/lib/seo-ai-search.ts";
import type { LiveSeoPlan } from "./use-seo-plans.ts";
import { useDisplayPrice } from "./use-display-price.ts";

const NEXT_STEPS = [
  "Pay securely by M-Pesa or card. Your order then opens in nPanel.",
  "We learn about your business and set a search baseline.",
  "We agree the highest-priority improvements with you.",
  "We complete the first work in your plan, then review progress and set next priorities.",
];

export function ConfirmScopeDialog({
  plan,
  inclusions,
  onOpenChange,
  onCloseAutoFocus,
}: {
  onCloseAutoFocus: (event: Event) => void;
  plan: LiveSeoPlan | null;
  inclusions: string[];
  onOpenChange: (open: boolean) => void;
}) {
  const format = useDisplayPrice();
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) setPending(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  if (!plan) return <Dialog open={false} onOpenChange={onOpenChange} />;

  const copy = SEO_PLANS[plan.key];
  const source = plan.plan.niscCurrency || "KES";
  const vat = Math.round(plan.monthlyPrice * SEO_POLICY.vatRate * 100) / 100;
  const rows: [string, string | null][] = [
    ["Price", format(plan.monthlyPrice, source)],
    [`VAT (${Math.round(SEO_POLICY.vatRate * 100)}%)`, format(vat, source)],
  ];
  const total = format(plan.monthlyPrice + vat, source);

  const checkout = async () => {
    setPending(true);
    trackEvent("seo_checkout_continue", { plan: plan.key });
    try {
      await navigateToStorefrontCart(buildSharedHostingCartParams(plan.plan, SEO_CHECKOUT_SERVICE_TYPE, "MONTHLY"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open checkout.");
      setPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !pending && onOpenChange(open)}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus} className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Confirm your plan</DialogTitle>
          <DialogDescription>
            Check the price, terms and scope before checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{SEO_SERVICE_NAME}</p>
          <p className="type-h3 mt-1">{copy.name}</p>
          <dl className="mt-4 space-y-2 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="tabular-nums">{value ?? "Updating…"}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
              <dt>Total per month</dt>
              <dd className="tabular-nums">{total ?? "Updating…"}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">Checkout confirms the final amount before you pay.</p>
        </div>

        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-semibold">Billing</dt>
            <dd className="text-muted-foreground">{SEO_POLICY.billing}, renewing each month.</dd>
          </div>
          <div>
            <dt className="font-semibold">Commitment and cancellation</dt>
            <dd className="text-muted-foreground">{SEO_POLICY.commitment}</dd>
          </div>
          <div>
            <dt className="font-semibold">What to expect</dt>
            <dd className="text-muted-foreground">
              {SEO_POLICY.expectation} {SEO_POLICY.guarantee}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-sm font-semibold">Scope and key limits</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {inclusions.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">What happens next</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {NEXT_STEPS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="min-h-11" disabled={pending} onClick={() => onOpenChange(false)}>
            Back to plans
          </Button>
          <Button type="button" className="min-h-11 gap-2" disabled={pending || !total} onClick={checkout}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {pending ? "Opening checkout…" : "Continue to checkout"}
            {!pending ? <ArrowRight className="size-4" aria-hidden /> : null}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
