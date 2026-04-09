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

export default function DedicatedServersPage() {
	const limit = 24;

	const [location, setLocation] = React.useState<"MAIN" | "CUSTOM_DISPLAY" | "MASSIVESTORAGE" | "GPU" | "OUTLET" | "LANDING">("MAIN");
	const [includeCustom, setIncludeCustom] = React.useState<"false" | "true">("false");
	const [facilityCode, setFacilityCode] = React.useState<string>("all");

	const [searchDraft, setSearchDraft] = React.useState("");
	const [search, setSearch] = React.useState("");

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
		// Keep UI-side shaping resilient (null names, etc).
		return inventoryToDedicatedPlans({ FLAT: items });
	}, [plansQuery.data]);

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
						{/* Left: search + button */}
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

						{/* Right: filters */}
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
							) : plans.length === 0 ? (
								<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
									<p className="text-muted-foreground">No dedicated server plans found.</p>
								</div>
							) : (
								<div className="space-y-6">
									<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
										{plans.map((p) => (
											<PlanCard
												key={`${p.data_center}-${p.product_id}-${p.location_option_id}`}
												plan={p}
												locationName={facilityTitleByCode.get(p.data_center) ?? p.data_center}
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
							<div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
								<p className="text-muted-foreground">Settings tab coming soon...</p>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}

