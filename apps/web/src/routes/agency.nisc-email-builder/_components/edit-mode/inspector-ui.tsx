"use client";

import * as React from "react";
import { Link2, Minus, SlidersHorizontal, Type } from "lucide-react";

import { coerceHexColor, HexColorPickerField } from "@/components/hex-color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

/** Hostinger-style row: label left, control right */
export function InspectorControlRow({
	label,
	children,
	className,
}: {
	label: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex items-center justify-between gap-3", className)}>
			<span className="text-sm text-foreground shrink-0">{label}</span>
			<div className="flex items-center justify-end gap-1 min-w-0">{children}</div>
		</div>
	);
}

export const SPACING_PRESETS = {
	S: { top: 8, right: 8, bottom: 8, left: 8 },
	M: { top: 16, right: 16, bottom: 16, left: 16 },
	L: { top: 24, right: 24, bottom: 24, left: 24 },
} as const;

export const RADIUS_PRESETS = { S: "4px", M: "8px", L: "16px" } as const;

export function PresetSizeToggle({
	value,
	onChange,
	showCustom = true,
}: {
	value?: "S" | "M" | "L" | "custom";
	onChange: (preset: "S" | "M" | "L") => void;
	showCustom?: boolean;
}) {
	return (
		<ToggleGroup
			type="single"
			value={value}
			className="w-full grid grid-cols-4 gap-0 rounded-lg border bg-muted/30 p-0.5 h-9"
			onValueChange={(v) => {
				if (v === "S" || v === "M" || v === "L") onChange(v);
			}}
		>
			<ToggleGroupItem
				value="S"
				className="h-7 rounded-md text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
			>
				S
			</ToggleGroupItem>
			<ToggleGroupItem
				value="M"
				className="h-7 rounded-md text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
			>
				M
			</ToggleGroupItem>
			<ToggleGroupItem
				value="L"
				className="h-7 rounded-md text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
			>
				L
			</ToggleGroupItem>
			{showCustom ? (
				<ToggleGroupItem
					value="custom"
					className="h-7 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
					aria-label="Custom"
					disabled
				>
					<SlidersHorizontal className="size-3.5 text-muted-foreground" />
				</ToggleGroupItem>
			) : null}
		</ToggleGroup>
	);
}

export function SpacingInputs({
	values,
	onChange,
	applyAll,
	onApplyAllChange,
}: {
	values: { top: number; right: number; bottom: number; left: number };
	onChange: (next: typeof values) => void;
	applyAll: boolean;
	onApplyAllChange: (v: boolean) => void;
}) {
	const setSide = (side: keyof typeof values, raw: string) => {
		const n = Number(raw) || 0;
		if (applyAll) {
			onChange({ top: n, right: n, bottom: n, left: n });
			return;
		}
		onChange({ ...values, [side]: n });
	};

	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				{(["top", "bottom", "left", "right"] as const).map((side) => (
					<div key={side} className="space-y-1">
						<Label className="text-xs text-muted-foreground capitalize">{side}</Label>
						<div className="relative">
							<Input
								type="number"
								min={0}
								max={120}
								className="h-9 pr-7"
								value={values[side]}
								onChange={(e) => setSide(side, e.target.value)}
							/>
							<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
								px
							</span>
						</div>
					</div>
				))}
			</div>
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
					<Link2 className="size-3.5" />
					Apply to all sides
				</div>
				<Switch checked={applyAll} onCheckedChange={onApplyAllChange} />
			</div>
		</div>
	);
}

export function ColorFieldPair({
	textColor,
	backgroundColor,
	onTextChange,
	onBackgroundChange,
}: {
	textColor: string;
	backgroundColor: string;
	onTextChange: (hex: string) => void;
	onBackgroundChange: (hex: string) => void;
}) {
	const text = coerceHexColor(textColor, "#000000");
	const bg = coerceHexColor(backgroundColor, "#ffffff");

	return (
		<div className="grid grid-cols-2 gap-3">
			<ColorField label="Text" value={text} onChange={onTextChange} />
			<ColorField
				label="Background"
				value={bg}
				onChange={onBackgroundChange}
				showPipetteIcon
			/>
		</div>
	);
}

function ColorField({
	label,
	value,
	onChange,
	showPipetteIcon,
}: {
	label: string;
	value: string;
	onChange: (hex: string) => void;
	showPipetteIcon?: boolean;
}) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs text-muted-foreground">{label}</Label>
			<div className="flex h-9 items-center gap-1.5 rounded-lg border bg-background px-2">
				<HexColorPickerField
					value={value}
					onChange={onChange}
					showPipetteIcon={showPipetteIcon}
				/>
			</div>
		</div>
	);
}

export const FONT_SIZE_OPTIONS = [
	"12",
	"14",
	"16",
	"18",
	"20",
	"24",
	"28",
	"32",
	"36",
	"48",
] as const;

export function listStyleFromHtml(html: string): "none" | "bullet" | "number" {
	if (html.trim().startsWith("<ol")) return "number";
	if (html.trim().startsWith("<ul")) return "bullet";
	return "none";
}

export function IconToggleGroup({
	value,
	onValueChange,
	items,
}: {
	value: string;
	onValueChange: (v: string) => void;
	items: { value: string; label: string; icon: React.ReactNode }[];
}) {
	return (
		<ToggleGroup
			type="single"
			value={value}
			onValueChange={(v) => {
				if (v) onValueChange(v);
			}}
			className="rounded-lg border bg-muted/30 p-0.5 gap-0"
		>
			{items.map((item) => (
				<ToggleGroupItem
					key={item.value}
					value={item.value}
					aria-label={item.label}
					className="h-7 min-w-8 px-2 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
				>
					{item.icon}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

export function FontFamilyTrigger({ label }: { label: string }) {
	return (
		<span className="flex items-center gap-2 min-w-0">
			<Type className="size-3.5 shrink-0 text-muted-foreground" />
			<span className="truncate">{label}</span>
		</span>
	);
}

export function ListStyleToggle({
	value,
	onValueChange,
}: {
	value: "none" | "bullet" | "number";
	onValueChange: (v: "none" | "bullet" | "number") => void;
}) {
	return (
		<IconToggleGroup
			value={value}
			onValueChange={(v) => onValueChange(v as "none" | "bullet" | "number")}
			items={[
				{ value: "none", label: "None", icon: <Minus className="size-4" /> },
				{
					value: "bullet",
					label: "Bulleted list",
					icon: <span className="text-sm leading-none">•≡</span>,
				},
				{
					value: "number",
					label: "Numbered list",
					icon: <span className="text-xs font-medium leading-none">1≡</span>,
				},
			]}
		/>
	);
}
