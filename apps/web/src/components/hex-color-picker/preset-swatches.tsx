"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DEFAULT_PRESET_COLORS = [
	"#E11D48",
	"#DB2777",
	"#C026D3",
	"#9333EA",
	"#7C3AED",
	"#4F46E5",
	"#2563EB",
	"#0284C7",
	"#0891B2",
	"#0D9488",
	"#059669",
	"#16A34A",
	"#65A30D",
	"#CA8A04",
	"#D97706",
	"#EA580C",
	"#DC2626",
	"#FFFFFF",
	"#FAFAFA",
	"#F5F5F5",
	"#E5E5E5",
	"#D4D4D4",
	"#A3A3A3",
	"#737373",
	"#525252",
	"#404040",
	"#262626",
	"#171717",
	"#0A0A0A",
	"#000000",
] as const;

type PresetSwatchesProps = {
	value: string;
	onChange: (hex: string) => void;
	palette?: readonly string[];
};

export function PresetSwatches({
	value,
	onChange,
	palette = DEFAULT_PRESET_COLORS,
}: PresetSwatchesProps) {
	return (
		<div className="grid w-full grid-cols-6 gap-1">
			{palette.map((colorValue) => (
				<Button
					key={colorValue}
					type="button"
					variant="outline"
					onClick={() => onChange(colorValue)}
					className={cn(
						"h-6 w-6 min-w-0 rounded border-2 p-0",
						value.toLowerCase() === colorValue.toLowerCase()
							? "border-foreground"
							: "border-border",
					)}
					style={{ backgroundColor: colorValue }}
					aria-label={`Select ${colorValue}`}
				/>
			))}
		</div>
	);
}
