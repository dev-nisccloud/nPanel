"use client";

import * as React from "react";

import { ColorPickerPanel, normalizeHex } from "@/components/hex-color-picker";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const ROLE_LABELS = ["Primary", "Accent", "Secondary"] as const;
const ROLE_DEFAULTS = ["#2563eb", "#7c3aed", "#64748b"] as const;

/** Always three slots: primary, accent, secondary. */
export function padBrandColors(colors: string[]): [string, string, string] {
	return [colors[0] ?? "", colors[1] ?? "", colors[2] ?? ""];
}

export function compactBrandColors(slots: [string, string, string]): string[] {
	return slots.filter((c) => c.trim().length > 0);
}

type BrandColorEditorProps = {
	colors: string[];
	onChange: (colors: string[]) => void;
};

export function BrandColorEditor({ colors, onChange }: BrandColorEditorProps) {
	const slots = padBrandColors(colors);
	const [openIndex, setOpenIndex] = React.useState<number | null>(null);

	const updateSlot = (index: number, hex: string) => {
		const normalized = normalizeHex(hex);
		if (!normalized) return;
		const next = [...slots] as [string, string, string];
		next[index] = normalized;
		onChange(compactBrandColors(next));
	};

	const displayHex = (index: number) => slots[index] || ROLE_DEFAULTS[index];

	return (
		<div className="space-y-2">
			<div className="grid gap-2">
				{ROLE_LABELS.map((label, index) => {
					const hex = slots[index];
					const shown = displayHex(index);
					return (
						<div key={label} className="flex items-center gap-2">
							<Label className="text-xs w-16 shrink-0 text-muted-foreground">{label}</Label>
							<Popover
								open={openIndex === index}
								onOpenChange={(open) => setOpenIndex(open ? index : null)}
							>
								<PopoverTrigger asChild>
									<button
										type="button"
										className="flex flex-1 items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors text-left"
										aria-label={`Edit ${label} color`}
									>
										<span
											className="size-6 rounded-md border shadow-sm shrink-0"
											style={{
												backgroundColor: hex || shown,
												opacity: hex ? 1 : 0.45,
											}}
										/>
										<span className="font-mono uppercase text-[10px]">
											{hex || "Not set - click to pick"}
										</span>
									</button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<ColorPickerPanel
										title={label}
										value={shown}
										onChange={(v) => updateSlot(index, v)}
									/>
								</PopoverContent>
							</Popover>
						</div>
					);
				})}
			</div>
			<p className="text-[11px] text-muted-foreground">
				Colors are auto-detected from your website but may sometimes be inaccurate. Click any color to adjust it to match your exact brand.
			</p>
		</div>
	);
}
