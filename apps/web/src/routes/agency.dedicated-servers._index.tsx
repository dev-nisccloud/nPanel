"use client";

import * as React from "react";
import { Search, HelpCircle } from "lucide-react";

import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { inventoryToDedicatedPlans } from "./agency.dedicated-servers/schema";
import { PlanCard } from "./agency.dedicated-servers/_components/plan-card";
import { PlanCardSkeleton } from "./agency.dedicated-servers/_components/plan-card-skeleton";
import { PlanFilter, type DedicatedFilter, DEFAULT_FILTER, applyDedicatedFilter } from "./agency.dedicated-servers/_components/plan-filter";
import { HivelocityPricingMarginCard } from "./_components/hivelocity-pricing-margin-card";
import { HivelocityServersTable } from "./_components/hivelocity-servers-table";
import { useHivelocityPricing } from "@/hooks/use-hivelocity-pricing";
import { BuyNowDialog, type ServicePlanDetails } from "@/components/buy-now-dialog";
// import { toast } from "@/components/ui/sonner";

export default function DedicatedServersPage() {
	const limit = 24;

	const [location, setLocation] = React.useState<"MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING">("MAIN");
	const [includeCustom, setIncludeCustom] = React.useState<"false" | "true">("false");
	const [facilityCode, setFacilityCode] = React.useState<string>("all");

	const [searchDraft, setSearchDraft] = React.useState("");
	const [search, setSearch] = React.useState("");
	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const [selectedPlan, setSelectedPlan] = React.useState<ServicePlanDetails | null>(null);
	const [dialogIntent, setDialogIntent] = React.useState<"buy_now" | "add_to_cart">("buy_now");
	const [filter, setFilter] = React.useState<DedicatedFilter>(DEFAULT_FILTER);

	const facilitiesQuery = trpc.hivelocity.getFacilities.useQuery(undefined);

	const plansQuery = trpc.hivelocity.getDedicatedServerPlans.useInfiniteQuery(
		{
			location,
			include_custom: includeCustom === "true",
			facility_code: facilityCode === "all" ? undefined : facilityCode,
			search: search.length > 0 ? search : undefined,
			limit,
			cursor: 0,
		},
		{
			getNextPageParam: (lastPage) => lastPage.data?.nextCursor ?? undefined,
		},
	);

	const plans = React.useMemo(() => {
		const items = plansQuery.data?.pages.flatMap((p) => p.data?.items ?? []) ?? [];
		return inventoryToDedicatedPlans({ FLAT: items });
	}, [plansQuery.data]);

	const pricing = useHivelocityPricing("DEDICATED_SERVERS");

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
		for (const p of displayPlans) {
			map.set(p.product_id, p.product_monthly_price ?? 0);
		}
		return map;
	}, [displayPlans]);

	const filteredPlans = React.useMemo(
		() => applyDedicatedFilter(displayPlans as any, filter, displayPriceMap),
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

	const handleSearch = () => {
		setSearch(searchDraft.trim());
	};

	const openBuyNow = React.useCallback((p: any) => {
		setDialogIntent("buy_now");
		const base = (p as any).__baseUsd ?? { monthly: p.product_monthly_price, hourly: p.product_hourly_price };
		setSelectedPlan({
			planId: String(p.product_id),
			planName: p.product_name,
			planType: "Dedicated Servers Hosting",
			price: Number(p.product_monthly_price ?? 0),
			currency: displayCurrency,
			billingCycle: "MONTHLY",
			hivelocity: {
				productType: "DEDICATED_SERVERS",
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
			planType: "Dedicated Servers Hosting",
			price: Number(p.product_monthly_price ?? 0),
			currency: displayCurrency,
			billingCycle: "MONTHLY",
			hivelocity: {
				productType: "DEDICATED_SERVERS",
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
					<h1 className="text-base font-semibold tracking-tight">Dedicated Servers</h1>
					<p className="text-xs text-muted-foreground">
						Manage bare metal dedicated servers, tailored hardware deployed instantly with full control and root access.
					</p>
				</div>

				<div className="mt-6">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
										onKeyDown={(e) => {
											if (e.key === "Enter") handleSearch();
										}}
									/>
								</div>
								<Button variant="outline" size="icon" onClick={handleSearch} aria-label="Search plans">
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
										<TooltipContent>
											Includes custom-built dedicated server configurations in the catalog.
										</TooltipContent>
									</Tooltip>
								</div>
								<RadioGroup
									className="mt-2 flex items-center gap-4"
									value={includeCustom}
									onValueChange={(v) => setIncludeCustom(v as any)}
								>
									<label className="flex items-center gap-2 text-sm">
										<RadioGroupItem value="false" />
										Standard
									</label>
									<label className="flex items-center gap-2 text-sm">
										<RadioGroupItem value="true" />
										Include custom
									</label>
								</RadioGroup>
							</div>

							<div className="w-full md:w-64">
								<label className="text-xs text-muted-foreground">Location</label>
								<Select value={facilityCode} onValueChange={setFacilityCode}>
									<SelectTrigger className="mt-1">
										<SelectValue placeholder="All locations" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All locations</SelectItem>
										{facilityOptions.map((f) => (
											<SelectItem key={f.code} value={f.code}>
												{f.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
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
							{/* Client-side filter bar */}
							{!plansQuery.isLoading && !plansQuery.error && plans.length > 0 && (
								<div className="mb-5">
									<PlanFilter
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
										Failed to load plans: {plansQuery.error.message}
									</p>
								</div>
							) : filteredPlans.length === 0 && activeFilterCount > 0 ? (
								<div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg gap-3">
									<p className="text-muted-foreground">No plans match your filters.</p>
									<Button variant="outline" size="sm" onClick={() => setFilter(DEFAULT_FILTER)}>Clear filters</Button>
								</div>
							) : plans.length === 0 ? (
								<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
									<p className="text-muted-foreground">No dedicated server plans found.</p>
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
							<HivelocityServersTable type="dedicated" />
						</TabsContent>

						<TabsContent value="settings" className="mt-0">
							<div className="space-y-4">
								<HivelocityPricingMarginCard productType="DEDICATED_SERVERS" />
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
