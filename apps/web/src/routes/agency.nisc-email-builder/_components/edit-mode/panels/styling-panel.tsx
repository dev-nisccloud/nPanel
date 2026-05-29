"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { InspectorSection } from "../inspector-section";
import {
	PresetSizeToggle,
	RADIUS_PRESETS,
	SPACING_PRESETS,
	SpacingInputs,
} from "../inspector-ui";
import {
	applyInlineStyle,
	applyPadding,
	getLayoutTarget,
	type NebElementSnapshot,
} from "../html-edit-client";

type StylingPanelProps = {
	element: HTMLElement;
	snapshot: NebElementSnapshot;
	onChange: () => void;
	/** Text blocks get padding + radius; images get corner radius only */
	variant?: "text" | "image";
};

export function StylingPanel({
	element,
	snapshot,
	onChange,
	variant = "text",
}: StylingPanelProps) {
	const [pad, setPad] = React.useState({
		top: Number(snapshot.paddingTop) || 0,
		right: Number(snapshot.paddingRight) || 0,
		bottom: Number(snapshot.paddingBottom) || 0,
		left: Number(snapshot.paddingLeft) || 0,
	});
	const [applyAll, setApplyAll] = React.useState(
		pad.top === pad.right && pad.right === pad.bottom && pad.bottom === pad.left,
	);

	React.useEffect(() => {
		const next = {
			top: Number(snapshot.paddingTop) || 0,
			right: Number(snapshot.paddingRight) || 0,
			bottom: Number(snapshot.paddingBottom) || 0,
			left: Number(snapshot.paddingLeft) || 0,
		};
		setPad(next);
		setApplyAll(
			next.top === next.right && next.right === next.bottom && next.bottom === next.left,
		);
	}, [
		snapshot.id,
		snapshot.paddingTop,
		snapshot.paddingRight,
		snapshot.paddingBottom,
		snapshot.paddingLeft,
	]);

	const applyPad = (next: typeof pad) => {
		setPad(next);
		applyPadding(element, next);
		onChange();
	};

	const radiusTarget =
		variant === "image" ? element : getLayoutTarget(element);

	return (
		<InspectorSection title="Styling" sectionId="styling">
			<div className="space-y-4">
				{variant === "text" ? (
					<div className="space-y-2">
						<Label className="text-sm font-normal">Padding</Label>
						<PresetSizeToggle
							onChange={(v) => applyPad(SPACING_PRESETS[v])}
						/>
						<SpacingInputs
							values={pad}
							onChange={applyPad}
							applyAll={applyAll}
							onApplyAllChange={setApplyAll}
						/>
					</div>
				) : null}

				<div className="space-y-2">
					<Label className="text-sm font-normal">Corner radius</Label>
					<PresetSizeToggle
						onChange={(v) => {
							applyInlineStyle(radiusTarget, {
								borderRadius: RADIUS_PRESETS[v],
							});
							onChange();
						}}
					/>
					<div className="relative">
						<Input
							type="number"
							min={0}
							max={48}
							className="h-9 pr-7"
							value={snapshot.borderRadius || "0"}
							onChange={(e) => {
								applyInlineStyle(radiusTarget, {
									borderRadius: `${e.target.value}px`,
								});
								onChange();
							}}
						/>
						<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
							px
						</span>
					</div>
				</div>
			</div>
		</InspectorSection>
	);
}
