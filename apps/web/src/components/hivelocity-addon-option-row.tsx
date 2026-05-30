"use client";

import * as React from "react";
import { Info, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HivelocityAddonDisabledDetails } from "@/lib/hivelocity-option-compatibility";
import { cn } from "@/lib/utils";

type HivelocityAddonOptionRowProps = {
	name: string;
	checked: boolean;
	disabled: boolean;
	disabledDetails: HivelocityAddonDisabledDetails | null;
	displayPriceLabel: string;
	originalUsdLabel?: string | null;
	originalKesLabel?: string | null;
	showOriginal?: boolean;
	features?: {
		sshKey?: boolean;
		postInstall?: boolean;
		cloudInit?: boolean;
	} | null;
	tags?: string[];
	expressions?: string[];
	renderFeatureBadges?: (features: NonNullable<HivelocityAddonOptionRowProps["features"]>) => React.ReactNode;
	onSelect: () => void;
};

export function HivelocityAddonOptionRow({
	name,
	checked,
	disabled,
	disabledDetails,
	displayPriceLabel,
	originalUsdLabel,
	originalKesLabel,
	showOriginal = false,
	features,
	tags = [],
	expressions = [],
	renderFeatureBadges,
	onSelect,
}: HivelocityAddonOptionRowProps) {
	const showTooltip = disabled && Boolean(disabledDetails);

	const card = (
		<button
			type="button"
			onClick={onSelect}
			aria-disabled={disabled}
			className={cn(
				"w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
				disabled
					? "opacity-60 cursor-not-allowed bg-muted/20"
					: checked
						? "border-primary bg-primary/5"
						: "hover:border-primary/40",
			)}
		>
			<span className="min-w-0 flex-1">
				<span className="flex items-center gap-2">
					<span className="block font-medium line-clamp-1">{name}</span>
					{showTooltip ? (
						<Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
					) : null}
				</span>
				<span className="block text-sm font-semibold text-primary mt-1">{displayPriceLabel}</span>
				{showOriginal && originalUsdLabel ? (
					<span className="block mt-1 text-[11px] text-green-600 dark:text-green-500">
						<span className="block">Original: {originalUsdLabel}</span>
						{originalKesLabel ? (
							<span className="block">Original (KES): {originalKesLabel}</span>
						) : null}
					</span>
				) : null}

				{features && renderFeatureBadges ? (
					<span className="block mt-2">
						<span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
							Provisioning features
						</span>
						<span className="mt-1 flex flex-wrap gap-2">{renderFeatureBadges(features)}</span>
					</span>
				) : null}

				{showTooltip && disabledDetails ? (
					<span className="block mt-2 text-xs text-muted-foreground">{disabledDetails.reason}</span>
				) : null}

				{tags.length || expressions.length ? (
					<span className="block mt-2">
						<span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
							Tags & rules
						</span>
						<span className="mt-1 flex flex-wrap gap-2">
							{tags.slice(0, 6).map((t) => (
								<Badge key={`t:${t}`} variant="outline" className="rounded-full">
									{t}
								</Badge>
							))}
							{expressions.slice(0, 3).map((e) => (
								<Badge key={`e:${e}`} variant="secondary" className="rounded-full" title={e}>
									Expr
								</Badge>
							))}
						</span>
					</span>
				) : null}
			</span>
			<span className="flex items-center gap-2 shrink-0">
				{checked ? (
					<span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
						<ShieldCheck className="h-4 w-4" /> Added
					</span>
				) : (
					<span className="text-xs text-muted-foreground">{disabled ? "Unavailable" : "Add"}</span>
				)}
			</span>
		</button>
	);

	if (!showTooltip || !disabledDetails) {
		return card;
	}

	return (
		<Tooltip delayDuration={0}>
			<TooltipTrigger asChild>{card}</TooltipTrigger>
			<TooltipContent side="top" className="max-w-xs space-y-1.5 p-3 text-left">
				<p className="font-medium">{disabledDetails.reason}</p>
				<p className="text-primary-foreground/90">{disabledDetails.fix}</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function HivelocityAddonNoSelectionRow({
	checked,
	onSelect,
	label = "No selection",
	description = "Skip this category - no add-on will be included.",
}: {
	checked: boolean;
	onSelect: () => void;
	label?: string;
	description?: string;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"w-full flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 text-left text-sm transition",
				checked ? "border-primary bg-primary/5" : "hover:border-primary/40 bg-muted/10",
			)}
		>
			<span className="min-w-0">
				<span className="block font-medium">{label}</span>
				<span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
			</span>
			<span className="text-xs shrink-0 text-muted-foreground">
				{checked ? "Selected" : "Skip"}
			</span>
		</button>
	);
}
