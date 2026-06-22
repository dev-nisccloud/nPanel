import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, HardDrive, HelpCircle, MemoryStick, Network, ChevronDown, MapPin } from "lucide-react";
import { buildVpsCartUrl } from "@/lib/storefront-cart-url.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { VpsPlanFilter, type VpsPlanFilter as VpsPlanFilterType, DEFAULT_VPS_FILTER, applyVpsPlanFilter } from "./VpsPlanFilter.tsx";

import {
  fetchVpsPlansPublic,
  fetchVpsPricingSettings,
  fetchExchangeRatesPublic,
  fetchFacilitiesPublic,
  applyMarginWith,
  type VpsPlan,
  type PricingSettings,
} from "@/lib/vps-plans-api.ts";

function getCpuBrand(productName: string | null | undefined): "intel" | "amd" | null {
  const name = (productName ?? "").toLowerCase();
  if (name.includes("intel")) return "intel";
  if (name.includes("amd")) return "amd";
  return null;
}

function stripHtmlToText(input?: string) {
  if (!input) return "";
  return input
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getProcessorSummary(processorInfo: unknown) {
  if (!processorInfo || typeof processorInfo !== "object" || Array.isArray(processorInfo)) return null;
  const r = processorInfo as Record<string, unknown>;
  const cores = typeof r.cores === "number" ? r.cores : null;
  const threads = typeof r.threads === "number" ? r.threads : null;
  const sockets = typeof r.sockets === "number" ? r.sockets : null;
  const vcpus = typeof r.vcpus === "number" ? r.vcpus : null;
  return { cores, threads, sockets, vcpus };
}

function getDriveDescription(plan: VpsPlan) {
  const di = plan.product_drive_info;
  if (di && typeof di === "object" && !Array.isArray(di)) {
    const r = di as Record<string, unknown>;
    const desc = typeof r.description === "string" ? r.description : "";
    if (desc.trim().length > 0) return desc.trim();
  }
  return plan.product_drive || " ";
}

function formatMoney(amount: number | undefined | null, currency: string) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function VpsPlanCard({
  plan,
  pricingSettings,
  usdToKesRate,
  locationName,
}: {
  plan: VpsPlan;
  pricingSettings: PricingSettings | null;
  usdToKesRate: number | null;
  locationName: string;
}) {
  const navigate = useNavigate();
  const isUnavailable = plan.stock === "unavailable";
  
  // Apply margin to USD base price
  const baseMargin = pricingSettings?.base ?? null;
  const monthlyUsdWithMargin = applyMarginWith(baseMargin, plan.product_monthly_price ?? 0).final;
  
  // Convert to KES
  const monthlyKes = usdToKesRate !== null ? Math.ceil(monthlyUsdWithMargin * usdToKesRate) : null;

  const displayMonthly = monthlyKes ?? monthlyUsdWithMargin;
  const displayCurrency = monthlyKes !== null ? "KES" : "USD";

  return (
    <Card className="group transition-all hover:shadow-md hover:border-primary/50 h-full flex flex-col">
      <CardHeader className="pb-3">
        {/* Top row: Logo and Badges */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="shrink-0 h-12 w-12 flex items-center justify-center">
            {(() => {
              const brand = getCpuBrand(plan.product_name);
              if (!brand) return null;
              return (
                <img
                  src={brand === "intel" ? "/intel.svg" : "/amd.svg"}
                  alt={brand === "intel" ? "Intel" : "AMD"}
                  className="max-h-8 max-w-[2rem] object-contain"
                />
              );
            })()}
          </div>
          <div className="flex flex-col items-end gap-2">
            {plan.product_new && <Badge variant="secondary">New</Badge>}
            <div className="flex items-center gap-2">
              <Badge variant={isUnavailable ? "destructive" : "default"} className="uppercase text-[10px]">
                {isUnavailable ? "Out of Stock" : "Available"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Title row */}
        <CardTitle className="text-base font-semibold line-clamp-2" title={plan.product_name}>
          {plan.product_name}
        </CardTitle>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Available locations</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold line-clamp-1">{locationName || "Multiple Locations"}</p>
            </div>
          </div>

          {plan.product_on_sale && (
            <Badge variant="outline" className="border-primary text-primary">
              On sale
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3">
          {/* Product info */}
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Product info</p>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Network className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bandwidth</p>
                  <p className="font-semibold line-clamp-2 text-primary">{plan.product_bandwidth || " "}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Cpu className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CPU</p>
                  <p className="font-semibold line-clamp-2 text-primary">{plan.product_cpu || " "}</p>
                  {stripHtmlToText(plan.product_cpu_cores) ? (
                    <p className="text-xs text-muted-foreground mt-0.5">{stripHtmlToText(plan.product_cpu_cores)}</p>
                  ) : null}
                </div>
              </div>

              {(() => {
                const info = getProcessorSummary(plan.processor_info);
                if (!info?.vcpus) return null;
                return (
                  <div className="flex items-start gap-2">
                    <Cpu className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground tracking-wide">
                        <span className="lowercase">v</span>CPU's
                      </p>
                      <p className="font-semibold line-clamp-2 text-primary">{info.vcpus}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-start gap-2">
                <MemoryStick className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Memory</p>
                  <p className="font-semibold line-clamp-2 text-primary">{plan.product_memory || " "}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <HardDrive className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Drives</p>
                  <p className="font-semibold line-clamp-2 text-primary">{getDriveDescription(plan)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price</p>
          <div className="mt-1 flex flex-col gap-0.5">
            <p className="text-xl font-bold leading-tight text-primary">
              {formatMoney(displayMonthly, displayCurrency)}
              <span className="align-super text-xs font-semibold text-muted-foreground ml-1">/mo</span>
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-1">
          <Button
            className="w-full bg-primary text-primary-foreground"
            disabled={isUnavailable}
            onClick={() =>
              navigate(
                buildVpsCartUrl({
                  productId: plan.product_id,
                  planName: plan.product_name,
                  productName: "VPS Hosting",
                  monthlyPrice: displayMonthly,
                  currency: displayCurrency,
                  serviceType: "vps",
                  locationName: plan.data_center,
                }),
              )
            }
          >
            Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VpsPlanSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg mt-auto" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function VpsPlansSection() {
  const [plans, setPlans] = React.useState<VpsPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [pricingSettings, setPricingSettings] = React.useState<PricingSettings | null>(null);
  const [usdToKesRate, setUsdToKesRate] = React.useState<number | null>(null);
  const [facilities, setFacilities] = React.useState<Map<string, string>>(new Map());
  
  const [filter, setFilter] = React.useState<VpsPlanFilterType>(DEFAULT_VPS_FILTER);
  
  const [cursor, setCursor] = React.useState<number | null>(0);
  const limit = 6;

  React.useEffect(() => {
    let active = true;

    async function init() {
      try {
        const [plansRes, settings, rate, facRes] = await Promise.all([
          fetchVpsPlansPublic(0, limit),
          fetchVpsPricingSettings(),
          fetchExchangeRatesPublic(),
          fetchFacilitiesPublic(),
        ]);
        
        if (active) {
          setPlans(plansRes.plans);
          setCursor(plansRes.nextCursor);
          setPricingSettings(settings);
          setUsdToKesRate(rate);

          const facMap = new Map<string, string>();
          facRes.forEach(f => facMap.set(f.code, f.title));
          setFacilities(facMap);
        }
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load plans");
      } finally {
        if (active) setLoading(false);
      }
    }

    init();
    return () => { active = false; };
  }, []);

  const loadMore = async () => {
    if (cursor === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const [res, facRes] = await Promise.all([
        fetchVpsPlansPublic(cursor, limit),
        facilities.size === 0 ? fetchFacilitiesPublic() : Promise.resolve([])
      ]);
      
      setPlans((prev) => [...prev, ...res.plans]);
      setCursor(res.nextCursor);

      if (facRes.length > 0) {
        const facMap = new Map(facilities);
        facRes.forEach(f => facMap.set(f.code, f.title));
        setFacilities(facMap);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load more plans");
    } finally {
      setLoadingMore(false);
    }
  };

  const displayCurrency = usdToKesRate !== null ? "KES" : "USD";

  const displayPrices = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const p of plans) {
      const baseMargin = pricingSettings?.base ?? null;
      const monthlyUsdWithMargin = applyMarginWith(baseMargin, p.product_monthly_price ?? 0).final;
      const monthlyKes = usdToKesRate !== null ? Math.ceil(monthlyUsdWithMargin * usdToKesRate) : null;
      map.set(p.product_id, monthlyKes ?? monthlyUsdWithMargin);
    }
    return map;
  }, [plans, pricingSettings, usdToKesRate]);

  const filteredPlans = React.useMemo(
    () => applyVpsPlanFilter(plans, filter, displayPrices),
    [plans, filter, displayPrices]
  );

  return (
    <section className="py-20 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Choose Your VPS Plan</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            High-performance virtual private servers with guaranteed resources.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && plans.length > 0 && (
          <div className="mb-8">
            <VpsPlanFilter
              plans={plans}
              filter={filter}
              onFilterChange={setFilter}
              displayCurrency={displayCurrency}
              displayPrices={displayPrices}
              totalCount={plans.length}
              filteredCount={filteredPlans.length}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <VpsPlanSkeleton key={i} />)
          ) : filteredPlans.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-card/50">
              <p className="text-muted-foreground mb-4">No plans match your current filters.</p>
              <Button variant="outline" onClick={() => setFilter(DEFAULT_VPS_FILTER)}>Clear Filters</Button>
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <VpsPlanCard 
                key={plan.product_id} 
                plan={plan} 
                pricingSettings={pricingSettings}
                usdToKesRate={usdToKesRate}
                locationName={facilities.get(plan.data_center) ?? plan.data_center}
              />
            ))
          )}
        </div>

        {!loading && cursor !== null && (
          <div className="mt-12 flex justify-center">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={loadMore} 
              disabled={loadingMore}
              className="px-8"
            >
              {loadingMore ? "Loading..." : "Load More Plans"}
              {!loadingMore && <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
