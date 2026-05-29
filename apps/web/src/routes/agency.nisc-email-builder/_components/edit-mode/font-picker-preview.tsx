"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import type { GoogleEmailFont } from "./email-fonts";
import { NEB_FONT_PREVIEW_SAMPLE, primaryGoogleFontName } from "./email-fonts";
import { ensureGoogleFontsLink } from "./html-edit-client";

/** Load curated Google Fonts into the app shell so the inspector dropdown can preview them. */
export function useInspectorGoogleFonts(): void {
	React.useEffect(() => {
		ensureGoogleFontsLink(document);
	}, []);
}

type FontFamilyPreviewProps = {
	font: GoogleEmailFont;
	/** Trigger = compact; item = larger sample in the list */
	variant: "trigger" | "item";
	className?: string;
};

/**
 * Renders the font name using only the Google family (no Arial/Georgia fallback)
 * so users see the real webfont when loaded — not the system UI font.
 */
export function FontFamilyPreview({
	font,
	variant,
	className,
}: FontFamilyPreviewProps) {
	const googleName = primaryGoogleFontName(font);
	const sample =
		font.category === "display"
			? "LAUNCH"
			: font.category === "mono"
				? "{ deploy }"
				: font.category === "handwriting"
					? "Welcome"
					: NEB_FONT_PREVIEW_SAMPLE;

	return (
		<div
			className={cn(
				"flex min-w-0 flex-col",
				variant === "item" ? "gap-0.5 py-0.5" : "gap-0",
				className,
			)}
		>
			<span
				className={cn(
					"truncate leading-tight",
					variant === "item" ? "text-[1.125rem]" : "text-sm font-medium",
				)}
				style={{
					fontFamily: `"${googleName}"`,
					fontWeight: font.category === "display" ? 400 : 500,
				}}
			>
				{variant === "item" ? sample : font.label}
			</span>
			{variant === "item" ? (
				<span className="truncate text-[10px] leading-snug text-muted-foreground font-sans">
					{font.label}
				</span>
			) : null}
		</div>
	);
}
