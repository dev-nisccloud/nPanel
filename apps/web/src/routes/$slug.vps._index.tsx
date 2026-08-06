"use client";

import * as React from "react";
import { useParams } from "react-router";

import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { inventoryToPlans } from "./agency.vps/schema";
import { PlanCard } from "./agency.vps/_components/plan-card";
import { PlanCardSkeleton } from "./agency.vps/_components/plan-card-skeleton";
import { VpsPlanFilter, type VpsPlanFilter as VpsPlanFilterType, DEFAULT_VPS_FILTER, applyVpsPlanFilter } from "./agency.vps/_components/plan-filter";
import { HivelocityServersTable } from "./_components/hivelocity-servers-table";
import { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";
import { useHivelocityNiscProducts } from "@/hooks/use-hivelocity-nisc-products";
import { buildHivelocityPlanForCheckout } from "@/lib/build-hivelocity-service-plan";
import { HIVELOCITY_FACILITIES_QUERY_OPTIONS, HIVELOCITY_PLANS_QUERY_OPTIONS } from "@/lib/hivelocity-query-options";
import { resolveClientErrorMessage } from "@/lib/public-error-message";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { captureEvent } from "@/lib/posthog";

export default function VpsPage() {
	const params = useParams();
	const slug = typeof params.slug === "string" ? params.slug : "";
	const resourceBasePath = slug ? `/${slug}` : "/agency";

	const limit = 24;
	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);
	const [dialogIntent, setDialogIntent] = React.useState<"buy_now" | "add_to_cart">("buy_now");
	const [filter, setFilter] = React.useState<VpsPlanFilterType>(DEFAULT_VPS_FILTER);

	const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(undefined, HIVELOCITY_FACILITIES_QUERY_OPTIONS);

	const plansQuery = trpc.hivelocity.getVpsPlans.useInfiniteQuery(
		{ location: "MAIN", include_custom: false, limit, cursor: 0 },
		{ ...HIVELOCITY_PLANS_QUERY_OPTIONS, getNextPageParam: (lastPage) => lastPage.data?.nextCursor ?? undefined },
	);

	const plans = React.useMemo(() => {
		const items = plansQuery.data?.pages.flatMap((p) => p.data?.items ?? []) ?? [];
		return inventoryToPlans({ FLAT: items });
	}, [plansQuery.data]);

	const pricing = useHivelocityPricing("VPS");
	const { productIdByType } = useHivelocityNiscProducts();
	const displayCurrency: "KES" | "USD" = pricing.usdToKesRate ? "KES" : "USD";
	const showOriginalUsd = Boolean(pricing.settings?.base.marginType);

	const displayPlans = React.useMemo(() => {
		return plans.map((p) => {
			const baseUsd = {
				monthly: p.product_monthly_price,
				hourly: p.product_hourly_price,
				monthlyKes: pricing.toKes(p.product_monthly_price),
				hourlyKes: pricing.toKes(p.product_hourly_price),
			};
			const monthly = pricing.applyMargin(p.product_monthly_price);
			const hourly = pricing.applyMargin(p.product_hourly_price);
			const original = p.product_original_price ? pricing.applyMargin(p.product_original_price) : null;

			if (displayCurrency === "KES") {
				return {
					...p,
					__baseUsd: baseUsd,
					...(showOriginalUsd ? { __originalUsd: baseUsd } : {}),
					product_monthly_price: pricing.toKes(monthly.final) ?? p.product_monthly_price,
					product_hourly_price: pricing.toKes(hourly.final) ?? p.product_hourly_price,
					product_original_price: p.product_original_price
						? pricing.toKes(original?.final ?? p.product_original_price) ?? p.product_original_price
						: p.product_original_price,
				};
			}
			return {
				...p,
				__baseUsd: baseUsd,
				...(showOriginalUsd ? { __originalUsd: baseUsd } : {}),
				product_monthly_price: monthly.final,
				product_hourly_price: hourly.final,
				product_original_price: p.product_original_price ? original?.final ?? p.product_original_price : p.product_original_price,
			};
		});
	}, [plans, pricing, displayCurrency, showOriginalUsd]);

	const displayPriceMap = React.useMemo(() => {
		const map = new Map<number, number>();
		for (const p of displayPlans) map.set(p.product_id, p.product_monthly_price ?? 0);
		return map;
	}, [displayPlans]);

	const filteredPlans = React.useMemo(
		() => applyVpsPlanFilter(displayPlans as any, filter, displayPriceMap),
		[displayPlans, filter, displayPriceMap],
	);

	const activeFilterCount = [filter.cpuBrand !== "all", filter.memory !== "all", filter.cores !== "all"].filter(Boolean).length;

	const facilityOptions = React.useMemo(() => {
		const list = facilitiesQuery.data?.data ?? [];
		return [...list].sort((a, b) => a.title.localeCompare(b.title));
	}, [facilitiesQuery.data]);

	const facilityTitleByCode = React.useMemo(() => {
		const map = new Map<string, string>();
		for (const f of facilityOptions) map.set(f.code, f.title);
		return map;
	}, [facilityOptions]);

	const openBuyNow = React.useCallback((p: any) => {
		captureEvent("hivelocity_plan_viewed", {
			plan_type: p?.productType || p?.type || "unknown",
			specs: [p?.vcpu, p?.memory, p?.disk].filter(Boolean).join("/") || "unknown",
		});
		setDialogIntent("buy_now");
		setSelectedPlan(
			buildHivelocityPlanForCheckout(p, {
				productType: "VPS",
				planTypeLabel: "VPS Hosting",
				displayCurrency,
				niscProductId: productIdByType.VPS,
				locationDisplayName: facilityTitleByCode.get(p.data_center) ?? p.data_center,
				pricing,
			}),
		);
		setBuyNowOpen(true);
	}, [displayCurrency, productIdByType, facilityTitleByCode, pricing]);

	const openCartFlow = React.useCallback((p: any) => {
		setDialogIntent("add_to_cart");
		setSelectedPlan(
			buildHivelocityPlanForCheckout(p, {
				productType: "VPS",
				planTypeLabel: "VPS Hosting",
				displayCurrency,
				niscProductId: productIdByType.VPS,
				locationDisplayName: facilityTitleByCode.get(p.data_center) ?? p.data_center,
				pricing,
			}),
		);
		setBuyNowOpen(true);
	}, [displayCurrency, productIdByType, facilityTitleByCode, pricing]);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">VPS Hosting</h1>
					<p className="text-xs text-muted-foreground">
						Manage Virtual Private Servers (VPS) plans, fast, flexible virtual servers you can deploy and scale as needed.
					</p>
				</div>

				<div className="mt-6">
					<Tabs defaultValue="plans" className="w-full">
						<div className="flex justify-center mb-6">
							<TabsList className={cn("inline-flex w-auto")}>
								<TabsTrigger value="plans">Plans</TabsTrigger>
								<TabsTrigger value="servers">Servers</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="plans" className="mt-0 data-[state=inactive]:hidden" forceMount>
							{/* Client-side filter bar */}
							{!plansQuery.isLoading && !plansQuery.error && plans.length > 0 && (
								<div className="mb-5">
									<VpsPlanFilter
										plans={plans}
										filter={filter}
										onFilterChange={setFilter}
										displayCurrency={displayCurrency}
										displayPrices={displayPriceMap}
										totalCount={displayPlans.length}
										filteredCount={filteredPlans.length}
									/>
								</div>
							)}
							{plansQuery.isLoading ? (
								<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
									<p className="text-muted-foreground">Loading plans...</p>
								</div>
							) : plansQuery.error ? (
								<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
									<p className="text-muted-foreground">
										{resolveClientErrorMessage(plansQuery.error, "Failed to load plans. Please try again.")}
									</p>
								</div>
							) : filteredPlans.length === 0 && activeFilterCount > 0 ? (
								<div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg gap-3">
									<p className="text-muted-foreground">No plans match your filters.</p>
									<Button variant="outline" size="sm" onClick={() => setFilter(DEFAULT_VPS_FILTER)}>Clear filters</Button>
								</div>
							) : plans.length === 0 ? (
								<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
									<p className="text-muted-foreground">No VPS plans found.</p>
								</div>
							) : (
								<div className="space-y-6">
									<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
										{filteredPlans.map((p) => (
											<PlanCard
												key={`${p.data_center}-${p.product_id}-${p.location_option_id}`}
												plan={p}
												locationName={facilityTitleByCode.get(p.data_center) ?? p.data_center}
												displayCurrency={displayCurrency}
												originalUsd={(p as any).__originalUsd}
												onBuyNow={openBuyNow}
												onAddToCart={openCartFlow}
											/>
										))}
										{plansQuery.isFetchingNextPage &&
											Array.from({ length: 6 }).map((_, i) => <PlanCardSkeleton key={`skeleton-${i}`} />)}
									</div>
									<div className="flex justify-center">
										<Button
											variant="outline"
											disabled={!plansQuery.hasNextPage || plansQuery.isFetchingNextPage}
											onClick={() => plansQuery.fetchNextPage()}
										>
											{plansQuery.isFetchingNextPage ? "Loading more..." : plansQuery.hasNextPage ? "Load more" : "No more plans"}
										</Button>
									</div>
								</div>
							)}
						</TabsContent>

						<TabsContent value="servers" className="mt-0">
							<HivelocityServersTable type="vps" resourceBasePath={resourceBasePath} teamSlug={slug} />
						</TabsContent>
					</Tabs>
				</div>
			</div>
			{selectedPlan ? (
				<BuyNowDialog
					open={buyNowOpen}
					onOpenChange={setBuyNowOpen}
					plan={selectedPlan}
					requireDomainStep={false}
					intent={dialogIntent}
					teamSlug={slug || undefined}
					buyDomainHref={slug ? `/${slug}/domains` : undefined}
				/>
			) : null}
		</div>
	);
}
