"use client";

import * as React from "react";

import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { inventoryToPlans } from "./agency.vds/schema";
import { PlanCard } from "./agency.vds/_components/plan-card";
import { PlanCardSkeleton } from "./agency.vds/_components/plan-card-skeleton";
import { HivelocityPricingMarginCard } from "./_components/hivelocity-pricing-margin-card";
import { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
import { toast } from "@/components/ui/sonner";

export default function VdsPage() {
	const limit = 24;
	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);
	const [dialogIntent, setDialogIntent] = React.useState<"buy_now" | "add_to_cart">("buy_now");

	const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(undefined);

	const plansQuery = trpc.hivelocity.getVdsPlans.useInfiniteQuery(
		{
			location: "MAIN",
			include_custom: false,
			limit,
			cursor: 0,
		},
		{
			getNextPageParam: (lastPage) => lastPage.data?.nextCursor ?? undefined,
		},
	);

	const plans = React.useMemo(() => {
		const items = plansQuery.data?.pages.flatMap((p) => p.data?.items ?? []) ?? [];
		return inventoryToPlans({ FLAT: items });
	}, [plansQuery.data]);

	const pricing = useHivelocityPricing("VDS");
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
		setDialogIntent("buy_now");
		const base = (p as any).__baseUsd ?? { monthly: p.product_monthly_price, hourly: p.product_hourly_price };
		setSelectedPlan({
			planId: String(p.product_id),
			planName: p.product_name,
			planType: "VDS Hosting",
			price: Number(p.product_monthly_price ?? 0),
			currency: displayCurrency,
			billingCycle: "MONTHLY",
			hivelocity: {
				productType: "VDS",
				hivelocityProductId: Number(p.product_id),
				locationName: p.data_center,
				baseMonthlyUsd: Number(base.monthly ?? 0),
				baseHourlyUsd: Number(base.hourly ?? 0),
			},
		});
		setBuyNowOpen(true);
	}, [displayCurrency]);

	const openCartFlow = React.useCallback((p: any) => {
		setDialogIntent("add_to_cart");
		const base = (p as any).__baseUsd ?? { monthly: p.product_monthly_price, hourly: p.product_hourly_price };
		setSelectedPlan({
			planId: String(p.product_id),
			planName: p.product_name,
			planType: "VDS Hosting",
			price: Number(p.product_monthly_price ?? 0),
			currency: displayCurrency,
			billingCycle: "MONTHLY",
			hivelocity: {
				productType: "VDS",
				hivelocityProductId: Number(p.product_id),
				locationName: p.data_center,
				baseMonthlyUsd: Number(base.monthly ?? 0),
				baseHourlyUsd: Number(base.hourly ?? 0),
			},
		});
		setBuyNowOpen(true);
	}, [displayCurrency]);

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">VDS Hosting</h1>
					<p className="text-xs text-muted-foreground">
						Manage Virtual Dedicated Servers (VDS) plans, dedicated virtual resources with consistent performance and control.
					</p>
				</div>

				<div className="mt-6">
					<Tabs defaultValue="plans" className="w-full">
						<div className="flex justify-center mb-6">
							<TabsList className={cn("inline-flex w-auto")}>
								<TabsTrigger value="plans">Plans</TabsTrigger>
								<TabsTrigger value="servers">Servers</TabsTrigger>
								<TabsTrigger value="settings">Settings</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="plans" className="mt-0 data-[state=inactive]:hidden" forceMount>
							{plansQuery.isLoading ? (
								<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
									<p className="text-muted-foreground">Loading plans...</p>
								</div>
							) : plansQuery.error ? (
								<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
									<p className="text-muted-foreground">Failed to load plans: {plansQuery.error.message}</p>
								</div>
							) : plans.length === 0 ? (
								<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
									<p className="text-muted-foreground">No VDS plans found.</p>
								</div>
							) : (
								<div className="space-y-6">
									<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
										{displayPlans.map((p) => (
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
											{plansQuery.isFetchingNextPage
												? "Loading more..."
												: plansQuery.hasNextPage
													? "Load more"
													: "No more plans"}
										</Button>
									</div>
								</div>
							)}
						</TabsContent>

						<TabsContent value="servers" className="mt-0">
							<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
								<p className="text-muted-foreground">Servers tab coming soon...</p>
							</div>
						</TabsContent>

						<TabsContent value="settings" className="mt-0">
							<div className="space-y-4">
								<HivelocityPricingMarginCard productType="VDS" />
							</div>
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
				/>
			) : null}
		</div>
	);
}

