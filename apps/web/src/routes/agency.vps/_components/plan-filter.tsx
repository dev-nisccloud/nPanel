"use client";

import * as React from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { VpsPlan } from "../schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VpsPlanFilter {
	cpuBrand: "all" | "intel" | "amd";
	memory: string;  // "all" | exact product_memory string
	cores: string;   // "all" | exact core count string
	priceMin: number;
	priceMax: number;
}

export const DEFAULT_VPS_FILTER: VpsPlanFilter = {
	cpuBrand: "all",
	memory: "all",
	cores: "all",
	priceMin: 0,
	priceMax: Infinity,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCpuBrand(productName: string | undefined): "intel" | "amd" | null {
	const name = (productName ?? "").toLowerCase();
	if (name.includes("amd")) return "amd";
	if (name.includes("intel")) return "intel";
	return null;
}

function getProcessorCores(processorInfo: unknown): number | null {
	if (!processorInfo || typeof processorInfo !== "object" || Array.isArray(processorInfo)) return null;
	const r = processorInfo as Record<string, unknown>;
	return typeof r.cores === "number" ? r.cores : null;
}

function parseMemoryToBytes(mem: string): number {
	const lower = mem.toLowerCase().replace(/\s/g, "");
	const units: Record<string, number> = { mb: 1, gb: 1024, tb: 1024 * 1024, pb: 1024 * 1024 * 1024 };
	let total = 0;
	const re = /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(mb|gb|tb|pb)|(\d+(?:\.\d+)?)\s*(mb|gb|tb|pb)/gi;
	let match: RegExpExecArray | null;
	while ((match = re.exec(lower)) !== null) {
		if (match[1] && match[2] && match[3]) total += Number(match[1]) * Number(match[2]) * (units[match[3]] ?? 1);
		else if (match[4] && match[5]) total += Number(match[4]) * (units[match[5]] ?? 1);
	}
	return total || 0;
}

export function applyVpsPlanFilter(
	plans: VpsPlan[],
	filter: VpsPlanFilter,
	displayPrices: Map<number, number>,
): VpsPlan[] {
	return plans.filter((plan) => {
		// CPU brand — VPS/VDS encode brand in product_name
		if (filter.cpuBrand !== "all") {
			const brand = getCpuBrand(plan.product_name);
			if (brand === null || brand !== filter.cpuBrand) return false;
		}

		// Memory
		if (filter.memory !== "all" && plan.product_memory !== filter.memory) return false;

		// Cores
		if (filter.cores !== "all") {
			const cores = getProcessorCores(plan.processor_info);
			if (cores === null || String(cores) !== filter.cores) return false;
		}

		// Price
		const price = displayPrices.get(plan.product_id) ?? plan.product_monthly_price ?? 0;
		if (filter.priceMin > 0 && price < filter.priceMin) return false;
		if (filter.priceMax !== Infinity && price > filter.priceMax) return false;

		return true;
	});
}

// ─── Dual Range Slider ────────────────────────────────────────────────────────

const DualRangeSlider = React.memo(function DualRangeSlider({
	min,
	max,
	valueMin,
	valueMax,
	onChange,
	formatLabel,
}: {
	min: number;
	max: number;
	valueMin: number;
	valueMax: number;
	onChange: (min: number, max: number) => void;
	formatLabel: (v: number) => string;
}) {
	const toPercent = (v: number) => Math.round(((v - min) / (max - min)) * 100);
	const leftPct = toPercent(valueMin);
	const rightPct = toPercent(valueMax);

	return (
		<div className="px-1">
			<div className="relative h-2 rounded-full bg-muted">
				<div className="absolute top-0 h-2 rounded-full bg-primary" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
				<input
					type="range" min={min} max={max}
					step={Math.max(1, Math.round((max - min) / 100))}
					value={valueMin}
					onChange={(e) => { const v = Number(e.target.value); onChange(Math.min(v, valueMax - 1), valueMax); }}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					style={{ zIndex: valueMin > max - (max - min) * 0.1 ? 5 : 3 }}
				/>
				<input
					type="range" min={min} max={max}
					step={Math.max(1, Math.round((max - min) / 100))}
					value={valueMax}
					onChange={(e) => { const v = Number(e.target.value); onChange(valueMin, Math.max(v, valueMin + 1)); }}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					style={{ zIndex: 4 }}
				/>
				<div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm pointer-events-none" style={{ left: `calc(${leftPct}% - 8px)` }} />
				<div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm pointer-events-none" style={{ left: `calc(${rightPct}% - 8px)` }} />
			</div>
			<div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
				<span className="font-medium text-foreground">{formatLabel(valueMin)}</span>
				<span className="font-medium text-foreground">{formatLabel(valueMax)}</span>
			</div>
		</div>
	);
});

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface VpsPlanFilterProps {
	plans: VpsPlan[];
	filter: VpsPlanFilter;
	onFilterChange: (f: VpsPlanFilter) => void;
	displayCurrency: "KES" | "USD";
	displayPrices: Map<number, number>;
	totalCount: number;
	filteredCount: number;
}

export const VpsPlanFilter = React.memo(function VpsPlanFilter({
	plans,
	filter,
	onFilterChange,
	displayCurrency,
	displayPrices,
	totalCount,
	filteredCount,
}: VpsPlanFilterProps) {
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

	// Debounced price slider — visual draft updates immediately, filter commits after 150ms
	const [draftPrice, setDraftPrice] = React.useState<{ min: number; max: number } | null>(null);
	const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const handlePriceChange = React.useCallback(
		(mn: number, mx: number) => {
			setDraftPrice({ min: mn, max: mx });
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				onFilterChange({ ...filter, priceMin: mn, priceMax: mx });
				setDraftPrice(null);
			}, 150);
		},
		[filter, onFilterChange],
	);

	React.useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

	const effectiveMin = draftPrice?.min ?? (filter.priceMin === 0 ? priceRange.min : Math.max(filter.priceMin, priceRange.min));
	const effectiveMax = draftPrice?.max ?? (filter.priceMax === Infinity ? priceRange.max : Math.min(filter.priceMax, priceRange.max));

	const activeCount = [
		filter.cpuBrand !== "all",
		filter.memory !== "all",
		filter.cores !== "all",
		filter.priceMin > priceRange.min || filter.priceMax < priceRange.max,
	].filter(Boolean).length;

	const formatPrice = React.useCallback(
		(v: number) =>
			displayCurrency === "KES"
				? `KES ${v.toLocaleString()}`
				: `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
		[displayCurrency],
	);

	const reset = React.useCallback(
		() => onFilterChange({ ...DEFAULT_VPS_FILTER, priceMin: priceRange.min, priceMax: priceRange.max }),
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
						<Badge variant="secondary" className="text-xs h-5 px-1.5">{activeCount}</Badge>
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

			{/* Controls */}
			<div className="px-4 py-4 flex flex-wrap gap-6 items-start">
				{/* CPU Brand */}
				<div className="flex flex-col gap-2 min-w-[120px]">
					<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CPU Brand</label>
					<div className="flex gap-1.5">
						{(["all", "intel", "amd"] as const).map((brand) => (
							<button
								key={brand}
								onClick={() => onFilterChange({ ...filter, cpuBrand: brand })}
								className={cn(
									"flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
									filter.cpuBrand === brand
										? "border-primary bg-primary/10 text-primary"
										: "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
								)}
							>
								{brand === "all" ? "All" : (
									<>
										<img src={brand === "intel" ? "/intel.svg" : "/amd.svg"} alt={brand} className="h-4 w-4 object-contain" />
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
						<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Memory</label>
						<Select value={filter.memory} onValueChange={(v) => onFilterChange({ ...filter, memory: v })}>
							<SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All memory" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All memory</SelectItem>
								{memoryOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Cores */}
				{coreOptions.length > 0 && (
					<div className="flex flex-col gap-2 min-w-[130px]">
						<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">vCPU Cores</label>
						<Select value={filter.cores} onValueChange={(v) => onFilterChange({ ...filter, cores: v })}>
							<SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All cores" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All cores</SelectItem>
								{coreOptions.map((c) => <SelectItem key={c} value={String(c)}>{c} cores</SelectItem>)}
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Price Range */}
				{priceRange.max > priceRange.min && (
					<div className="flex flex-col gap-2 flex-1 min-w-[200px] max-w-xs">
						<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Price</label>
						<DualRangeSlider
							min={priceRange.min} max={priceRange.max}
							valueMin={effectiveMin} valueMax={effectiveMax}
							onChange={handlePriceChange}
							formatLabel={formatPrice}
						/>
					</div>
				)}

				{/* Active chips */}
				{activeCount > 0 && (
					<div className="flex flex-col gap-2 min-w-0 self-end">
						<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</label>
						<div className="flex flex-wrap gap-1.5">
							{filter.cpuBrand !== "all" && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20" onClick={() => onFilterChange({ ...filter, cpuBrand: "all" })}>
									{filter.cpuBrand === "intel" ? "Intel" : "AMD"}<X className="h-3 w-3" />
								</span>
							)}
							{filter.memory !== "all" && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20" onClick={() => onFilterChange({ ...filter, memory: "all" })}>
									{filter.memory}<X className="h-3 w-3" />
								</span>
							)}
							{filter.cores !== "all" && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20" onClick={() => onFilterChange({ ...filter, cores: "all" })}>
									{filter.cores} cores<X className="h-3 w-3" />
								</span>
							)}
							{(filter.priceMin > priceRange.min || filter.priceMax < priceRange.max) && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20" onClick={() => onFilterChange({ ...filter, priceMin: priceRange.min, priceMax: priceRange.max })}>
									{formatPrice(effectiveMin)} – {formatPrice(effectiveMax)}<X className="h-3 w-3" />
								</span>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
});
