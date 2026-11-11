import * as React from "react";
import { ArrowRight, Cpu, HardDrive, MapPin, MemoryStick, Network } from "lucide-react";
import { toast } from "sonner";
import { buildVpsCartParams, navigateToStorefrontCart } from "@/lib/storefront-cart-url.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useCurrency } from "@/components/providers/currency.tsx";
import { convertKesForDisplay, formatCurrency } from "@/lib/currency.ts";
import { cn } from "@/lib/utils.ts";
import { EveryPlanIncludes } from "@/pages/hosting/_components/EveryPlanIncludes.tsx";
import {
  applyMarginWith,
  fetchExchangeRatesPublic,
  fetchFacilitiesPublic,
  fetchVpsPlansPublic,
  fetchVpsPricingSettings,
  type PricingSettings,
  type VpsPlan,
} from "@/lib/vps-plans-api.ts";

/** Owner-confirmed inclusions on every VPS plan. */
const EVERY_VPS_PLAN_INCLUDES = [
  "Full root access",
  "SSH key login",
  "Choice of Linux OS images",
  "Windows Server available",
  "DDoS protection",
  "Backups",
  "Dedicated IPv4 address",
  "10TB bandwidth on a 1Gbps port",
];

/** Display names by size, smallest first; supplier product names stay in the order data. */
const TIERS = [
  { name: "Starter", bestFor: "Staging servers, small apps, bots and personal projects" },
  { name: "Growth", bestFor: "Busy websites, online stores and APIs" },
  { name: "Pro", bestFor: "Applications with steady traffic and a database" },
  { name: "Business", bestFor: "Several sites or apps on one server" },
  { name: "Scale", bestFor: "Larger databases and background processing" },
  { name: "Power", bestFor: "Heavy applications that need lots of memory" },
  { name: "Ultra", bestFor: "The largest virtual servers we offer" },
];

const MAX_PAGES = 10;

type LocationOption = { plan: VpsPlan; name: string; monthlyKes: number | null };

type SizeGroup = {
  key: string;
  tierIndex: number;
  cores: string | null;
  memory: string;
  storage: string;
  bandwidth: string;
  locations: LocationOption[];
};

