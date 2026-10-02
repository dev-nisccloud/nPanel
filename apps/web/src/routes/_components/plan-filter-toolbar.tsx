"use client";

import * as React from "react";
import { RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PlanFilterChip = {
	id: string;
	label: string;
	onRemove: () => void;
};

const CPU_OPTIONS = [
	{ value: "all", label: "All" },
	{ value: "intel", label: "Intel" },
	{ value: "amd", label: "AMD" },
] as const;

export function PlanFilterToolbar({
	cpuBrand,
	onCpuBrandChange,
	memory,
	memoryOptions,
	onMemoryChange,
	cores,
	coreOptions,
	onCoresChange,
	coresLabel,
	priceControl,
	chips,
	filteredCount,
	totalCount,
	onReset,
}: {
	cpuBrand: "all" | "intel" | "amd";
	onCpuBrandChange: (brand: "all" | "intel" | "amd") => void;
	memory: string;
	memoryOptions: string[];
	onMemoryChange: (value: string) => void;
	cores: string;
	coreOptions: number[];
	onCoresChange: (value: string) => void;
	coresLabel: string;
	priceControl?: React.ReactNode;
	chips: PlanFilterChip[];
	filteredCount: number;
	totalCount: number;
	onReset: () => void;
}) {
	const cpuLabelId = React.useId();
	const memoryId = React.useId();
	const coresId = React.useId();

	return (
		<section aria-label="Filter plans" className="rounded-xl border bg-card p-3">
			<div className="flex items-start justify-between gap-2">
				<p className="text-sm text-muted-foreground" aria-live="polite">
					<span className="font-medium text-foreground">{filteredCount}</span>
					{" of "}
					<span className="font-medium text-foreground">{totalCount}</span>
				</p>
				{chips.length > 0 ? (
					<Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 gap-1.5 px-2" onClick={onReset}>
						<RotateCcw className="size-3.5" />
						Reset
					</Button>
				) : null}
			</div>

			<div className="mt-4 space-y-4">
				<div>
					<p id={cpuLabelId} className="mb-1.5 text-xs font-medium text-muted-foreground">
						CPU
					</p>
					<div
						role="group"
						aria-labelledby={cpuLabelId}
						className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/40 p-1"
					>
						{CPU_OPTIONS.map((option) => {
							const selected = cpuBrand === option.value;
							return (
								<button
									key={option.value}
									type="button"
									aria-pressed={selected}
									onClick={() => onCpuBrandChange(option.value)}
									className={cn(
										"inline-flex h-8 items-center justify-center gap-1 rounded-md px-1.5 text-sm font-medium transition-colors",
										selected
											? "bg-background text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{option.value === "all" ? (
										option.label
									) : (
										<>
											<img
												src={option.value === "intel" ? "/intel.svg" : "/amd.svg"}
												alt=""
												className="size-4 object-contain"
											/>
											<span className="truncate">{option.label}</span>
										</>
									)}
								</button>
							);
						})}
					</div>
				</div>

				{memoryOptions.length > 0 ? (
					<div>
						<Label htmlFor={memoryId} className="mb-1.5 text-xs font-medium text-muted-foreground">
							Memory
						</Label>
						<Select value={memory} onValueChange={onMemoryChange}>
							<SelectTrigger id={memoryId} className="h-9 w-full">
								<SelectValue placeholder="All memory" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All memory</SelectItem>
								{memoryOptions.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				) : null}

				{coreOptions.length > 0 ? (
					<div>
						<Label htmlFor={coresId} className="mb-1.5 text-xs font-medium text-muted-foreground">
							{coresLabel}
						</Label>
						<Select value={cores} onValueChange={onCoresChange}>
							<SelectTrigger id={coresId} className="h-9 w-full">
								<SelectValue placeholder="All cores" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All cores</SelectItem>
								{coreOptions.map((option) => (
									<SelectItem key={option} value={String(option)}>
										{option} cores
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				) : null}

				{priceControl ? (
					<div className="border-t pt-4">
						<p className="mb-2 text-xs font-medium text-muted-foreground">Monthly price</p>
						{priceControl}
					</div>
				) : null}

				{chips.length > 0 ? (
					<ul className="flex flex-wrap gap-1.5 border-t pt-4" aria-label="Active filters">
						{chips.map((chip) => (
							<li key={chip.id} className="max-w-full">
								<button
									type="button"
									onClick={chip.onRemove}
									className="inline-flex h-7 max-w-full items-center gap-1 rounded-full border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted"
								>
									<span className="truncate">{chip.label}</span>
									<X className="size-3 shrink-0 text-muted-foreground" aria-hidden />
									<span className="sr-only">Remove {chip.label} filter</span>
								</button>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</section>
	);
}
