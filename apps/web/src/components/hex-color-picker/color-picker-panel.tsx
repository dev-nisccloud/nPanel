"use client";

import * as React from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";

import { PresetSwatches } from "./preset-swatches";
import { normalizeHex } from "./utils";

type ColorPickerPanelProps = {
	value: string;
	onChange: (hex: string) => void;
	/** Optional title above the picker */
	title?: string;
	presetColors?: readonly string[];
};

/** Popover panel: saturation picker, presets, and hex input. */
export function ColorPickerPanel({
	value,
	onChange,
	title,
	presetColors,
}: ColorPickerPanelProps) {
	const [internalValue, setInternalValue] = React.useState(value);

	React.useEffect(() => {
		setInternalValue(value);
	}, [value]);

	const commit = (v: string) => {
		setInternalValue(v);
		const normalized = normalizeHex(v);
		if (normalized) onChange(normalized);
	};

	return (
		<div className="w-[240px] space-y-3 p-3">
			{title ? <p className="text-xs font-medium text-foreground">{title}</p> : null}
			<HexColorPicker color={value} onChange={commit} className="!w-full" />
			<PresetSwatches value={value} onChange={commit} palette={presetColors} />
			<HexColorInput
				prefixed
				color={internalValue}
				onChange={commit}
				className="h-8 w-full rounded-md border border-input bg-background px-2 font-mono text-xs uppercase"
			/>
		</div>
	);
}
