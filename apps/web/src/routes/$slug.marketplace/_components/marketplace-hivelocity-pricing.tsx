"use client";

/**
 * Renders Hivelocity server plans for VPS, VDS, or Dedicated Servers inside
 * the marketplace service detail page.  The UI is intentionally identical to
 * $slug.vps._index.tsx / $slug.vds._index.tsx / $slug.dedicated-servers._index.tsx
 * (minus the Servers tab, which requires an active subscription to be useful).
 */

import * as React from "react";
import { useParams } from "react-router";
import { Search, HelpCircle } from "lucide-react";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { CloudServersPlansSplit } from "../../_components/cloud-servers-catalog";

import { inventoryToPlans as vpsInventoryToPlans } from "../../agency.vps/schema";
import { PlanCard as VpsPlanCard } from "../../agency.vps/_components/plan-card";
import { PlanCardSkeleton as VpsPlanCardSkeleton } from "../../agency.vps/_components/plan-card-skeleton";
import {
  VpsPlanFilter,
  type VpsPlanFilter as VpsPlanFilterType,
  DEFAULT_VPS_FILTER,
  applyVpsPlanFilter,
} from "../../agency.vps/_components/plan-filter";

import { inventoryToPlans as vdsInventoryToPlans } from "../../agency.vds/schema";
import { PlanCard as VdsPlanCard } from "../../agency.vds/_components/plan-card";
import { PlanCardSkeleton as VdsPlanCardSkeleton } from "../../agency.vds/_components/plan-card-skeleton";

import { inventoryToDedicatedPlans } from "../../agency.dedicated-servers/schema";
import { PlanCard as DedicatedPlanCard } from "../../agency.dedicated-servers/_components/plan-card";
import { PlanCardSkeleton as DedicatedPlanCardSkeleton } from "../../agency.dedicated-servers/_components/plan-card-skeleton";
import {
  PlanFilter as DedicatedPlanFilter,
  type DedicatedFilter,
  DEFAULT_FILTER as DEFAULT_DEDICATED_FILTER,
  applyDedicatedFilter,
} from "../../agency.dedicated-servers/_components/plan-filter";

import { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";
import { useHivelocityNiscProducts } from "@/hooks/use-hivelocity-nisc-products";
import { buildHivelocityPlanForCheckout } from "@/lib/build-hivelocity-service-plan";
import { HIVELOCITY_FACILITIES_QUERY_OPTIONS, HIVELOCITY_PLANS_QUERY_OPTIONS } from "@/lib/hivelocity-query-options";
import { resolveClientErrorMessage } from "@/lib/public-error-message";

export type HivelocityServiceType = "VPS" | "VDS" | "DEDICATED";

// ── VPS Plans section ─────────────────────────────────────────────────────────

function VpsPlansSection({ slug }: { slug: string }) {
  const limit = 24;
  const [buyNowOpen, setBuyNowOpen]   = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);
  const [dialogIntent, setDialogIntent] = React.useState<"buy_now" | "add_to_cart">("buy_now");
  const [filter, setFilter]           = React.useState<VpsPlanFilterType>(DEFAULT_VPS_FILTER);

  const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(undefined, HIVELOCITY_FACILITIES_QUERY_OPTIONS);
  const plansQuery = trpc.hivelocity.getVpsPlans.useInfiniteQuery(
    { location: "MAIN", include_custom: false, limit, cursor: 0 },
    { ...HIVELOCITY_PLANS_QUERY_OPTIONS, getNextPageParam: (p) => p.data?.nextCursor ?? undefined },
  );

  const plans = React.useMemo(() => {
    const items = plansQuery.data?.pages.flatMap((p) => p.data?.items ?? []) ?? [];
    return vpsInventoryToPlans({ FLAT: items });
  }, [plansQuery.data]);

  const pricing = useHivelocityPricing("VPS");
  const { productIdByType } = useHivelocityNiscProducts();
  const displayCurrency: "KES" | "USD" = pricing.usdToKesRate ? "KES" : "USD";
  const showOriginalUsd = Boolean(pricing.settings?.base.marginType);

  const displayPlans = React.useMemo(() => plans.map((p) => {
    const baseUsd = { monthly: p.product_monthly_price, hourly: p.product_hourly_price, monthlyKes: pricing.toKes(p.product_monthly_price), hourlyKes: pricing.toKes(p.product_hourly_price) };
    const monthly  = pricing.applyMargin(p.product_monthly_price);
    const hourly   = pricing.applyMargin(p.product_hourly_price);
    const original = p.product_original_price ? pricing.applyMargin(p.product_original_price) : null;
    if (displayCurrency === "KES") {
      return { ...p, __baseUsd: baseUsd, ...(showOriginalUsd ? { __originalUsd: baseUsd } : {}), product_monthly_price: pricing.toKes(monthly.final) ?? p.product_monthly_price, product_hourly_price: pricing.toKes(hourly.final) ?? p.product_hourly_price, product_original_price: p.product_original_price ? pricing.toKes(original?.final ?? p.product_original_price) ?? p.product_original_price : p.product_original_price };
    }
    return { ...p, __baseUsd: baseUsd, ...(showOriginalUsd ? { __originalUsd: baseUsd } : {}), product_monthly_price: monthly.final, product_hourly_price: hourly.final, product_original_price: p.product_original_price ? original?.final ?? p.product_original_price : p.product_original_price };
  }), [plans, pricing, displayCurrency, showOriginalUsd]);

  const displayPriceMap = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const p of displayPlans) map.set(p.product_id, p.product_monthly_price ?? 0);
    return map;
  }, [displayPlans]);

  const filteredPlans = React.useMemo(() => applyVpsPlanFilter(displayPlans as any, filter, displayPriceMap), [displayPlans, filter, displayPriceMap]);
  const activeFilterCount = [filter.cpuBrand !== "all", filter.memory !== "all", filter.cores !== "all"].filter(Boolean).length;

  const facilityTitleByCode = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const f of (facilitiesQuery.data?.data ?? [])) map.set(f.code, f.title);
    return map;
  }, [facilitiesQuery.data]);

  const openBuyNow = React.useCallback((p: any) => {
    setDialogIntent("buy_now");
    setSelectedPlan(buildHivelocityPlanForCheckout(p, { productType: "VPS", planTypeLabel: "VPS Hosting", displayCurrency, niscProductId: productIdByType.VPS, locationDisplayName: facilityTitleByCode.get(p.data_center) ?? p.data_center, pricing }));
    setBuyNowOpen(true);
  }, [displayCurrency, productIdByType, facilityTitleByCode, pricing]);

  const openCartFlow = React.useCallback((p: any) => {
    setDialogIntent("add_to_cart");
    setSelectedPlan(buildHivelocityPlanForCheckout(p, { productType: "VPS", planTypeLabel: "VPS Hosting", displayCurrency, niscProductId: productIdByType.VPS, locationDisplayName: facilityTitleByCode.get(p.data_center) ?? p.data_center, pricing }));
    setBuyNowOpen(true);
  }, [displayCurrency, productIdByType, facilityTitleByCode, pricing]);

  return (
    <>
      <CloudServersPlansSplit
        filter={
          !plansQuery.isLoading && !plansQuery.error && plans.length > 0 ? (
            <VpsPlanFilter plans={plans} filter={filter} onFilterChange={setFilter} displayCurrency={displayCurrency} displayPrices={displayPriceMap} totalCount={displayPlans.length} filteredCount={filteredPlans.length} />
          ) : null
        }
      >
      <PlanGrid
        isLoading={plansQuery.isLoading}
        error={plansQuery.error ? resolveClientErrorMessage(plansQuery.error, "Failed to load plans.") : null}
        isEmpty={plans.length === 0}
        noMatch={filteredPlans.length === 0 && activeFilterCount > 0}
        emptyLabel="No VPS plans found."
        onClearFilter={() => setFilter(DEFAULT_VPS_FILTER)}
        hasNextPage={plansQuery.hasNextPage}
        isFetchingNextPage={plansQuery.isFetchingNextPage}
        onLoadMore={() => plansQuery.fetchNextPage()}
      >
        {filteredPlans.map((p) => (
          <VpsPlanCard key={`${p.data_center}-${p.product_id}-${p.location_option_id}`} plan={p} locationName={facilityTitleByCode.get(p.data_center) ?? p.data_center} displayCurrency={displayCurrency} originalUsd={(p as any).__originalUsd} onBuyNow={openBuyNow} onAddToCart={openCartFlow} />
        ))}
        {plansQuery.isFetchingNextPage && Array.from({ length: 6 }).map((_, i) => <VpsPlanCardSkeleton key={i} />)}
      </PlanGrid>
      </CloudServersPlansSplit>

      {selectedPlan && (
        <BuyNowDialog open={buyNowOpen} onOpenChange={setBuyNowOpen} plan={selectedPlan} requireDomainStep={false} intent={dialogIntent} teamSlug={slug || undefined} buyDomainHref={slug ? `/${slug}/domains` : undefined} />
      )}
    </>
  );
}

