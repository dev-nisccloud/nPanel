"use client";

import debounce from "lodash.debounce";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { InspectorSection } from "../inspector-section";
import {
	PresetSizeToggle,
	SPACING_PRESETS,
	SpacingInputs,
} from "../inspector-ui";
import {
	applyCellAlignment,
	applyDimensions,
	applyInlineStyle,
	applyPadding,
	type NebElementSnapshot,
} from "../html-edit-client";

type LayoutPanelProps = {
	element: HTMLElement;
	snapshot: NebElementSnapshot;
	onChange: () => void;
	variant?: "text" | "image";
};

export function LayoutPanel({
	element,
	snapshot,
	onChange,
	variant = "text",
}: LayoutPanelProps) {
	const [pad, setPad] = React.useState({
		top: Number(snapshot.paddingTop) || 0,
		right: Number(snapshot.paddingRight) || 0,
		bottom: Number(snapshot.paddingBottom) || 0,
		left: Number(snapshot.paddingLeft) || 0,
	});
	const [applyAll, setApplyAll] = React.useState(true);
	const [width, setWidth] = React.useState(snapshot.width || "");
	const [height, setHeight] = React.useState(snapshot.height || "");
	const widthRef = React.useRef(width);
	const heightRef = React.useRef(height);
	widthRef.current = width;
	heightRef.current = height;

	const applyImageDimensions = React.useCallback(
		(nextWidth: string, nextHeight: string) => {
			if (variant !== "image") return;
			applyDimensions(element, { width: nextWidth, height: nextHeight });
			onChange();
		},
		[element, onChange, variant],
	);

	const debouncedApplyImageDims = React.useMemo(
		() =>
			debounce((w: string, h: string) => {
				applyImageDimensions(w, h);
			}, 400),
		[applyImageDimensions],
	);

	React.useEffect(() => () => debouncedApplyImageDims.cancel(), [debouncedApplyImageDims]);

	React.useEffect(() => {
		setPad({
			top: Number(snapshot.paddingTop) || 0,
			right: Number(snapshot.paddingRight) || 0,
			bottom: Number(snapshot.paddingBottom) || 0,
			left: Number(snapshot.paddingLeft) || 0,
		});
		setWidth(snapshot.width || "");
		setHeight(snapshot.height || "");
	}, [
		snapshot.id,
		snapshot.paddingTop,
		snapshot.paddingRight,
		snapshot.paddingBottom,
		snapshot.paddingLeft,
		snapshot.width,
		snapshot.height,
	]);

	const applyPad = (next: typeof pad) => {
		setPad(next);
		applyPadding(element, next);
		onChange();
	};

	return (
		<InspectorSection title="Layout" sectionId="layout">
			<div className="space-y-4">
				<div className="space-y-2">
					<Label className="text-sm font-normal">Margin</Label>
					<PresetSizeToggle onChange={(v) => applyPad(SPACING_PRESETS[v])} />
					<SpacingInputs
						values={pad}
						onChange={applyPad}
						applyAll={applyAll}
						onApplyAllChange={setApplyAll}
					/>
				</div>

				{variant === "image" ? (
					<>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Width</Label>
								<div className="relative">
									<Input
										className="h-9 pr-7"
										value={width}
										onChange={(e) => {
											const v = e.target.value;
											setWidth(v);
											debouncedApplyImageDims(v, heightRef.current);
										}}
										onBlur={() => {
											debouncedApplyImageDims.cancel();
											applyImageDimensions(widthRef.current, heightRef.current);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												debouncedApplyImageDims.cancel();
												applyImageDimensions(widthRef.current, heightRef.current);
												(e.target as HTMLInputElement).blur();
											}
										}}
									/>
									<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
										px
									</span>
								</div>
							</div>
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Height</Label>
								<div className="relative">
									<Input
										className="h-9 pr-7"
										value={height}
										onChange={(e) => {
											const v = e.target.value;
											setHeight(v);
											debouncedApplyImageDims(widthRef.current, v);
										}}
										onBlur={() => {
											debouncedApplyImageDims.cancel();
											applyImageDimensions(widthRef.current, heightRef.current);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												debouncedApplyImageDims.cancel();
												applyImageDimensions(widthRef.current, heightRef.current);
												(e.target as HTMLInputElement).blur();
											}
										}}
									/>
									<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
										px
									</span>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Vertical Align</Label>
								<Select
									value={snapshot.verticalAlign || "top"}
									onValueChange={(v) => {
										applyCellAlignment(element, { vertical: v });
										onChange();
									}}
								>
									<SelectTrigger className="h-9">
										<SelectValue placeholder="Default" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="top">Top</SelectItem>
										<SelectItem value="middle">Middle</SelectItem>
										<SelectItem value="bottom">Bottom</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Horizontal Align</Label>
								<Select
									value={snapshot.horizontalAlign || "left"}
									onValueChange={(v) => {
										applyCellAlignment(element, { horizontal: v });
										onChange();
									}}
								>
									<SelectTrigger className="h-9">
										<SelectValue placeholder="Default" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="left">Left</SelectItem>
										<SelectItem value="center">Center</SelectItem>
										<SelectItem value="right">Right</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">Image fit</Label>
							<Select
								value={snapshot.objectFit || "fill"}
								onValueChange={(v) => {
									applyInlineStyle(element, { objectFit: v });
									onChange();
								}}
							>
								<SelectTrigger className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fill">fill</SelectItem>
									<SelectItem value="contain">contain</SelectItem>
									<SelectItem value="cover">cover</SelectItem>
									<SelectItem value="none">none</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</>
				) : null}
			</div>
		</InspectorSection>
	);
}
