import * as React from "react";
import { Globe, Package } from "lucide-react";
import { trpcMutation, trpcQuery } from "@/lib/domain-search/api.ts";
import { formatPrice } from "@/lib/domain-search/format-price.ts";
import { usePricing } from "@/lib/domain-search/pricing-context.tsx";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";

const localTlds = [
  { ext: ".co.ke", note: "Most popular" },
  { ext: ".or.ke", note: "Organisations" },
  { ext: ".ac.ke", note: "Academic" },
  { ext: ".ke", note: "Short and bold" },
] as const;

const globalTlds = [
  { ext: ".com" },
  { ext: ".org" },
  { ext: ".net" },
  { ext: ".africa" },
  { ext: ".shop" },
  { ext: ".online" },
] as const;

/** Stable probe label used only to fetch create/list prices (not shown to users). */
const PRICE_PROBE_NAME = "nisccloudprice";

type PricedTld = {
  amount: number;
  currency: string;
};

function PriceCell({
  price,
  loading,
  fallback = "Search to see price",
}: {
  price?: PricedTld;
  loading: boolean;
  fallback?: string;
}) {
  if (loading && !price) {
    return <span className="h-3.5 w-16 animate-pulse rounded bg-muted inline-block" />;
  }
  if (!price) {
    return <span className="text-xs text-muted-foreground">{fallback}</span>;
  }
  return (
    <span className="text-xs font-semibold text-primary tabular-nums">
      {formatPrice(price.amount, price.currency)}
      <span className="font-normal text-muted-foreground"> /yr</span>
    </span>
  );
}

export function DomainExtensionsSection() {
  const { getPricingInfo, convertPricesBatch, isLoadingTldSettings, hasDefaultSetting } =
    usePricing();
  const [pricesByExt, setPricesByExt] = React.useState<Record<string, PricedTld>>({});
  const [loading, setLoading] = React.useState(true);

  const pricingReady = !isLoadingTldSettings && hasDefaultSetting;

  React.useEffect(() => {
    if (isLoadingTldSettings) return;

    let cancelled = false;

    async function toDisplayKes(
      basePrice: number,
      currency: string,
      domain: string,
    ): Promise<PricedTld | null> {
      if (typeof basePrice !== "number" || Number.isNaN(basePrice)) return null;
      // Pass the real domain so per-TLD margin overrides resolve correctly
      const calc = getPricingInfo(domain, basePrice, currency);
      if (currency === "KES") {
        return { amount: calc.finalPrice, currency: "KES" };
      }
      const [converted] = await convertPricesBatch(
        [{ amount: calc.finalPrice, currency }],
        "KES",
      );
      if (!converted || Number.isNaN(converted.convertedAmount)) {
        return { amount: calc.finalPrice, currency: calc.currency };
      }
      return { amount: converted.convertedAmount, currency: "KES" };
    }

    async function load() {
      setLoading(true);
      const next: Record<string, PricedTld> = {};

      const kenicDomains = localTlds.map(({ ext }) => `${PRICE_PROBE_NAME}${ext}`);
      const openExtensions = globalTlds.map(({ ext }) => ext.replace(/^\./, ""));

      const [kenicRes, openRes] = await Promise.allSettled([
        trpcMutation<{
          normalized?: Array<{
            domain: string;
            available: boolean;
            currency?: string;
            createFee?: { amount: number; currency: string };
          }>;
        }>("kenic.domainCheck.check", {
          domains: kenicDomains,
          withFee: true,
          currency: "KES",
          periodYears: 1,
        }),
        trpcQuery<{
          success: boolean;
          data?: {
            results: Array<{
              domain: string;
              status: string;
              price?: DomainSearchResult["price"];
            }>;
          };
        }>("openProvider.domains.checkAvailability", {
          name: PRICE_PROBE_NAME,
          extensions: openExtensions,
          with_price: true,
          with_whois: false,
        }),
      ]);

      if (cancelled) return;

      if (kenicRes.status === "fulfilled") {
        const normalized = kenicRes.value?.normalized ?? [];
        for (const item of normalized) {
          const domain = item.domain?.toLowerCase() ?? "";
          const ext = localTlds.find((t) => domain.endsWith(t.ext))?.ext;
          if (!ext || item.createFee?.amount == null) continue;
          const priced = await toDisplayKes(
            item.createFee.amount,
            item.createFee.currency ?? item.currency ?? "KES",
            domain,
          );
          if (priced) next[ext] = priced;
        }
      }

      if (openRes.status === "fulfilled" && openRes.value?.success) {
        const results = openRes.value.data?.results ?? [];
        for (const r of results) {
          const domain = r.domain?.toLowerCase() ?? "";
          const ext = globalTlds.find((t) => domain.endsWith(t.ext))?.ext;
          const raw = r.price?.reseller?.price;
          const currency = r.price?.reseller?.currency ?? "USD";
          if (!ext || raw == null) continue;
          const priced = await toDisplayKes(raw, currency, domain);
          if (priced) next[ext] = priced;
        }
      }

      if (!cancelled) {
        setPricesByExt(next);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [convertPricesBatch, getPricingInfo, isLoadingTldSettings, pricingReady]);

  const showLoading = loading || isLoadingTldSettings;

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-8 pb-20 pt-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Every Extension Your Brand Needs</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Register local and global extensions to protect your brand. Live prices include our retail
          margin and are shown in KES where available.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="font-bold">Local Extensions</h3>
          </div>
          <div className="space-y-3">
            {localTlds.map(({ ext, note }) => (
              <div key={ext} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-bold text-foreground">{ext}</span>
                  {note && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">
                      {note}
                    </span>
                  )}
                </div>
                <PriceCell price={pricesByExt[ext]} loading={showLoading} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="font-bold">Global Extensions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {globalTlds.map(({ ext }) => (
              <div key={ext} className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-foreground text-sm">{ext}</span>
                <PriceCell
                  price={pricesByExt[ext]}
                  loading={showLoading}
                  fallback="Search"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            +190 more extensions available. Search above for live pricing on any TLD.
          </p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Package size={18} />
        </div>
        <div>
          <h4 className="font-bold text-sm mb-1">Protect Your Brand Across Key Extensions</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Register .co.ke, .com, .ke, and .net together when you want wider name protection. Search
            your name to see availability and the live price for each extension.
          </p>
        </div>
      </div>
    </section>
  );
}
