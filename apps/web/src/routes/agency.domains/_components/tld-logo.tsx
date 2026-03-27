"use client";

import * as React from "react";

/** TLDs that have a hosted logo image (same as Kenyan cards + top-level suggested). */
const TLD_LOGO_IMAGES: Record<string, string> = {
	".ke": "/ke_tld.png",
	".co.ke": "/co_ke_tld.png",
	".com": "/dot_com_logo.webp",
	".org": "/dot_org_logo.webp",
	".net": "/dot_net_logo.webp",
	".io": "/dot_io_logo.webp",
	".info": "/dot_info_logo.png", // fallback: no dedicated .info image
};

/** Logo size: slightly larger than before (was h-12 w-12). */
const LOGO_SIZE = 56; // h-14 w-14

export type TldLogoVariant = "kenyan" | "openprovider";

interface TldLogoProps {
	/** TLD with or without leading dot (e.g. "ke", ".co.ke"). */
	tld: string;
	/** Kenyan: flag gradient for non-image TLDs. OpenProvider: FAB-like blue gradient. */
	variant: TldLogoVariant;
	className?: string;
}

/**
 * Shared TLD logo: image if in static map, otherwise gradient.
 * Kenyan variant uses flag colors; OpenProvider uses gradient similar to tickets FAB background.
 */
export function TldLogo({ tld, variant, className }: TldLogoProps) {
	const normalized = tld.startsWith(".") ? tld : `.${tld}`;
	const logoSrc = TLD_LOGO_IMAGES[normalized];

	if (logoSrc) {
		return (
			<div
				className={`flex-shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center ${className ?? ""}`}
				style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
			>
				<img
					src={logoSrc}
					alt={normalized}
					width={LOGO_SIZE}
					height={LOGO_SIZE}
					className="h-full w-full object-contain"
				/>
			</div>
		);
	}

	// Gradient fallback: show TLD segment only; if tld empty or has no dot (e.g. search query passed by mistake), show generic symbol
	const withoutDot = normalized.replace(/^\./, "");
	const isLikelyRealTld = withoutDot && (normalized.includes(".") || withoutDot.length <= 4);
	const label = isLikelyRealTld ? (withoutDot.split(".")[0] ?? withoutDot) : "•";
	if (variant === "kenyan") {
		return (
			<div
				className={`flex-shrink-0 rounded-lg flex items-center justify-center shadow-inner ${className ?? ""}`}
				style={{
					width: LOGO_SIZE,
					height: LOGO_SIZE,
					background: "linear-gradient(to bottom right, #006600, #BB0000, #000000)",
				}}
				title={normalized}
				aria-hidden
			>
				<span className="text-white font-bold text-sm drop-shadow-md">{label}</span>
			</div>
		);
	}

	// OpenProvider: FAB tickets screen–like gradient (blue)
	return (
		<div
			className={`flex-shrink-0 rounded-lg flex items-center justify-center shadow-inner bg-gradient-to-b from-blue-200 via-blue-100 to-blue-50 dark:from-blue-900/50 dark:via-blue-800/40 dark:to-blue-900/30 ${className ?? ""}`}
			style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
			title={normalized}
			aria-hidden
		>
			<span className="text-blue-900 dark:text-blue-100 font-bold text-sm drop-shadow-sm">{label}</span>
		</div>
	);
}
