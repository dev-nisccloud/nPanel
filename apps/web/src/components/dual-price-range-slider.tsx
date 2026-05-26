"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

type DualPriceRangeSliderProps = {
	min: number;
	max: number;
	valueMin: number;
	valueMax: number;
	onChange: (min: number, max: number) => void;
	formatLabel: (v: number) => string;
};

function getStep(min: number, max: number): number {
	return Math.max(1, Math.round((max - min) / 100));
}

function clampRange(min: number, max: number, lo: number, hi: number, step: number) {
	const gap = Math.max(step, 1);
	let nextLo = Math.max(min, Math.min(lo, max - gap));
	let nextHi = Math.min(max, Math.max(hi, min + gap));
	if (nextHi - nextLo < gap) {
		if (lo !== nextLo) nextHi = Math.min(max, nextLo + gap);
		else nextLo = Math.max(min, nextHi - gap);
	}
	return { lo: nextLo, hi: nextHi };
}

export function DualPriceRangeSlider({
	min,
	max,
	valueMin,
	valueMax,
	onChange,
	formatLabel,
}: DualPriceRangeSliderProps) {
	const step = React.useMemo(() => getStep(min, max), [min, max]);

	const handleSliderChange = React.useCallback(
		(values: number[]) => {
			const [lo, hi] = values;
			if (lo == null || hi == null) return;
			const next = clampRange(min, max, lo, hi, step);
			onChange(next.lo, next.hi);
		},
		[min, max, onChange, step],
	);

	const handleMinInput = React.useCallback(
		(raw: string) => {
			const parsed = Number(raw.replace(/,/g, "").trim());
			if (!Number.isFinite(parsed)) return;
			const next = clampRange(min, max, parsed, valueMax, step);
			onChange(next.lo, next.hi);
		},
		[min, max, onChange, step, valueMax],
	);

	const handleMaxInput = React.useCallback(
		(raw: string) => {
			const parsed = Number(raw.replace(/,/g, "").trim());
			if (!Number.isFinite(parsed)) return;
			const next = clampRange(min, max, valueMin, parsed, step);
			onChange(next.lo, next.hi);
		},
		[min, max, onChange, step, valueMin],
	);

	return (
		<div className="space-y-3">
			<Slider
				min={min}
				max={max}
				step={step}
				minStepsBetweenThumbs={1}
				value={[valueMin, valueMax]}
				onValueChange={handleSliderChange}
				aria-label="Monthly price range"
				className="py-1"
			/>
			<div className="flex items-center gap-2">
				<div className="flex-1 min-w-0 space-y-1">
					<label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Min
					</label>
					<Input
						type="number"
						min={min}
						max={valueMax - step}
						step={step}
						value={valueMin}
						onChange={(e) => handleMinInput(e.target.value)}
						className="h-8 text-xs tabular-nums"
						aria-label="Minimum monthly price"
					/>
				</div>
				<span className="text-muted-foreground pt-5 shrink-0" aria-hidden>
					–
				</span>
				<div className="flex-1 min-w-0 space-y-1">
					<label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Max
					</label>
					<Input
						type="number"
						min={valueMin + step}
						max={max}
						step={step}
						value={valueMax}
						onChange={(e) => handleMaxInput(e.target.value)}
						className="h-8 text-xs tabular-nums"
						aria-label="Maximum monthly price"
					/>
				</div>
			</div>
			<div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
				<span>{formatLabel(min)}</span>
				<span>{formatLabel(max)}</span>
			</div>
		</div>
	);
}
