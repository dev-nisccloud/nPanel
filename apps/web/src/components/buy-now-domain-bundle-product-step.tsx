"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

const formatPrice = (price?: number, currency?: string) => {
	if (price === undefined || price === null || Number.isNaN(price) || !Number.isFinite(price)) {
		return "N/A";
	}
	const symbol =
		(currency || "KES") === "KES" ? "KSh" : currency === "USD" ? "$" : currency || "KSh";
	const n =
		typeof Intl !== "undefined" && Intl.NumberFormat
			? new Intl.NumberFormat("en-US", {
					minimumFractionDigits: 0,
					maximumFractionDigits: 0,
				}).format(price)
			: String(price);
	return `${symbol} ${n}`;
};

export type BuyNowDomainBundleProductStepProps = {
	bundleLabel: string;
	domains: DomainSearchResult[];
	bundlePrice: number;
	displayCurrency: string;
};

export function BuyNowDomainBundleProductStep({
	bundleLabel,
	domains,
	bundlePrice,
	displayCurrency,
}: BuyNowDomainBundleProductStepProps) {
	return (
		<div className="flex flex-col gap-5">
			<div className="space-y-1 text-center">
				<h3 className="text-base font-semibold tracking-tight text-foreground">Domain bundle</h3>
				<p className="text-sm text-muted-foreground">
					Register all domains in this bundle for 1 year
				</p>
			</div>

			<div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
				<div className="space-y-1">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Bundle
					</p>
					<p className="text-base font-semibold text-foreground break-words">{bundleLabel}</p>
				</div>

				<ul className="space-y-2">
					{domains.map((domain) => (
						<li
							key={domain.domain}
							className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
						>
							<Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
							<span className="text-sm font-medium text-foreground truncate">{domain.domain}</span>
							<span className="ml-auto text-xs text-muted-foreground shrink-0">1 year</span>
						</li>
					))}
				</ul>

				<div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
					<span className="text-sm font-medium text-foreground">Bundle price (1st year)</span>
					<span className="text-lg font-semibold tabular-nums text-foreground">
						{formatPrice(bundlePrice, displayCurrency)}
					</span>
				</div>
			</div>
		</div>
	);
}
