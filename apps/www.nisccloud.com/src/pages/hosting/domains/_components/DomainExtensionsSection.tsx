import * as React from "react";
import { Globe, Package } from "lucide-react";
import { trpcQuery } from "@/lib/domain-search/api.ts";
import { checkKenicDomains, type KenicCheckItem } from "@/lib/domain-search/kenic-check.ts";
import { usePricing } from "@/lib/domain-search/pricing-context.tsx";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { useCurrency } from "@/components/providers/currency.tsx";
import { convertKesForDisplay, formatCurrency } from "@/lib/currency.ts";

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

const PROBE_FEES_KEY = "nisc_kenic_probe_fees";
/** Registry list prices change rarely; reuse them so this table never queues ahead of a customer's search. */
const PROBE_FEES_TTL_MS = 6 * 60 * 60 * 1000;

async function loadKenicProbeFees(domains: string[]): Promise<{ normalized: KenicCheckItem[] }> {
  try {
    const raw = localStorage.getItem(PROBE_FEES_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { at: number; domains: string; normalized: KenicCheckItem[] };
      if (cached.domains === domains.join(",") && Date.now() - cached.at < PROBE_FEES_TTL_MS) {
        return { normalized: cached.normalized };
      }
    }
  } catch {
    // ignore unreadable cache
  }
  const fresh = await checkKenicDomains(domains, { background: true });
  try {
    localStorage.setItem(
      PROBE_FEES_KEY,
      JSON.stringify({ at: Date.now(), domains: domains.join(","), normalized: fresh.normalized }),
    );
  } catch {
    // storage full or disabled
  }
  return fresh;
}

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
  const { currency, kesToCurrencyRate } = useCurrency();
  if (loading && !price) {
    return <span className="h-3.5 w-16 animate-pulse rounded bg-muted inline-block" />;
  }
  if (!price) {
    return <span className="text-xs text-muted-foreground">{fallback}</span>;
  }
  if (price.currency !== "KES" || kesToCurrencyRate === null) {
    return <span className="text-xs text-muted-foreground">Price unavailable</span>;
  }
  const displayAmount = convertKesForDisplay(price.amount, currency, kesToCurrencyRate);
  return (
    <span className="text-xs font-semibold text-primary tabular-nums">
      {formatCurrency(displayAmount, currency)}
      <span className="font-normal text-muted-foreground"> /yr</span>
    </span>
  );
}

export function DomainExtensionsSection() {
  const { getPricingInfo, convertPricesBatch, isConversionAvailable, isLoadingTldSettings, hasDefaultSetting } =
    usePricing();
  const [pricesByExt, setPricesByExt] = React.useState<Record<string, PricedTld>>({});
  const [loading, setLoading] = React.useState(true);
  const sectionRef = React.useRef<HTMLElement>(null);
  const [nearView, setNearView] = React.useState(false);

  const pricingReady = !isLoadingTldSettings && hasDefaultSetting;

  // The KeNIC registry answers one check at a time; loading this table only once it is on
  // screen keeps its price probe from queuing ahead of a customer's search.
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNearView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (isLoadingTldSettings || !nearView) return;

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
      if (!isConversionAvailable) return null;
      const [converted] = await convertPricesBatch(
        [{ amount: calc.finalPrice, currency }],
        "KES",
      );
      if (!converted || Number.isNaN(converted.convertedAmount)) {
        return null;
      }
      return { amount: converted.convertedAmount, currency: "KES" };
    }

    async function load() {
      setLoading(true);
      const next: Record<string, PricedTld> = {};

      const kenicDomains = localTlds.map(({ ext }) => `${PRICE_PROBE_NAME}${ext}`);
      const openExtensions = globalTlds.map(({ ext }) => ext.replace(/^\./, ""));

      const [kenicRes, openRes] = await Promise.allSettled([
        loadKenicProbeFees(kenicDomains),
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
  }, [convertPricesBatch, getPricingInfo, isConversionAvailable, isLoadingTldSettings, pricingReady, nearView]);

  const showLoading = loading || isLoadingTldSettings;

  return (
    <section ref={sectionRef} className="max-w-5xl mx-auto px-4 md:px-8 pb-20 pt-4">
      <div className="text-center mb-12">
        <h2 className="type-h2 mb-3">Every Extension Your Brand Needs</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Register local and global extensions to protect your brand. Live prices include our retail
          margin and are shown in KES or USD based on your location.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="font-normal">Local Extensions</h3>
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
            <h3 className="font-normal">Global Extensions</h3>
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
          <p className="text-xs text-muted-foreground mt-2">
            Prices are for the first year, excluding VAT. The renewal price is shown in search
            results or in your cart before you pay.
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
