import * as React from "react";
import { ArrowRight, Cpu, HardDrive, Loader2, MapPin, MemoryStick, Network } from "lucide-react";
import { toast } from "sonner";
import { buildVpsCartParams, navigateToStorefrontCart } from "@/lib/storefront-cart-url.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useCurrency } from "@/components/providers/currency.tsx";
import { convertKesForDisplay, formatCurrency } from "@/lib/currency.ts";
import { EveryPlanIncludes } from "@/pages/hosting/_components/EveryPlanIncludes.tsx";
import { ChipGroup, PlanFilterBar, SelectFilter } from "@/pages/hosting/_components/PlanFilterBar.tsx";
import {
  applyMarginWith,
  fetchDedicatedPlansPublic,
  fetchExchangeRatesPublic,
  fetchFacilitiesPublic,
  fetchVpsPricingSettings,
  type PricingSettings,
  type VpsPlan,
} from "@/lib/vps-plans-api.ts";

/** True of every dedicated server we list. Bandwidth amount and port speed vary, so they stay on the card. */
const EVERY_DEDICATED_PLAN_INCLUDES = [
  "A physical server used only by you",
  "The CPU, memory and disks shown on the card",
  "Bandwidth and port speed shown on the card",
  "You manage the operating system",
];

const PAGE_SIZE = 8;
const FETCH_LIMIT = 100;
const MAX_PAGES = 25;
const PARALLEL_PAGES = 5;
const SNAPSHOT_KEY = "nisc_dedicated_in_stock_v1";
const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

/** Only the fields the cards use, so a session snapshot of in-stock machines stays small. */
function compactPlan(plan: VpsPlan): VpsPlan {
  const di = plan.product_drive_info;
  const desc = di && typeof di === "object" && !Array.isArray(di) ? (di as Record<string, unknown>).description : undefined;
  return {
    product_id: plan.product_id,
    product_name: plan.product_name,
    data_center: plan.data_center,
    location_option_id: plan.location_option_id,
    stock: plan.stock,
    is_vps: plan.is_vps,
    is_vds: plan.is_vds,
    product_cpu: plan.product_cpu,
    product_cpu_cores: plan.product_cpu_cores,
    product_memory: plan.product_memory,
    product_drive: plan.product_drive,
    product_drive_info: typeof desc === "string" ? { description: desc } : undefined,
    product_bandwidth: plan.product_bandwidth,
    product_monthly_price: plan.product_monthly_price,
    product_on_sale: plan.product_on_sale,
  };
}

function readSnapshot(): VpsPlan[] | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as { at: number; plans: VpsPlan[] };
    return Date.now() - snap.at < SNAPSHOT_TTL_MS && Array.isArray(snap.plans) ? snap.plans : null;
  } catch {
    return null;
  }
}

function writeSnapshot(plans: VpsPlan[]) {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ at: Date.now(), plans }));
  } catch {
    // storage full or disabled
  }
}

type LocationOption = { plan: VpsPlan; name: string; monthlyKes: number | null; onSale: boolean };

type Machine = {
  key: string;
  cpu: string;
  coresLabel: string;
  coreCount: number;
  memory: string;
  memoryGb: number;
  storage: string;
  diskTypes: Set<"nvme" | "ssd" | "hdd">;
  bandwidth: string;
  portGbps: number | null;
  brand: "intel" | "amd" | null;
  locations: LocationOption[];
};

