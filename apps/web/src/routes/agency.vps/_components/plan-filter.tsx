"use client";

import * as React from "react";
import { DualPriceRangeSlider } from "@/components/dual-price-range-slider";
import { PlanFilterToolbar, type PlanFilterChip } from "../../_components/plan-filter-toolbar";
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
		// CPU brand - VPS/VDS encode brand in product_name
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

	// Debounced price slider - visual draft updates immediately, filter commits after 150ms
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

	const chips: PlanFilterChip[] = [
		filter.cpuBrand !== "all"
			? { id: "cpu", label: filter.cpuBrand === "intel" ? "Intel" : "AMD", onRemove: () => onFilterChange({ ...filter, cpuBrand: "all" }) }
			: null,
		filter.memory !== "all"
			? { id: "memory", label: filter.memory, onRemove: () => onFilterChange({ ...filter, memory: "all" }) }
			: null,
		filter.cores !== "all"
			? { id: "cores", label: `${filter.cores} cores`, onRemove: () => onFilterChange({ ...filter, cores: "all" }) }
			: null,
		filter.priceMin > priceRange.min || filter.priceMax < priceRange.max
			? {
					id: "price",
					label: `${formatPrice(effectiveMin)} – ${formatPrice(effectiveMax)}`,
					onRemove: () => onFilterChange({ ...filter, priceMin: priceRange.min, priceMax: priceRange.max }),
				}
			: null,
	].filter((chip): chip is PlanFilterChip => chip !== null);

	return (
		<PlanFilterToolbar
			cpuBrand={filter.cpuBrand}
			onCpuBrandChange={(cpuBrand) => onFilterChange({ ...filter, cpuBrand })}
			memory={filter.memory}
			memoryOptions={memoryOptions}
			onMemoryChange={(memory) => onFilterChange({ ...filter, memory })}
			cores={filter.cores}
			coreOptions={coreOptions}
			onCoresChange={(cores) => onFilterChange({ ...filter, cores })}
			coresLabel="vCPU cores"
			priceControl={
				priceRange.max > priceRange.min ? (
					<DualPriceRangeSlider
						min={priceRange.min}
						max={priceRange.max}
						valueMin={effectiveMin}
						valueMax={effectiveMax}
						onChange={handlePriceChange}
						formatLabel={formatPrice}
					/>
				) : null
			}
			chips={chips}
			filteredCount={filteredCount}
			totalCount={totalCount}
			onReset={reset}
		/>
	);
});
