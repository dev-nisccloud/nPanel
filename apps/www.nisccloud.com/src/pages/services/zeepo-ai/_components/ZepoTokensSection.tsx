import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { useCurrency } from "@/components/providers/currency.tsx";
import { formatCurrency } from "@/lib/currency.ts";
import { NPANEL_APP } from "@/lib/domain-search/api.ts";
import { ZEPO_CREDITS_SERVICE_TYPE } from "@/lib/billing-cycle.ts";
import { planAudience, publicPlanName } from "@/lib/plan-catalog.ts";
import { navigateToStorefrontCart } from "@/lib/storefront-cart-url.ts";
import { cn } from "@/lib/utils.ts";
import {
  fetchExchangeRatesPublic,
  fetchZepoTokenPacksPublic,
  type ZepoTokenPack,
} from "@/lib/vps-plans-api.ts";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; welcomeTokenGrant: number; packs: ZepoTokenPack[]; usdToKes: number | null };

const FALLBACK_WELCOME_CREDITS = 300;
const ZEPO_PRODUCT_ID = "zeepo-ai";

const USES = [
  "Questions about your services, domains and invoices",
  "Reading, summarising and drafting replies to your email",
  "Market research, strategy, images and brand kits",
];

const PACK_POINTS = [
  "One-time payment, no renewal",
  "Added to your team's Zepo wallet after payment",
  "Buy another pack whenever you run low",
];

function packPrice(pack: ZepoTokenPack, currency: "KES" | "USD", usdToKes: number | null): string {
  const amount = Number(pack.price);
  const source = pack.currency.toUpperCase();
  if (currency === "KES" && source === "USD" && usdToKes) {
    return formatCurrency(Math.ceil(amount * usdToKes), "KES");
  }
  return formatCurrency(amount, source === "KES" ? "KES" : "USD");
}

function packName(pack: ZepoTokenPack): string {
  return publicPlanName(pack.id, `${pack.tokens.toLocaleString("en-KE")} credits`);
}

export function ZepoTokensSection({ sectionId = "plans" }: { sectionId?: string }) {
  const { currency } = useCurrency();
  const [state, setState] = useState<State>({ status: "loading" });
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchZepoTokenPacksPublic(), fetchExchangeRatesPublic().catch(() => null)])
      .then(([data, usdToKes]) => {
        if (!cancelled) setState({ status: "ready", ...data, usdToKes });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const welcomeCredits = state.status === "ready" ? state.welcomeTokenGrant : FALLBACK_WELCOME_CREDITS;
  const npanelUrl = `${NPANEL_APP.replace(/\/+$/, "")}/`;

  const buyPack = async (pack: ZepoTokenPack) => {
    setBuyingId(pack.id);
    try {
      await navigateToStorefrontCart({
        serviceType: ZEPO_CREDITS_SERVICE_TYPE,
        planId: pack.id,
        productId: ZEPO_PRODUCT_ID,
        planName: packName(pack),
        productName: "Zepo AI credits",
        billingCycle: "MONTHLY",
      });
    } catch {
      setBuyingId(null);
      toast.error("We couldn't open the cart. Please try again.");
    }
  };

  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-heading`} className="scroll-mt-20 border-t border-border px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="type-label text-primary">Pricing</p>
          <h2 id={`${sectionId}-heading`} className="type-h2 mt-3">No monthly plan. Buy credits when you need them.</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Each thing Zepo does uses credits from your team wallet. A quick question uses a few; research or a brand kit uses more. Pay once for a pack and buy another when you run low.
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[24px] bg-brand-midnight p-7 text-white ring-1 ring-transparent dark:ring-white/10 sm:p-9">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand-orange/25 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
            <div>
              <p className="text-sm font-semibold text-brand-orange">Free to start</p>
              <p className="mt-3 text-5xl font-bold tracking-tight sm:text-6xl">
                {welcomeCredits.toLocaleString("en-KE")}
                <span className="ml-2 text-2xl font-semibold text-white/80">free credits</span>
              </p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
                Added once to your team wallet when you first start Zepo, as long as your team has an active Nisc Cloud service such as hosting or business email.
              </p>
            </div>
            <ul className="space-y-2.5">
              {USES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/85">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-orange" strokeWidth={3} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">Credit packs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {currency === "KES"
                ? "Priced in Kenya shillings. Pay by M-Pesa or card."
                : "Priced in US dollars. Pay by card."}
            </p>
          </div>
        </div>

        {state.status === "loading" && (
          <div className="mt-5 grid gap-4 md:grid-cols-3" aria-busy="true" aria-label="Loading credit packs">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-[20px] bg-muted motion-reduce:animate-none" />
            ))}
          </div>
        )}

        {state.status === "error" && (
          <p role="alert" className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Credit prices could not load right now. Refresh the page, or buy credits in nPanel under Zepo.
          </p>
        )}

        {state.status === "ready" && state.packs.length === 0 && (
          <p className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Credit packs are being updated. You can see current prices in nPanel under Zepo.
          </p>
        )}

        {state.status === "ready" && state.packs.length > 0 && (
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {state.packs.map((pack) => {
              const audience = planAudience(pack.id);
              const busy = buyingId === pack.id;
              return (
                <li
                  key={pack.id}
                  className={cn(
                    "relative flex flex-col rounded-[20px] border bg-card p-6",
                    pack.isPopular ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary" : "border-border",
                  )}
                >
                  {pack.isPopular && (
                    <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      Popular
                    </span>
                  )}
                  <p className="text-sm font-semibold text-muted-foreground">Zepo AI credits</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{pack.tokens.toLocaleString("en-KE")}</p>
                  {audience && <p className="mt-1 text-sm text-muted-foreground">{audience}</p>}
                  <p className="mt-5 text-2xl font-bold tabular-nums">
                    {packPrice(pack, currency, state.usdToKes)}
                    <span className="ml-1.5 text-sm font-medium text-muted-foreground">once</span>
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-border pt-5">
                    {PACK_POINTS.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={3} aria-hidden />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    size="lg"
                    variant={pack.isPopular ? "default" : "outline"}
                    className="mt-6 min-h-11 w-full gap-2"
                    disabled={buyingId !== null}
                    onClick={() => void buyPack(pack)}
                    aria-label={`Buy ${packName(pack)}`}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> Opening cart…
                      </>
                    ) : (
                      <>
                        Buy {pack.tokens.toLocaleString("en-KE")} credits <ArrowRight className="size-4" aria-hidden />
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          Already a customer?{" "}
          <a href={npanelUrl} rel="noopener" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">
            Open Zepo in nPanel <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </p>
      </div>
    </section>
  );
}
