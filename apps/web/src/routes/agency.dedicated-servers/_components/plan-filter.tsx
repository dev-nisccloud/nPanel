"use client";

import * as React from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DualPriceRangeSlider } from "@/components/dual-price-range-slider";
import type { DedicatedPlan } from "../schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DedicatedFilter {
	cpuBrand: "all" | "intel" | "amd";
	memory: string; // "all" | exact product_memory string
	cores: string;  // "all" | exact string
	priceMin: number;
	priceMax: number;
}

export const DEFAULT_FILTER: DedicatedFilter = {
	cpuBrand: "all",
	memory: "all",
	cores: "all",
	priceMin: 0,
	priceMax: Infinity,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCpuBrand(cpu: string | undefined): "intel" | "amd" {
	return (cpu ?? "").toLowerCase().includes("amd") ? "amd" : "intel";
}

function getProcessorCores(processorInfo: unknown): number | null {
	if (!processorInfo || typeof processorInfo !== "object" || Array.isArray(processorInfo)) return null;
	const r = processorInfo as Record<string, unknown>;
	return typeof r.cores === "number" ? r.cores : null;
}

/**
 * Parses a memory string like "16GB", "1TB", "512MB", "2x16GB", etc.
 * into a comparable byte value so we can sort lowest → largest correctly.
 */
function parseMemoryToBytes(mem: string): number {
	const lower = mem.toLowerCase().replace(/\s/g, "");
	const units: Record<string, number> = {
		mb: 1,
		gb: 1024,
		tb: 1024 * 1024,
		pb: 1024 * 1024 * 1024,
	};

	let total = 0;

	// handles patterns like "2x16gb", "4x32gb", "128gb", "1tb", etc.
	const re = /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(mb|gb|tb|pb)|(\d+(?:\.\d+)?)\s*(mb|gb|tb|pb)/gi;
	let match: RegExpExecArray | null;
	while ((match = re.exec(lower)) !== null) {
		if (match[1] && match[2] && match[3]) {
			// multiplier form: 2x16gb
			total += Number(match[1]) * Number(match[2]) * (units[match[3]] ?? 1);
		} else if (match[4] && match[5]) {
			// simple form: 128gb
			total += Number(match[4]) * (units[match[5]] ?? 1);
		}
	}

	return total || 0;
}

export function applyDedicatedFilter(plans: DedicatedPlan[], filter: DedicatedFilter, displayPrices: Map<number, number>): DedicatedPlan[] {
	return plans.filter((plan) => {
		// CPU brand
		if (filter.cpuBrand !== "all" && getCpuBrand(plan.product_cpu) !== filter.cpuBrand) return false;

		// Memory
		if (filter.memory !== "all" && plan.product_memory !== filter.memory) return false;

		// Cores
		if (filter.cores !== "all") {
			const cores = getProcessorCores(plan.processor_info);
			if (cores === null || String(cores) !== filter.cores) return false;
		}

		// Price (use display price if available)
		const price = displayPrices.get(plan.product_id) ?? plan.product_monthly_price ?? 0;
		if (filter.priceMin > 0 && price < filter.priceMin) return false;
		if (filter.priceMax !== Infinity && price > filter.priceMax) return false;

		return true;
	});
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface PlanFilterProps {
	plans: DedicatedPlan[];
	filter: DedicatedFilter;
	onFilterChange: (f: DedicatedFilter) => void;
	displayCurrency: "KES" | "USD";
	displayPrices: Map<number, number>;
	totalCount: number;
	filteredCount: number;
}

export const PlanFilter = React.memo(function PlanFilter({
	plans,
	filter,
	onFilterChange,
	displayCurrency,
	displayPrices,
	totalCount,
	filteredCount,
}: PlanFilterProps) {
	// Derive unique values from all plans — only recomputes when plans/prices change
	const { memoryOptions, coreOptions, priceRange } = React.useMemo(() => {
		const memories = new Set<string>();
		const cores = new Set<number>();
		let priceMin = Infinity;
		let priceMax = 0;

		for (const p of plans) {
			if (p.product_memory) memories.add(p.product_memory);
			const c = getProcessorCores(p.processor_info);
			if (c !== null) cores.add(c);
			const price = displayPrices.get(p.product_id) ?? p.product_monthly_price ?? 0;
			if (price < priceMin) priceMin = price;
			if (price > priceMax) priceMax = price;
		}

		return {
			memoryOptions: Array.from(memories)
				.map((m) => ({ m, bytes: parseMemoryToBytes(m) }))
				.sort((a, b) => a.bytes - b.bytes)
				.map((x) => x.m),
			coreOptions: Array.from(cores).sort((a, b) => a - b),
			priceRange: {
				min: Math.floor(priceMin === Infinity ? 0 : priceMin),
				max: Math.ceil(priceMax === 0 ? 1000 : priceMax),
			},
		};
	}, [plans, displayPrices]);

	// Local draft for the price slider — we only propagate after the user stops dragging
	// to avoid re-running applyDedicatedFilter on every pixel moved.
	const [draftPrice, setDraftPrice] = React.useState<{ min: number; max: number } | null>(null);
	const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const handlePriceChange = React.useCallback(
		(mn: number, mx: number) => {
			// Update the visual draft immediately (no filter recompute)
			setDraftPrice({ min: mn, max: mx });
			// Debounce the actual filter update by 150ms
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				onFilterChange({ ...filter, priceMin: mn, priceMax: mx });
				setDraftPrice(null);
			}, 150);
		},
		[filter, onFilterChange],
	);

	// Clean up timeout on unmount
	React.useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

	// Clamp filter price into the available range on mount / change
	const effectiveMin = draftPrice?.min ?? (filter.priceMin === 0 ? priceRange.min : Math.max(filter.priceMin, priceRange.min));
	const effectiveMax = draftPrice?.max ?? (filter.priceMax === Infinity ? priceRange.max : Math.min(filter.priceMax, priceRange.max));

	const activeCount = [
		filter.cpuBrand !== "all" ? 1 : 0,
		filter.memory !== "all" ? 1 : 0,
		filter.cores !== "all" ? 1 : 0,
		filter.priceMin > priceRange.min || filter.priceMax < priceRange.max ? 1 : 0,
	].reduce((a, b) => a + b, 0);

	const formatPrice = React.useCallback(
		(v: number) =>
			displayCurrency === "KES"
				? `KES ${v.toLocaleString()}`
				: `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
		[displayCurrency],
	);

	const reset = React.useCallback(
		() =>
			onFilterChange({
				...DEFAULT_FILTER,
				priceMin: priceRange.min,
				priceMax: priceRange.max,
			}),
		[onFilterChange, priceRange.min, priceRange.max],
	);

	return (
		<div className="rounded-xl border bg-card shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b">
				<div className="flex items-center gap-2">
					<SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-medium">Filters</span>
					{activeCount > 0 && (
						<Badge variant="secondary" className="text-xs h-5 px-1.5">
							{activeCount}
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-3">
					<span className="text-xs text-muted-foreground">
						Showing <span className="font-semibold text-foreground">{filteredCount}</span> of{" "}
						<span className="font-semibold text-foreground">{totalCount}</span> plans
					</span>
					{activeCount > 0 && (
						<Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={reset}>
							<RotateCcw className="h-3 w-3" />
							Reset
						</Button>
					)}
				</div>
			</div>

			{/* Filter controls */}
			<div className="px-4 py-4 flex flex-wrap gap-6 items-start">
				{/* CPU Brand */}
				<div className="flex flex-col gap-2 min-w-[120px]">
					<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						CPU Brand
					</label>
					<div className="flex gap-1.5">
						{(["all", "intel", "amd"] as const).map((brand) => (
							<button
								key={brand}
								onClick={() => onFilterChange({ ...filter, cpuBrand: brand })}
								className={cn(
									"flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
									filter.cpuBrand === brand
										? "border-primary bg-primary/10 text-primary"
										: "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
								)}
							>
								{brand === "all" ? (
									"All"
								) : (
									<>
										<img
											src={brand === "intel" ? "/intel.svg" : "/amd.svg"}
											alt={brand}
											className="h-4 w-4 object-contain"
										/>
										{brand === "intel" ? "Intel" : "AMD"}
									</>
								)}
							</button>
						))}
					</div>
				</div>

				{/* Memory */}
				{memoryOptions.length > 0 && (
					<div className="flex flex-col gap-2 min-w-[150px]">
						<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Memory
						</label>
						<Select
							value={filter.memory}
							onValueChange={(v) => onFilterChange({ ...filter, memory: v })}
						>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue placeholder="All memory" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All memory</SelectItem>
								{memoryOptions.map((m) => (
									<SelectItem key={m} value={m}>
										{m}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Cores */}
				{coreOptions.length > 0 && (
					<div className="flex flex-col gap-2 min-w-[130px]">
						<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							CPU Cores
						</label>
						<Select
							value={filter.cores}
							onValueChange={(v) => onFilterChange({ ...filter, cores: v })}
						>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue placeholder="All cores" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All cores</SelectItem>
								{coreOptions.map((c) => (
									<SelectItem key={c} value={String(c)}>
										{c} cores
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Price Range */}
				{priceRange.max > priceRange.min && (
					<div className="flex flex-col gap-2 flex-1 min-w-[220px] max-w-sm">
						<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Monthly Price
						</label>
						<DualPriceRangeSlider
							min={priceRange.min}
							max={priceRange.max}
							valueMin={effectiveMin}
							valueMax={effectiveMax}
							onChange={handlePriceChange}
							formatLabel={formatPrice}
						/>
					</div>
				)}

				{/* Active filter chips */}
				{activeCount > 0 && (
					<div className="flex flex-col gap-2 min-w-0 self-end">
						<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Active
						</label>
						<div className="flex flex-wrap gap-1.5">
							{filter.cpuBrand !== "all" && (
								<span
									className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
									onClick={() => onFilterChange({ ...filter, cpuBrand: "all" })}
								>
									{filter.cpuBrand === "intel" ? "Intel" : "AMD"}
									<X className="h-3 w-3" />
								</span>
							)}
							{filter.memory !== "all" && (
								<span
									className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
									onClick={() => onFilterChange({ ...filter, memory: "all" })}
								>
									{filter.memory}
									<X className="h-3 w-3" />
								</span>
							)}
							{filter.cores !== "all" && (
								<span
									className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
									onClick={() => onFilterChange({ ...filter, cores: "all" })}
								>
									{filter.cores} cores
									<X className="h-3 w-3" />
								</span>
							)}
							{(filter.priceMin > priceRange.min || filter.priceMax < priceRange.max) && (
								<span
									className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
									onClick={() => onFilterChange({ ...filter, priceMin: priceRange.min, priceMax: priceRange.max })}
								>
									{formatPrice(effectiveMin)} – {formatPrice(effectiveMax)}
									<X className="h-3 w-3" />
								</span>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
});