// ── VDS Plans section ─────────────────────────────────────────────────────────

function VdsPlansSection({ slug }: { slug: string }) {
  const limit = 24;
  const [buyNowOpen, setBuyNowOpen]   = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);
  const [dialogIntent, setDialogIntent] = React.useState<"buy_now" | "add_to_cart">("buy_now");
  const [filter, setFilter]           = React.useState<VpsPlanFilterType>(DEFAULT_VPS_FILTER);

  const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(undefined, HIVELOCITY_FACILITIES_QUERY_OPTIONS);
  const plansQuery = trpc.hivelocity.getVdsPlans.useInfiniteQuery(
    { location: "MAIN", include_custom: false, limit, cursor: 0 },
    { ...HIVELOCITY_PLANS_QUERY_OPTIONS, getNextPageParam: (p) => p.data?.nextCursor ?? undefined },
  );

  const plans = React.useMemo(() => {
    const items = plansQuery.data?.pages.flatMap((p) => p.data?.items ?? []) ?? [];
    return vdsInventoryToPlans({ FLAT: items });
  }, [plansQuery.data]);

  const pricing = useHivelocityPricing("VDS");
  const { productIdByType } = useHivelocityNiscProducts();
  const displayCurrency: "KES" | "USD" = pricing.usdToKesRate ? "KES" : "USD";
  const showOriginalUsd = Boolean(pricing.settings?.base.marginType);

  const displayPlans = React.useMemo(() => plans.map((p) => {
    const baseUsd = { monthly: p.product_monthly_price, hourly: p.product_hourly_price, monthlyKes: pricing.toKes(p.product_monthly_price), hourlyKes: pricing.toKes(p.product_hourly_price) };
    const monthly  = pricing.applyMargin(p.product_monthly_price);
    const hourly   = pricing.applyMargin(p.product_hourly_price);
    const original = p.product_original_price ? pricing.applyMargin(p.product_original_price) : null;
    if (displayCurrency === "KES") {
      return { ...p, __baseUsd: baseUsd, ...(showOriginalUsd ? { __originalUsd: baseUsd } : {}), product_monthly_price: pricing.toKes(monthly.final) ?? p.product_monthly_price, product_hourly_price: pricing.toKes(hourly.final) ?? p.product_hourly_price, product_original_price: p.product_original_price ? pricing.toKes(original?.final ?? p.product_original_price) ?? p.product_original_price : p.product_original_price };
    }
    return { ...p, __baseUsd: baseUsd, ...(showOriginalUsd ? { __originalUsd: baseUsd } : {}), product_monthly_price: monthly.final, product_hourly_price: hourly.final, product_original_price: p.product_original_price ? original?.final ?? p.product_original_price : p.product_original_price };
  }), [plans, pricing, displayCurrency, showOriginalUsd]);

  const displayPriceMap = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const p of displayPlans) map.set(p.product_id, p.product_monthly_price ?? 0);
    return map;
  }, [displayPlans]);

  const filteredPlans = React.useMemo(() => applyVpsPlanFilter(displayPlans as any, filter, displayPriceMap), [displayPlans, filter, displayPriceMap]);
  const activeFilterCount = [filter.cpuBrand !== "all", filter.memory !== "all", filter.cores !== "all"].filter(Boolean).length;

  const facilityTitleByCode = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const f of (facilitiesQuery.data?.data ?? [])) map.set(f.code, f.title);
    return map;
  }, [facilitiesQuery.data]);

  const openBuyNow = React.useCallback((p: any) => {
    setDialogIntent("buy_now");
    setSelectedPlan(buildHivelocityPlanForCheckout(p, { productType: "VDS", planTypeLabel: "VDS Hosting", displayCurrency, niscProductId: productIdByType.VDS, locationDisplayName: facilityTitleByCode.get(p.data_center) ?? p.data_center, pricing }));
    setBuyNowOpen(true);
  }, [displayCurrency, productIdByType, facilityTitleByCode, pricing]);

  const openCartFlow = React.useCallback((p: any) => {
    setDialogIntent("add_to_cart");
    setSelectedPlan(buildHivelocityPlanForCheckout(p, { productType: "VDS", planTypeLabel: "VDS Hosting", displayCurrency, niscProductId: productIdByType.VDS, locationDisplayName: facilityTitleByCode.get(p.data_center) ?? p.data_center, pricing }));
    setBuyNowOpen(true);
  }, [displayCurrency, productIdByType, facilityTitleByCode, pricing]);

  return (
    <>
      <CloudServersPlansSplit
        filter={
          !plansQuery.isLoading && !plansQuery.error && plans.length > 0 ? (
            <VpsPlanFilter plans={plans as any} filter={filter} onFilterChange={setFilter} displayCurrency={displayCurrency} displayPrices={displayPriceMap} totalCount={displayPlans.length} filteredCount={filteredPlans.length} />
          ) : null
        }
      >
      <PlanGrid
        isLoading={plansQuery.isLoading}
        error={plansQuery.error ? resolveClientErrorMessage(plansQuery.error, "Failed to load plans.") : null}
        isEmpty={plans.length === 0}
        noMatch={filteredPlans.length === 0 && activeFilterCount > 0}
        emptyLabel="No VDS plans found."
        onClearFilter={() => setFilter(DEFAULT_VPS_FILTER)}
        hasNextPage={plansQuery.hasNextPage}
        isFetchingNextPage={plansQuery.isFetchingNextPage}
        onLoadMore={() => plansQuery.fetchNextPage()}
      >
        {filteredPlans.map((p) => (
          <VdsPlanCard key={`${p.data_center}-${p.product_id}-${p.location_option_id}`} plan={p} locationName={facilityTitleByCode.get(p.data_center) ?? p.data_center} displayCurrency={displayCurrency} originalUsd={(p as any).__originalUsd} onBuyNow={openBuyNow} onAddToCart={openCartFlow} />
        ))}
        {plansQuery.isFetchingNextPage && Array.from({ length: 6 }).map((_, i) => <VdsPlanCardSkeleton key={i} />)}
      </PlanGrid>
      </CloudServersPlansSplit>

      {selectedPlan && (
        <BuyNowDialog open={buyNowOpen} onOpenChange={setBuyNowOpen} plan={selectedPlan} requireDomainStep={false} intent={dialogIntent} teamSlug={slug || undefined} buyDomainHref={slug ? `/${slug}/domains` : undefined} />
      )}
    </>
  );
}

