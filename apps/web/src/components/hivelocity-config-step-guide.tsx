"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HivelocityConfigSectionStatus = {
	os: boolean;
	hostname: boolean;
};

function getScrollAreaViewport(container: HTMLElement | null): HTMLElement | null {
	if (!container) return null;
	const radixViewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
	if (radixViewport) return radixViewport;
	// Native overflow container (BuyNowDialogBodyScroll)
	if (container.scrollHeight > container.clientHeight || getComputedStyle(container).overflowY !== "visible") {
		return container;
	}
	return container;
}

/** Whether `target` is visible inside the dialog ScrollArea (not the OS table's inner scroll). */
export function useIsElementVisibleInScrollArea(
	scrollContainerRef: React.RefObject<HTMLElement | null>,
	targetRef: React.RefObject<HTMLElement | null>,
	enabled: boolean,
): boolean {
	const [visible, setVisible] = React.useState(false);

	React.useEffect(() => {
		if (!enabled) {
			setVisible(false);
			return;
		}

		const root = getScrollAreaViewport(scrollContainerRef.current);
		const target = targetRef.current;
		if (!root || !target) return;

		const observer = new IntersectionObserver(
			([entry]) => setVisible(entry.isIntersecting),
			{ root, threshold: 0.12, rootMargin: "-8px 0px 0px 0px" },
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [enabled, scrollContainerRef, targetRef]);

	return visible;
}

export function HivelocityConfigSectionProgress({
	status,
	addonCount = 0,
	className,
}: {
	status: HivelocityConfigSectionStatus;
	addonCount?: number;
	className?: string;
}) {
	const sections = [
		{ key: "os", label: "OS", done: status.os, required: true },
		{ key: "hostname", label: "Hostname", done: status.hostname, required: true },
		{
			key: "addons",
			label: "Add-ons",
			done: addonCount > 0,
			required: false,
			hint: addonCount > 0 ? `${addonCount} selected` : "Optional",
		},
	] as const;

	return (
		<div className={cn("rounded-lg border bg-muted/30 p-3", className)}>
			<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
				Complete all required sections
			</p>
			<ol className="flex flex-wrap gap-2">
				{sections.map((section, index) => (
					<li
						key={section.key}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
							section.done
								? "border-emerald-500/40 bg-emerald-500/10 text-foreground"
								: section.required
									? "border-amber-500/40 bg-amber-500/10 text-foreground"
									: "border-border bg-background text-muted-foreground",
						)}
					>
						<span
							className={cn(
								"flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
								section.done
									? "bg-emerald-600 text-white"
									: "bg-muted text-muted-foreground",
							)}
							aria-hidden
						>
							{section.done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : index + 1}
						</span>
						<span className="font-medium">{section.label}</span>
						{!section.required && "hint" in section && section.hint ? (
							<span className="text-[10px] text-muted-foreground">({section.hint})</span>
						) : null}
					</li>
				))}
			</ol>
		</div>
	);
}

export function HivelocityScrollForMoreHint({
	visible,
	onScrollToNext,
	label = "Hostname and add-ons are below - scroll the dialog to continue",
}: {
	visible: boolean;
	onScrollToNext: () => void;
	label?: string;
}) {
	if (!visible) return null;

	return (
		<div className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-2 text-sm text-foreground">
					<ChevronDown className="mt-0.5 h-4 w-4 shrink-0 animate-bounce text-primary" aria-hidden />
					<p>{label}</p>
				</div>
				<Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onScrollToNext}>
					Show hostname
				</Button>
			</div>
		</div>
	);
}

export function HivelocityConfigSectionHeading({
	step,
	title,
	description,
	required = false,
}: {
	step: number;
	title: string;
	description?: string;
	required?: boolean;
}) {
	return (
		<div className="flex items-start gap-3">
			<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
				{step}
			</span>
			<div className="min-w-0 pt-0.5">
				<p className="text-sm font-semibold text-foreground">
					{title}
					{required ? <span className="text-destructive ml-0.5">*</span> : null}
				</p>
				{description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
			</div>
		</div>
	);
}