function stripHtmlToText(input?: string | null) {
  if (!input) return "";
  return input.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function gbOf(text: string | null | undefined) {
  const m = (text ?? "").match(/([\d.]+)\s*(TB|GB)/i);
  if (!m) return 0;
  return m[2].toUpperCase() === "TB" ? Number(m[1]) * 1000 : Number(m[1]);
}

function prettyAmount(text: string | null | undefined) {
  const raw = stripHtmlToText(text);
  const m = raw.match(/([\d.]+)\s*(TB|GB)/i);
  if (!m) return raw;
  const n = Number(m[1]);
  const num = Number.isInteger(n) ? String(n) : String(n).replace(/\.0+$/, "");
  return `${num} ${m[2].toUpperCase()}`;
}

function cpuTitle(plan: VpsPlan) {
  const cpu = stripHtmlToText(plan.product_cpu).replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (cpu && !/^custom vps/i.test(cpu)) return cpu;
  if (plan.product_name && !/^custom vps/i.test(plan.product_name)) return plan.product_name;
  return cpu || "Dedicated server";
}

function coresOf(plan: VpsPlan) {
  const cpu = stripHtmlToText(plan.product_cpu);
  const fromCpu = cpu.match(/\((\d+)\s*cores?\s*\/\s*(\d+)\s*threads?\)/i);
  if (fromCpu) return { count: Number(fromCpu[1]), label: `${fromCpu[1]} cores · ${fromCpu[2]} threads` };
  const field = stripHtmlToText(plan.product_cpu_cores);
  const fromField = field.match(/(\d+)\s*cores?\s*\/\s*(\d+)\s*threads?/i);
  if (fromField) return { count: Number(fromField[1]), label: `${fromField[1]} cores · ${fromField[2]} threads` };
  const n = Number(field.match(/\d+/)?.[0]);
  if (Number.isFinite(n) && n > 0) return { count: n, label: `${n} cores` };
  return { count: 0, label: field };
}

function storageText(plan: VpsPlan) {
  const di = plan.product_drive_info;
  let raw = plan.product_drive ?? "";
  if (di && typeof di === "object" && !Array.isArray(di)) {
    const desc = (di as Record<string, unknown>).description;
    if (typeof desc === "string" && desc.trim()) raw = desc.trim();
  }
  return stripHtmlToText(raw);
}

function diskTypesOf(storage: string) {
  const types = new Set<"nvme" | "ssd" | "hdd">();
  for (const part of storage.split("+")) {
    if (/nvme/i.test(part)) types.add("nvme");
    else if (/ssd/i.test(part)) types.add("ssd");
    else if (/hdd|sata/i.test(part)) types.add("hdd");
  }
  return types;
}

function bandwidthOf(plan: VpsPlan) {
  const [transfer, port] = (plan.product_bandwidth ?? "").split("/").map((s) => s.trim().replace(/\s*port$/i, ""));
  return port ? `${transfer} bandwidth · ${port} port` : transfer;
}

function brandOf(cpu: string): Machine["brand"] {
  if (/amd|ryzen|epyc|threadripper|opteron/i.test(cpu)) return "amd";
  if (/intel|xeon|\be-?\d{4}|\be[35]-|core i\d/i.test(cpu)) return "intel";
  return null;
}

function groupMachines(
  plans: VpsPlan[],
  facilities: Map<string, string>,
  margin: PricingSettings | null,
  usdToKesRate: number | null,
): Machine[] {
  const groups = new Map<string, Machine>();
  for (const plan of plans) {
    if (plan.stock === "unavailable") continue;
    const cpu = cpuTitle(plan);
    const cores = coresOf(plan);
    const memory = prettyAmount(plan.product_memory);
    const storage = storageText(plan);
    const bandwidth = bandwidthOf(plan);
    const key = `${cpu}|${cores.label}|${memory}|${storage}|${bandwidth}`;
    const usd = applyMarginWith(margin?.base ?? null, plan.product_monthly_price ?? 0).final;
    const option: LocationOption = {
      plan,
      name: facilities.get(plan.data_center) ?? plan.data_center,
      monthlyKes: usdToKesRate !== null ? Math.ceil(usd * usdToKesRate) : null,
      onSale: Boolean(plan.product_on_sale),
    };
    const existing = groups.get(key);
    if (existing) {
      const same = existing.locations.findIndex((l) => l.plan.data_center === plan.data_center);
      if (same === -1) existing.locations.push(option);
      else if ((option.monthlyKes ?? Infinity) < (existing.locations[same].monthlyKes ?? Infinity)) existing.locations[same] = option;
      continue;
    }
    const portMatch = (plan.product_bandwidth ?? "").match(/(\d+)\s*Gbps/i);
    groups.set(key, {
      key,
      cpu,
      coresLabel: cores.label,
      coreCount: cores.count,
      memory: memory ? `${memory} memory` : "",
      memoryGb: gbOf(plan.product_memory),
      storage,
      diskTypes: diskTypesOf(storage),
      bandwidth,
      portGbps: portMatch ? Number(portMatch[1]) : null,
      brand: brandOf(stripHtmlToText(plan.product_cpu) || cpu),
      locations: [option],
    });
  }
  return [...groups.values()].map((m) => ({
    ...m,
    locations: m.locations.sort((a, b) => (a.monthlyKes ?? 0) - (b.monthlyKes ?? 0)),
  }));
}

const CORE_OPTIONS = [
  { value: "all", label: "Any", min: 0, max: Infinity },
  { value: "4", label: "4", min: 4, max: 4 },
  { value: "6", label: "6", min: 6, max: 6 },
  { value: "8", label: "8", min: 8, max: 8 },
  { value: "12", label: "12+", min: 12, max: Infinity },
];

const MEMORY_OPTIONS = [
  { value: "0", label: "Any memory" },
  { value: "32", label: "32 GB or more" },
  { value: "64", label: "64 GB or more" },
  { value: "128", label: "128 GB or more" },
];

const SORT_OPTIONS = [
  { value: "price-asc", label: "Lowest price first" },
  { value: "price-desc", label: "Highest price first" },
  { value: "cores", label: "Most cores first" },
  { value: "memory", label: "Most memory first" },
];

type Filters = { city: string; cores: string; memory: string; disk: string; port: string; brand: string; sort: string };

const DEFAULT_FILTERS: Filters = { city: "all", cores: "all", memory: "0", disk: "all", port: "all", brand: "all", sort: "price-asc" };

function cheapest(machine: Machine, city: string) {
  const inCity = city === "all" ? machine.locations : machine.locations.filter((l) => l.name === city);
  return inCity[0]?.monthlyKes ?? machine.locations[0]?.monthlyKes ?? 0;
}

function MachineRow({
  machine,
  preferredCity,
  currency,
  kesToCurrencyRate,
}: {
  machine: Machine;
  preferredCity: string;
  currency: "KES" | "USD";
  kesToCurrencyRate: number | null;
}) {
  const initial = machine.locations.find((l) => l.name === preferredCity) ?? machine.locations[0];
  const [selected, setSelected] = React.useState(initial?.plan.data_center);
  const location = machine.locations.find((l) => l.plan.data_center === selected) ?? machine.locations[0];
  const price =
    location.monthlyKes !== null && kesToCurrencyRate !== null
      ? formatCurrency(convertKesForDisplay(location.monthlyKes, currency, kesToCurrencyRate), currency)
      : null;
  const selectId = `dedicated-location-${machine.key.replace(/[^a-z0-9]+/gi, "-")}`;
  const specs = [
    { icon: Cpu, text: machine.coresLabel },
    { icon: MemoryStick, text: machine.memory },
    { icon: HardDrive, text: machine.storage },
    { icon: Network, text: machine.bandwidth },
  ].filter((s) => s.text);

  const order = async () => {
    try {
      await navigateToStorefrontCart(
        buildVpsCartParams({
          productId: location.plan.product_id,
          planName: machine.cpu,
          productName: "Dedicated Servers",
          currency: location.monthlyKes !== null ? "KES" : "USD",
          serviceType: "dedicated_servers",
          locationName: location.plan.data_center,
        }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open checkout.");
    }
  };

  return (
    <li className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="type-h3 max-w-3xl text-balance">{machine.cpu}</h3>
        <div className="flex flex-wrap gap-2">
          {location.onSale ? (
            <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary dark:text-primary">On sale</span>
          ) : null}
          {machine.locations.length >= 3 ? (
            <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
              In {machine.locations.length} cities
            </span>
          ) : null}
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {specs.map(({ icon: Icon, text }) => (
          <li key={text} className="flex min-w-0 items-start gap-2 text-base text-foreground">
            <Icon className="mt-0.5 size-5 shrink-0 text-primary dark:text-primary" aria-hidden />
            <span className="min-w-0 break-words">{text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <label htmlFor={selectId} className="type-label flex items-center gap-1.5 text-foreground">
            <MapPin className="size-4 text-primary dark:text-primary" aria-hidden /> Server location
          </label>
          <select
            id={selectId}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {machine.locations.map(({ plan, name }) => (
              <option key={plan.data_center} value={plan.data_center}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <p className="flex items-baseline gap-1 sm:justify-end">
            <span className="text-3xl font-semibold tracking-tight text-foreground">{price ?? "—"}</span>
            {price ? <span className="text-base text-muted-foreground">/month</span> : null}
          </p>
          <button
            type="button"
            onClick={order}
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-bold text-[#02070a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Choose this server
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

export function DedicatedPlansSection() {
  const { currency, kesToCurrencyRate } = useCurrency();
  const [plans, setPlans] = React.useState<VpsPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pricingSettings, setPricingSettings] = React.useState<PricingSettings | null>(null);
  const [usdToKesRate, setUsdToKesRate] = React.useState<number | null>(null);
  const [facilities, setFacilities] = React.useState<Map<string, string>>(new Map());
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [showAll, setShowAll] = React.useState(false);
  const [truncated, setTruncated] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const seen = new Set<string>();
    const inStock: VpsPlan[] = [];
    const add = (batch: VpsPlan[]) => {
      for (const plan of batch) {
        if (plan.stock === "unavailable") continue;
        const id = `${plan.product_id}|${plan.data_center}`;
        if (seen.has(id)) continue;
        seen.add(id);
        inStock.push(compactPlan(plan));
      }
      if (active) setPlans([...inStock]);
    };

    async function loadAll() {
      try {
        const [settings, rate, facRes] = await Promise.all([
          fetchVpsPricingSettings("DEDICATED_SERVERS"),
          fetchExchangeRatesPublic(),
          fetchFacilitiesPublic(),
        ]);
        if (!active) return;
        setPricingSettings(settings);
        setUsdToKesRate(rate);
        setFacilities(new Map(facRes.map((f) => [f.code, f.title])));

        const snapshot = readSnapshot();
        if (snapshot) {
          add(snapshot);
          setLoading(false);
          return;
        }

        const first = await fetchDedicatedPlansPublic(0, FETCH_LIMIT);
        add(first.plans);
        if (active) setLoading(false);

        let cursor = first.nextCursor;
        let pages = 1;
        if (active && cursor !== null) setLoadingMore(true);
        while (active && cursor !== null && pages < MAX_PAGES) {
          const start: number = cursor;
          const cursors = Array.from({ length: Math.min(PARALLEL_PAGES, MAX_PAGES - pages) }, (_, i) => start + i * FETCH_LIMIT);
          const results = await Promise.all(
            cursors.map((c) => fetchDedicatedPlansPublic(c, FETCH_LIMIT).catch(() => ({ plans: [] as VpsPlan[], nextCursor: null }))),
          );
          add(results.flatMap((r) => r.plans));
          pages += cursors.length;
          const last = results[results.length - 1];
          cursor = results.some((r) => r.plans.length === 0) ? null : last.nextCursor;
        }
        if (!active) return;
        setTruncated(cursor !== null);
        writeSnapshot(inStock);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        if (active) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }
    loadAll();
    return () => {
      active = false;
    };
  }, []);

  const machines = React.useMemo(
    () => groupMachines(plans, facilities, pricingSettings, usdToKesRate),
    [plans, facilities, pricingSettings, usdToKesRate],
  );

  const cities = React.useMemo(
    () => [...new Set(machines.flatMap((m) => m.locations.map((l) => l.name)))].sort((a, b) => a.localeCompare(b)),
    [machines],
  );
  const coreOptions = CORE_OPTIONS.filter((o) => o.value === "all" || machines.some((m) => m.coreCount >= o.min && m.coreCount <= o.max));
  const hasDisk = (t: "nvme" | "ssd" | "hdd") => machines.some((m) => m.diskTypes.has(t));
  const hasPort = (g: number) => machines.some((m) => m.portGbps === g);
  const hasBrand = (b: "intel" | "amd") => machines.some((m) => m.brand === b);

  const set = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setShowAll(false);
  };

  const coreRange = CORE_OPTIONS.find((o) => o.value === filters.cores) ?? CORE_OPTIONS[0];
  const filtered = machines
    .filter((m) => filters.city === "all" || m.locations.some((l) => l.name === filters.city))
    .filter((m) => m.coreCount >= coreRange.min && m.coreCount <= coreRange.max)
    .filter((m) => m.memoryGb >= Number(filters.memory))
    .filter((m) => filters.disk === "all" || m.diskTypes.has(filters.disk as "nvme" | "ssd" | "hdd"))
    .filter((m) => filters.port === "all" || m.portGbps === Number(filters.port))
    .filter((m) => filters.brand === "all" || m.brand === filters.brand)
    .sort((a, b) => {
      if (filters.sort === "price-desc") return cheapest(b, filters.city) - cheapest(a, filters.city);
      if (filters.sort === "cores") return b.coreCount - a.coreCount || cheapest(a, filters.city) - cheapest(b, filters.city);
      if (filters.sort === "memory") return b.memoryGb - a.memoryGb || cheapest(a, filters.city) - cheapest(b, filters.city);
      return cheapest(a, filters.city) - cheapest(b, filters.city);
    });
  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const activeCount = (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).filter((k) => k !== "sort" && filters[k] !== DEFAULT_FILTERS[k]).length;

  return (
    <section id="plans" className="scroll-mt-24 bg-muted/10 py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="type-h2">Choose a physical server</h2>
          <p className="mt-4 text-base text-muted-foreground">
            Each row is one machine. The same build can be in more than one city — pick the city on the row. Bandwidth and
            port speed are on the row, because they are not the same on every machine.
          </p>
        </div>

        {error ? (
          <Alert variant="destructive" className="mx-auto mb-8 max-w-2xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mx-auto max-w-4xl">
          {!loading && machines.length ? (
            <PlanFilterBar
              resultText={`Showing ${Math.min(visible.length, filtered.length)} of ${filtered.length} machines`}
              activeCount={activeCount}
              onClear={() => set({ ...DEFAULT_FILTERS, sort: filters.sort })}
              sort={
                <SelectFilter label="Sort machines" hideLabel value={filters.sort} options={SORT_OPTIONS} onChange={(sort) => set({ sort })} />
              }
            >
              <SelectFilter
                label="Location"
                value={filters.city}
                options={[{ value: "all", label: "All cities" }, ...cities.map((c) => ({ value: c, label: c }))]}
                onChange={(city) => set({ city })}
              />
              <ChipGroup label="Cores" value={filters.cores} options={coreOptions} onChange={(cores) => set({ cores })} />
              <SelectFilter label="Memory" value={filters.memory} options={MEMORY_OPTIONS} onChange={(memory) => set({ memory })} />
              <ChipGroup
                label="Disk"
                value={filters.disk}
                options={[
                  { value: "all", label: "Any" },
                  ...(hasDisk("nvme") ? [{ value: "nvme", label: "NVMe" }] : []),
                  ...(hasDisk("ssd") ? [{ value: "ssd", label: "SSD" }] : []),
                  ...(hasDisk("hdd") ? [{ value: "hdd", label: "HDD" }] : []),
                ]}
                onChange={(disk) => set({ disk })}
              />
              {hasPort(1) && hasPort(10) ? (
                <ChipGroup
                  label="Port"
                  value={filters.port}
                  options={[
                    { value: "all", label: "Any" },
                    { value: "1", label: "1Gbps" },
                    { value: "10", label: "10Gbps" },
                  ]}
                  onChange={(port) => set({ port })}
                />
              ) : null}
              {hasBrand("intel") && hasBrand("amd") ? (
                <ChipGroup
                  label="Processor"
                  value={filters.brand}
                  options={[
                    { value: "all", label: "Any" },
                    { value: "intel", label: "Intel" },
                    { value: "amd", label: "AMD" },
                  ]}
                  onChange={(brand) => set({ brand })}
                />
              ) : null}
            </PlanFilterBar>
          ) : null}

          <ul className="flex flex-col gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="rounded-3xl border border-border bg-card p-6">
                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="mt-4 h-16 w-full" />
                    <Skeleton className="mt-4 h-11 w-full" />
                  </li>
                ))
              : visible.map((machine) => (
                  <MachineRow
                    key={`${machine.key}|${filters.city}`}
                    machine={machine}
                    preferredCity={filters.city}
                    currency={currency}
                    kesToCurrencyRate={kesToCurrencyRate}
                  />
                ))}
          </ul>

          {loadingMore ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Checking more machines in stock…
            </p>
          ) : null}

          {!loading && !loadingMore && filtered.length === 0 && !error ? (
            <p className="mt-6 text-center text-base text-muted-foreground">
              {machines.length ? "No machine matches these filters. " : "No dedicated servers are available right now. "}
              {machines.length ? (
                <button
                  type="button"
                  onClick={() => set({ ...DEFAULT_FILTERS, sort: filters.sort })}
                  className="cursor-pointer font-semibold text-primary underline dark:text-primary"
                >
                  Clear filters
                </button>
              ) : (
                <a className="font-semibold text-primary underline dark:text-primary" href="/contact?serviceName=Dedicated%20Servers">
                  Ask our team about the next machine
                </a>
              )}
            </p>
          ) : null}

          {!loading && filtered.length > PAGE_SIZE ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-border bg-card px-5 text-base font-semibold text-foreground transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {showAll ? "Show fewer machines" : `Show all ${filtered.length} machines`}
              </button>
            </div>
          ) : null}

          {truncated ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              This list is the first batch of machines in stock. If you need a build you do not see,{" "}
              <a className="font-semibold text-primary underline dark:text-primary" href="/contact?serviceName=Dedicated%20Servers">
                ask our team
              </a>
              .
            </p>
          ) : null}
        </div>

        <EveryPlanIncludes items={EVERY_DEDICATED_PLAN_INCLUDES} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Prices can differ by city. Prices are shown in KES or USD based on your location, excluding 16% VAT.
        </p>
      </div>
    </section>
  );
}