function stripHtmlToText(input?: string | null) {
  if (!input) return "";
  return input.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function coreCount(plan: VpsPlan): number | null {
  const info = plan.processor_info;
  if (info && typeof info === "object" && !Array.isArray(info)) {
    const vcpus = (info as Record<string, unknown>).vcpus;
    if (typeof vcpus === "number" && vcpus > 0) return vcpus;
  }
  const n = Number(stripHtmlToText(plan.product_cpu_cores).match(/\d+/)?.[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function gbOf(text: string | null | undefined) {
  const m = (text ?? "").match(/([\d.]+)\s*(TB|GB)/i);
  if (!m) return null;
  return m[2].toUpperCase() === "TB" ? Number(m[1]) * 1000 : Number(m[1]);
}

function storageText(plan: VpsPlan) {
  const di = plan.product_drive_info;
  let raw = plan.product_drive ?? "";
  if (di && typeof di === "object" && !Array.isArray(di)) {
    const desc = (di as Record<string, unknown>).description;
    if (typeof desc === "string" && desc.trim()) raw = desc.trim();
  }
  return raw;
}

function bandwidthOf(plan: VpsPlan) {
  const [transfer, port] = (plan.product_bandwidth ?? "").split("/").map((s) => s.trim().replace(/\s*port$/i, ""));
  return port ? `${transfer} bandwidth · ${port} port` : transfer;
}

function groupBySize(
  plans: VpsPlan[],
  facilities: Map<string, string>,
  margin: PricingSettings | null,
  usdToKesRate: number | null,
): SizeGroup[] {
  const groups = new Map<string, Omit<SizeGroup, "tierIndex"> & { sort: number[] }>();
  for (const plan of plans) {
    if (plan.stock === "unavailable") continue;
    const cores = coreCount(plan);
    const memoryGb = gbOf(plan.product_memory);
    const storageGb = gbOf(storageText(plan));
    const key = `${cores}|${memoryGb}|${storageGb}`;
    const usd = applyMarginWith(margin?.base ?? null, plan.product_monthly_price ?? 0).final;
    const option: LocationOption = {
      plan,
      name: facilities.get(plan.data_center) ?? plan.data_center,
      monthlyKes: usdToKesRate !== null ? Math.ceil(usd * usdToKesRate) : null,
    };
    const existing = groups.get(key);
    if (existing) {
      const same = existing.locations.findIndex((l) => l.plan.data_center === plan.data_center);
      if (same === -1) existing.locations.push(option);
      else if ((option.monthlyKes ?? Infinity) < (existing.locations[same].monthlyKes ?? Infinity)) existing.locations[same] = option;
      continue;
    }
    groups.set(key, {
      key,
      sort: [cores ?? 0, memoryGb ?? 0, storageGb ?? 0],
      cores: cores ? `${cores} vCPU cores` : null,
      memory: memoryGb ? `${memoryGb} GB memory` : (plan.product_memory ?? ""),
      storage: storageGb ? `${storageGb} GB storage` : storageText(plan),
      bandwidth: bandwidthOf(plan),
      locations: [option],
    });
  }
  return [...groups.values()]
    .map((g) => ({ ...g, locations: g.locations.sort((a, b) => (a.monthlyKes ?? 0) - (b.monthlyKes ?? 0)) }))
    .sort((a, b) => a.sort[0] - b.sort[0] || a.sort[1] - b.sort[1] || a.sort[2] - b.sort[2])
    .map(({ sort: _sort, ...g }, i) => ({ ...g, tierIndex: Math.min(i, TIERS.length - 1) }));
}

function SizeCard({
  group,
  recommended,
  currency,
  kesToCurrencyRate,
}: {
  group: SizeGroup;
  recommended: boolean;
  currency: "KES" | "USD";
  kesToCurrencyRate: number | null;
}) {
  const [selected, setSelected] = React.useState(group.locations[0]?.plan.data_center);
  const location = group.locations.find((l) => l.plan.data_center === selected) ?? group.locations[0];
  const tier = TIERS[group.tierIndex];
  const price =
    location.monthlyKes !== null && kesToCurrencyRate !== null
      ? formatCurrency(convertKesForDisplay(location.monthlyKes, currency, kesToCurrencyRate), currency)
      : null;
  const specs = [
    { icon: Cpu, text: group.cores },
    { icon: MemoryStick, text: group.memory },
    { icon: HardDrive, text: group.storage },
    { icon: Network, text: group.bandwidth },
  ].filter((s): s is { icon: typeof Cpu; text: string } => Boolean(s.text));
  const selectId = `vps-location-${group.key}`;

  const order = async () => {
    try {
      await navigateToStorefrontCart(
        buildVpsCartParams({
          productId: location.plan.product_id,
          planName: `VPS ${tier.name}`,
          productName: "VPS Hosting",
          currency: location.monthlyKes !== null ? "KES" : "USD",
          serviceType: "vps",
          locationName: location.plan.data_center,
        }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open checkout.");
    }
  };

  return (
    <li
      className={cn(
        "relative flex flex-col rounded-3xl border bg-card p-6",
        recommended ? "border-primary shadow-[0_30px_60px_-40px_rgb(2_132_199_/_0.7)] ring-2 ring-primary/25" : "border-border",
      )}
    >
      {recommended ? (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-[#02070a]">Recommended</span>
      ) : null}
      <h3 className="type-h3">VPS {tier.name}</h3>
      <p className="mt-1 min-h-[3rem] text-[15px] leading-relaxed text-muted-foreground">{tier.bestFor}</p>

      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-foreground">{price ?? "—"}</span>
        {price ? <span className="text-base text-muted-foreground">/month</span> : null}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{price ? "Billed monthly · excl. 16% VAT" : "Price unavailable right now"}</p>

      <ul className="mt-5 space-y-3 border-t border-border pt-5">
        {specs.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-base text-foreground">
            <Icon className="size-5 shrink-0 text-sky-700 dark:text-primary" aria-hidden />
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <label htmlFor={selectId} className="type-label flex items-center gap-1.5 text-foreground">
          <MapPin className="size-4 text-sky-700 dark:text-primary" aria-hidden /> Server location
        </label>
        <select
          id={selectId}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {group.locations.map(({ plan, name }) => (
            <option key={plan.data_center} value={plan.data_center}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={order}
          className={cn(
            "mt-4 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-base font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            recommended ? "bg-primary text-[#02070a] hover:brightness-110" : "border border-border bg-background text-foreground hover:border-primary/50",
          )}
        >
          Choose VPS {tier.name}
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}
function SizeSkeleton() {
  return (
    <li className="rounded-3xl border border-border bg-card p-7">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-6 h-10 w-1/2" />
      <Skeleton className="mt-6 h-32 w-full" />
      <Skeleton className="mt-6 h-12 w-full" />
    </li>
  );
}

export function VpsPlansSection() {
  const { currency, kesToCurrencyRate } = useCurrency();
  const [plans, setPlans] = React.useState<VpsPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pricingSettings, setPricingSettings] = React.useState<PricingSettings | null>(null);
  const [usdToKesRate, setUsdToKesRate] = React.useState<number | null>(null);
  const [facilities, setFacilities] = React.useState<Map<string, string>>(new Map());

  React.useEffect(() => {
    let active = true;
    async function loadAll() {
      try {
        const [settings, rate, facRes] = await Promise.all([fetchVpsPricingSettings(), fetchExchangeRatesPublic(), fetchFacilitiesPublic()]);
        const all: VpsPlan[] = [];
        let cursor: number | null = 0;
        for (let page = 0; cursor !== null && page < MAX_PAGES; page++) {
          const res = await fetchVpsPlansPublic(cursor, 100);
          all.push(...res.plans);
          cursor = res.nextCursor;
        }
        if (!active) return;
        setPlans(all);
        setPricingSettings(settings);
        setUsdToKesRate(rate);
        setFacilities(new Map(facRes.map((f) => [f.code, f.title])));
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAll();
    return () => {
      active = false;
    };
  }, []);

  const groups = React.useMemo(
    () => groupBySize(plans, facilities, pricingSettings, usdToKesRate),
    [plans, facilities, pricingSettings, usdToKesRate],
  );
  const recommendedKey = (groups.find((g) => Number(g.key.split("|")[0]) >= 4) ?? groups[0])?.key;

  return (
    <section id="plans" className="scroll-mt-24 bg-muted/10 py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="type-h2">Choose your VPS</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Full root access, a dedicated IPv4 address and 10TB of bandwidth on every size. Pick the cores and memory your
            workload needs, then choose a server location.
          </p>
        </div>

        {error ? (
          <Alert variant="destructive" className="mx-auto mb-8 max-w-2xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <ul className={cn("mx-auto grid gap-6 pt-3", groups.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : groups.length === 3 ? "md:grid-cols-3" : "max-w-4xl md:grid-cols-2")}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SizeSkeleton key={i} />)
            : groups.map((group) => (
                <SizeCard
                  key={group.key}
                  group={group}
                  recommended={group.key === recommendedKey}
                  currency={currency}
                  kesToCurrencyRate={kesToCurrencyRate}
                />
              ))}
        </ul>

        {!loading && groups.length === 0 && !error ? (
          <p className="mt-6 text-center text-base text-muted-foreground">
            No VPS sizes are available right now. <a className="font-semibold text-sky-700 underline dark:text-primary" href="/contact?serviceName=VPS%20Hosting">Ask our team</a> about the next available server.
          </p>
        ) : null}

        <EveryPlanIncludes items={EVERY_VPS_PLAN_INCLUDES} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Available locations are listed on each card, and prices can differ by location. Prices are shown in KES or USD based on your location, excluding 16% VAT.
        </p>
      </div>
    </section>
  );
}
