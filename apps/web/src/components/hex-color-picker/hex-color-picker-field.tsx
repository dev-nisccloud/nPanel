"use client";

import * as React from "react";
import { Pipette } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { ColorPickerPanel } from "./color-picker-panel";
import { coerceHexColor, normalizeHex } from "./utils";

type HexColorPickerFieldProps = {
	value: string;
	onChange: (hex: string) => void;
	className?: string;
	inputClassName?: string;
	/** Show pipette icon on swatch (visual only; opens same picker) */
	showPipetteIcon?: boolean;
	disabled?: boolean;
};

/**
 * Inline color field: swatch opens our picker popover + hex text input.
 * Use instead of `<input type="color" />`.
 */
export function HexColorPickerField({
	value,
	onChange,
	className,
	inputClassName,
	showPipetteIcon = false,
	disabled = false,
}: HexColorPickerFieldProps) {
	const [open, setOpen] = React.useState(false);
	const hex = coerceHexColor(value);

	const handleHexInput = (raw: string) => {
		const normalized = normalizeHex(raw);
		if (normalized) onChange(normalized);
		else if (raw.startsWith("#")) onChange(raw);
	};

	return (
		<div className={cn("flex min-w-0 flex-1 items-center gap-1.5", className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild disabled={disabled}>
					<button
						type="button"
						disabled={disabled}
						className={cn(
							"flex size-5 shrink-0 items-center justify-center rounded border shadow-sm transition-opacity",
							disabled && "opacity-50 cursor-not-allowed",
							!disabled && "hover:opacity-90",
						)}
						style={{ backgroundColor: hex }}
						aria-label="Open color picker"
					>
						{showPipetteIcon ? (
							<Pipette className="size-3 text-white drop-shadow-sm mix-blend-difference" />
						) : null}
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start" sideOffset={6}>
					<ColorPickerPanel value={hex} onChange={onChange} />
				</PopoverContent>
			</Popover>
			<Input
				className={cn(
					"h-7 min-w-0 flex-1 border-0 bg-transparent px-0 font-mono text-xs uppercase shadow-none focus-visible:ring-0",
					inputClassName,
				)}
				value={hex}
				disabled={disabled}
				onChange={(e) => handleHexInput(e.target.value)}
				onBlur={(e) => {
					const normalized = normalizeHex(e.target.value);
					if (normalized) onChange(normalized);
				}}
			/>
		</div>
	);
}
