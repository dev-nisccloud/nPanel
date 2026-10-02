"use client";

import * as React from "react";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { CloudServersCatalogLayout, CloudServersPlansSplit, CloudServersPlansStatus } from "./_components/cloud-servers-catalog";

import { inventoryToPlans } from "./agency.vds/schema";
import { PlanCard } from "./agency.vds/_components/plan-card";
import { PlanCardSkeleton } from "./agency.vds/_components/plan-card-skeleton";
import { VpsPlanFilter, type VpsPlanFilter as VpsPlanFilterType, DEFAULT_VPS_FILTER, applyVpsPlanFilter } from "./agency.vps/_components/plan-filter";
import { HivelocityPricingMarginCard } from "./_components/hivelocity-pricing-margin-card";
import { HivelocityServersTable } from "./_components/hivelocity-servers-table";
import { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";
import { useHivelocityNiscProducts } from "@/hooks/use-hivelocity-nisc-products";
import { buildHivelocityPlanForCheckout } from "@/lib/build-hivelocity-service-plan";
import { HIVELOCITY_FACILITIES_QUERY_OPTIONS, HIVELOCITY_PLANS_QUERY_OPTIONS } from "@/lib/hivelocity-query-options";
import { resolveClientErrorMessage } from "@/lib/public-error-message";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { captureEvent } from "@/lib/posthog";

export default function VdsPage() {
	const limit = 24;
	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);
	const [dialogIntent, setDialogIntent] = React.useState<"buy_now" | "add_to_cart">("buy_now");
	const [filter, setFilter] = React.useState<VpsPlanFilterType>(DEFAULT_VPS_FILTER);

	const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(undefined, HIVELOCITY_FACILITIES_QUERY_OPTIONS);

	const plansQuery = trpc.hivelocity.getVdsPlans.useInfiniteQuery(
		{ location: "MAIN", include_custom: false, limit, cursor: 0 },
		{ ...HIVELOCITY_PLANS_QUERY_OPTIONS, getNextPageParam: (lastPage) => lastPage.data?.nextCursor ?? undefined },
	);

	const plans = React.useMemo(() => {
		const items = plansQuery.data?.pages.flatMap((p) => p.data?.items ?? []) ?? [];
		return inventoryToPlans({ FLAT: items });
	}, [plansQuery.data]);

	const pricing = useHivelocityPricing("VDS");
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
				productType: "VDS",
				planTypeLabel: "VDS Hosting",
				displayCurrency,
				niscProductId: productIdByType.VDS,
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
				productType: "VDS",
				planTypeLabel: "VDS Hosting",
				displayCurrency,
				niscProductId: productIdByType.VDS,
				locationDisplayName: facilityTitleByCode.get(p.data_center) ?? p.data_center,
				pricing,
			}),
		);
		setBuyNowOpen(true);
	}, [displayCurrency, productIdByType, facilityTitleByCode, pricing]);

	return (
		<>
			<CloudServersCatalogLayout
				title="VDS Hosting"
				description="Manage Virtual Dedicated Servers (VDS) plans, dedicated virtual resources with consistent performance and control."
				tabs={[
					{ value: "plans", label: "Plans" },
					{ value: "servers", label: "Servers" },
					{ value: "settings", label: "Settings" },
				]}
			>
				<TabsContent value="plans" className="mt-0 data-[state=inactive]:hidden" forceMount>
					<div className="flex flex-col gap-4">
						<CloudServersPlansSplit
							filter={
								!plansQuery.isLoading && !plansQuery.error && plans.length > 0 ? (
									<VpsPlanFilter
										plans={plans}
										filter={filter}
										onFilterChange={setFilter}
										displayCurrency={displayCurrency}
										displayPrices={displayPriceMap}
										totalCount={displayPlans.length}
										filteredCount={filteredPlans.length}
									/>
								) : null
							}
						>
						<CloudServersPlansStatus
							isLoading={plansQuery.isLoading}
							errorMessage={
								plansQuery.error
									? resolveClientErrorMessage(plansQuery.error, "Failed to load plans. Please try again.")
									: null
							}
							filteredEmpty={filteredPlans.length === 0 && activeFilterCount > 0}
							empty={plans.length === 0}
							emptyMessage="No VDS plans found."
							onClearFilters={() => setFilter(DEFAULT_VPS_FILTER)}
						>
							<div className="space-y-6">
								<div className="grid grid-cols-1 gap-4 @xl/cards:grid-cols-2 @4xl/cards:grid-cols-3">
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
						</CloudServersPlansStatus>
						</CloudServersPlansSplit>
					</div>
				</TabsContent>

				<TabsContent value="servers" className="mt-0">
					<HivelocityServersTable type="vds" />
				</TabsContent>

				<TabsContent value="settings" className="mt-0">
					<HivelocityPricingMarginCard productType="VDS" />
				</TabsContent>
			</CloudServersCatalogLayout>
			{selectedPlan ? (
				<BuyNowDialog
					open={buyNowOpen}
					onOpenChange={setBuyNowOpen}
					plan={selectedPlan}
					requireDomainStep={false}
					intent={dialogIntent}
					buyDomainHref="/agency/domains"
				/>
			) : null}
		</>
	);
}