// ── Dedicated Plans section ───────────────────────────────────────────────────

function DedicatedPlansSection({ slug }: { slug: string }) {
  const limit = 24;
  const [buyNowOpen, setBuyNowOpen]   = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);
  const [dialogIntent, setDialogIntent] = React.useState<"buy_now" | "add_to_cart">("buy_now");
  const [filter, setFilter]           = React.useState<DedicatedFilter>(DEFAULT_DEDICATED_FILTER);
  const [location, setLocation]       = React.useState<"MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING">("MAIN");
  const [includeCustom, setIncludeCustom] = React.useState<"false" | "true">("false");
  const [facilityCode, setFacilityCode] = React.useState<string>("all");
  const [searchDraft, setSearchDraft] = React.useState("");
  const [search, setSearch]           = React.useState("");

  const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(undefined, HIVELOCITY_FACILITIES_QUERY_OPTIONS);
  const plansQuery = trpc.hivelocity.getDedicatedServerPlans.useInfiniteQuery(
    { location, include_custom: includeCustom === "true", facility_code: facilityCode === "all" ? undefined : facilityCode, search: search.length > 0 ? search : undefined, limit, cursor: 0 },
    { ...HIVELOCITY_PLANS_QUERY_OPTIONS, getNextPageParam: (p) => p.data?.nextCursor ?? undefined },
  );

  const plans = React.useMemo(() => {
    const items = plansQuery.data?.pages.flatMap((p) => p.data?.items ?? []) ?? [];
    return inventoryToDedicatedPlans({ FLAT: items });
  }, [plansQuery.data]);

  const pricing = useHivelocityPricing("DEDICATED_SERVERS");
  const { productIdByType } = useHivelocityNiscProducts();
  const displayCurrency: "KES" | "USD" = pricing.usdToKesRate ? "KES" : "USD";
  const showOriginalUsd = Boolean(pricing.settings?.base.marginType);

  const displayPlans = React.useMemo(() => plans.map((p) => {
    const baseUsd = { monthly: p.product_monthly_price, hourly: p.product_hourly_price, monthlyKes: pricing.toKes(p.product_monthly_price), hourlyKes: pricing.toKes(p.product_hourly_price) };
    const monthly  = pricing.applyMargin(p.product_monthly_price);
    const hourly   = pricing.applyMargin(p.product_hourly_price);
    const original = p.product_original_price ? pricing.applyMargin(p.product_original_price) : null;
    if (displayCurrency === "KES") {
      return { ...p, __baseUsd: baseUsd, ...(showOriginalUsd ? { __originalUsd: baseUsd } : {}), product_monthly_price: pricing.toKes(monthly.final) ?? p.product_monthly_price, product_hourly_price: pricing.toKes(hourly.final) ?? p.product_hourly_price, product_original_price: p.product_original_price ? pricing.toKes(original?.final ?? p.product_original_price) ?? p.product_original_price : p.product_original_price };
    }
    return { ...p, __baseUsd: baseUsd, ...(showOriginalUsd ? { __originalUsd: baseUsd } : {}), product_monthly_price: monthly.final, product_hourly_price: hourly.final, product_original_price: p.product_original_price ? original?.final ?? p.product_original_price : p.product_original_price };
  }), [plans, pricing, displayCurrency, showOriginalUsd]);

  const displayPriceMap = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const p of displayPlans) map.set(p.product_id, p.product_monthly_price ?? 0);
    return map;
  }, [displayPlans]);

  const filteredPlans = React.useMemo(() => applyDedicatedFilter(displayPlans as any, filter, displayPriceMap), [displayPlans, filter, displayPriceMap]);
  const activeFilterCount = [filter.cpuBrand !== "all", filter.memory !== "all", filter.cores !== "all"].filter(Boolean).length;

  const facilityOptions = React.useMemo(() => [...(facilitiesQuery.data?.data ?? [])].sort((a, b) => a.title.localeCompare(b.title)), [facilitiesQuery.data]);
  const facilityTitleByCode = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const f of facilityOptions) map.set(f.code, f.title);
    return map;
  }, [facilityOptions]);

  const openBuyNow = React.useCallback((p: any) => {
    setDialogIntent("buy_now");
    setSelectedPlan(buildHivelocityPlanForCheckout(p, { productType: "DEDICATED_SERVERS", planTypeLabel: "Dedicated Servers Hosting", displayCurrency, niscProductId: productIdByType.DEDICATED_SERVERS, locationDisplayName: facilityTitleByCode.get(p.data_center) ?? p.data_center, pricing }));
    setBuyNowOpen(true);
  }, [displayCurrency, productIdByType, facilityTitleByCode, pricing]);

  const openCartFlow = React.useCallback((p: any) => {
    setDialogIntent("add_to_cart");
    setSelectedPlan(buildHivelocityPlanForCheckout(p, { productType: "DEDICATED_SERVERS", planTypeLabel: "Dedicated Servers Hosting", displayCurrency, niscProductId: productIdByType.DEDICATED_SERVERS, locationDisplayName: facilityTitleByCode.get(p.data_center) ?? p.data_center, pricing }));
    setBuyNowOpen(true);
  }, [displayCurrency, productIdByType, facilityTitleByCode, pricing]);

  return (
    <>
      {/* Dedicated-specific top toolbar: search + custom toggle + location */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div className="w-full md:max-w-xl">
          <label className="text-xs text-muted-foreground">Search</label>
          <div className="mt-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search CPU, RAM, storage, bandwidth, product id..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchDraft.trim()); }}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setSearch(searchDraft.trim())} aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-end">
          <div className="w-full md:w-56">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Custom</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Includes custom-built dedicated server configurations.</TooltipContent>
              </Tooltip>
            </div>
            <RadioGroup className="mt-2 flex items-center gap-4" value={includeCustom} onValueChange={(v) => setIncludeCustom(v as any)}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="false" />Standard</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="true" />Include custom</label>
            </RadioGroup>
          </div>

          <div className="w-full md:w-64">
            <label className="text-xs text-muted-foreground">Location</label>
            <Select value={facilityCode} onValueChange={setFacilityCode}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="All locations" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {facilityOptions.map((f) => (
                  <SelectItem key={f.code} value={f.code}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <CloudServersPlansSplit
        filter={
          !plansQuery.isLoading && !plansQuery.error && plans.length > 0 ? (
            <DedicatedPlanFilter plans={plans} filter={filter} onFilterChange={setFilter} displayCurrency={displayCurrency} displayPrices={displayPriceMap} totalCount={displayPlans.length} filteredCount={filteredPlans.length} />
          ) : null
        }
      >
      <PlanGrid
        isLoading={plansQuery.isLoading}
        error={plansQuery.error ? resolveClientErrorMessage(plansQuery.error, "Failed to load plans.") : null}
        isEmpty={plans.length === 0}
        noMatch={filteredPlans.length === 0 && activeFilterCount > 0}
        emptyLabel="No dedicated server plans found."
        onClearFilter={() => setFilter(DEFAULT_DEDICATED_FILTER)}
        hasNextPage={plansQuery.hasNextPage}
        isFetchingNextPage={plansQuery.isFetchingNextPage}
        onLoadMore={() => plansQuery.fetchNextPage()}
      >
        {filteredPlans.map((p) => (
          <DedicatedPlanCard key={`${p.data_center}-${p.product_id}-${p.location_option_id}`} plan={p} locationName={facilityTitleByCode.get(p.data_center) ?? p.data_center} displayCurrency={displayCurrency} originalUsd={(p as any).__originalUsd} onBuyNow={openBuyNow} onAddToCart={openCartFlow} />
        ))}
        {plansQuery.isFetchingNextPage && Array.from({ length: 6 }).map((_, i) => <DedicatedPlanCardSkeleton key={i} />)}
      </PlanGrid>
      </CloudServersPlansSplit>

      {selectedPlan && (
        <BuyNowDialog open={buyNowOpen} onOpenChange={setBuyNowOpen} plan={selectedPlan} requireDomainStep={false} intent={dialogIntent} teamSlug={slug || undefined} buyDomainHref={slug ? `/${slug}/domains` : undefined} />
      )}
    </>
  );
}

// ── Shared PlanGrid wrapper ───────────────────────────────────────────────────

function PlanGrid({
  isLoading, error, isEmpty, noMatch, emptyLabel, onClearFilter,
  hasNextPage, isFetchingNextPage, onLoadMore, children,
}: {
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  noMatch: boolean;
  emptyLabel: string;
  onClearFilter: () => void;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
        <p className="text-muted-foreground">Loading plans...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  if (noMatch) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg gap-3">
        <p className="text-muted-foreground">No plans match your filters.</p>
        <Button variant="outline" size="sm" onClick={onClearFilter}>Clear filters</Button>
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
        <p className="text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 @xl/cards:grid-cols-2 @4xl/cards:grid-cols-3">
        {children}
      </div>
      <div className="flex justify-center">
        <Button
          variant="outline"
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={onLoadMore}
        >
          {isFetchingNextPage ? "Loading more..." : hasNextPage ? "Load more" : "No more plans"}
        </Button>
      </div>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function MarketplaceHivelocityPricing({ type }: { type: HivelocityServiceType }) {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  if (type === "VPS")       return <VpsPlansSection slug={slug} />;
  if (type === "VDS")       return <VdsPlansSection slug={slug} />;
  if (type === "DEDICATED") return <DedicatedPlansSection slug={slug} />;
  return null;
}

/**
 * Returns the Hivelocity service type for a given marketplace slug, or null if
 * the slug does not correspond to a Hivelocity-backed service.
 */
export function getHivelocityTypeForSlug(slug: string): HivelocityServiceType | null {
  if (slug.includes("dedicated")) return "DEDICATED";
  if (slug.includes("vds"))       return "VDS";
  if (slug.includes("vps"))       return "VPS";
  return null;
}
