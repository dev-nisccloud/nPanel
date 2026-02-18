"use client";

import * as React from "react";
import { ShoppingCart, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersectionObserver } from "usehooks-ts";
import { TldLogo } from "./tld-logo";
import { getSectionTitle } from "./domain-section-titles";
import { useSectionDomainCheck } from "./use-section-domain-check";
import { BuyNowDialog } from "./buy-now-dialog";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import type { DomainPricingHook } from "@/hooks/use-domain-search";

const formatPrice = (price?: number, currency?: string) => {
	if (price == null || price === undefined) return "N/A";
	const symbols: Record<string, string> = {
		USD: "$",
		KES: "KSh",
		EUR: "€",
		GBP: "£",
	};
	const symbol = symbols[currency ?? "USD"] ?? currency ?? "$";
	const formatted = new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(price);
	return `${symbol} ${formatted}`;
};

function formatMarginInfo(calculated: NonNullable<DomainSearchResult["price"]>["calculated"], format: (n: number, c: string) => string) {
	if (!calculated?.marginType || calculated.marginAmount <= 0) return null;
	if (calculated.marginType === "PERCENTAGE") return `+${calculated.marginValue}% (+${format(calculated.marginAmount, calculated.currency)})`;
	const fixed = parseFloat(String(calculated.marginValue ?? 0));
	return `+${format(fixed, calculated.currency)}`;
}

/** Extract TLD only (e.g. "com", "co.ke"). Returns empty if domain has no dot (avoids showing search query in logo). */
function extractTld(domain: string): string {
	const parts = domain.split(".");
	if (parts.length >= 2) {
		const last = parts.pop() ?? "";
		const second = parts.pop();
		if (second && (last === "ke" || last.length <= 2)) return `${second}.${last}`;
		return last;
	}
	return "";
}

function SectionDomainCard({
	result,
	isDomainInCart,
	onAddToCart,
	onRemoveFromCart,
}: {
	result: DomainSearchResult;
	isDomainInCart: (domain: string) => boolean;
	onAddToCart: (r: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
}) {
	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const isInCart = isDomainInCart(result.domain);
	const calculated = result.price?.calculated;
	const displayPrice = calculated ? ((calculated as any).convertedPrice ?? calculated.finalPrice) : result.price?.reseller?.price;
	const displayCurrency = calculated ? ((calculated as any).displayCurrency ?? calculated.currency) : result.price?.reseller?.currency;
	const marginLabel = formatMarginInfo(result.price?.calculated, formatPrice);
	const tld = extractTld(result.domain);
	const isAvailable = result.status === "free";

	return (
		<>
			<div className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col">
				<div className="flex items-center justify-between gap-2 mb-2">
					<TldLogo tld={tld} variant="openprovider" />
					<Badge
						className={
							isAvailable
								? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs"
								: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs"
						}
					>
						{isAvailable ? "Available" : "Taken"}
					</Badge>
				</div>
				<div className="font-bold text-sm text-primary mb-1 truncate" title={result.domain}>
					{result.domain}
				</div>
				{isAvailable && result.price && (
					<div className="space-y-0.5 mb-2">
						<div className="text-sm font-bold text-foreground">
							{formatPrice(displayPrice, displayCurrency)}
						</div>
						{marginLabel != null && (
							<div className="text-[10px] text-muted-foreground text-green-600 dark:text-green-400">
								{marginLabel}
							</div>
						)}
					</div>
				)}
				{result.reason != null && result.reason !== "" && (
					<div className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
						{result.reason}
					</div>
				)}
				<div className="mt-auto flex items-center justify-center gap-2">
					{isAvailable ? (
						<>
							<Button
								size="sm"
								variant="default"
								onClick={(e) => { e?.preventDefault(); setBuyNowOpen(true); }}
								className="text-xs h-8 px-3"
							>
								Buy Now
							</Button>
							<Button
								size="sm"
								variant={isInCart ? "destructive" : "outline"}
								onClick={(e) => {
									e?.preventDefault();
									if (isInCart) onRemoveFromCart(result.domain);
									else onAddToCart(result);
								}}
								className="h-8 w-8 p-0"
								title={isInCart ? "Remove from cart" : "Add to cart"}
							>
								{isInCart ? <XCircle className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
							</Button>
						</>
					) : (
						<Button size="sm" variant="outline" disabled className="text-xs h-8 px-3">
							Not available
						</Button>
					)}
				</div>
			</div>
			{isAvailable && (
				<BuyNowDialog open={buyNowOpen} onOpenChange={setBuyNowOpen} domain={result} />
			)}
		</>
	);
}

function SectionSkeleton() {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
			{Array.from({ length: 8 }).map((_, i) => (
				<div key={i} className="bg-card border border-border rounded-lg p-3">
					<div className="flex justify-between items-center mb-2">
						<Skeleton className="h-14 w-14 rounded-lg" />
						<Skeleton className="h-5 w-16" />
					</div>
					<Skeleton className="h-4 w-full mb-2" />
					<Skeleton className="h-4 w-20 mb-2" />
					<Skeleton className="h-8 w-full mt-2" />
				</div>
			))}
		</div>
	);
}

export interface DomainSearchSectionProps {
	sectionId: string;
	searchQuery: string;
	pricingHook: DomainPricingHook;
	isDomainInCart: (domain: string) => boolean;
	onAddToCart: (result: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
	/** Report loading state for aggregation (e.g. search button spinner). */
	onLoadingChange?: (loading: boolean) => void;
}

export function DomainSearchSection({
	sectionId,
	searchQuery,
	pricingHook,
	isDomainInCart,
	onAddToCart,
	onRemoveFromCart,
	onLoadingChange,
}: DomainSearchSectionProps) {
	const { isIntersecting, ref } = useIntersectionObserver({ threshold: 0.1 });
	const { results, isLoading, isError, refetch } = useSectionDomainCheck(
		searchQuery,
		sectionId,
		isIntersecting,
		pricingHook
	);

	React.useEffect(() => {
		onLoadingChange?.(isLoading);
	}, [isLoading, onLoadingChange]);

	const title = getSectionTitle(sectionId);

	if (!searchQuery.trim()) return null;

	// Per-section loading: only this section shows skeleton when this section’s query is loading
	return (
		<section ref={ref} className="mb-8">
			<h3 className="text-base font-semibold tracking-tight text-card-foreground mb-4">
				{title}
			</h3>
			{isLoading && <SectionSkeleton />}
			{isError && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
					<p>Could not load this section.</p>
					<Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
						Try again
					</Button>
				</div>
			)}
			{!isLoading && !isError && results.length === 0 && (
				<p className="text-sm text-muted-foreground">No domains in this category.</p>
			)}
			{!isLoading && !isError && results.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
					{results.map((result, index) => (
						<SectionDomainCard
							key={`${result.domain}-${index}`}
							result={result}
							isDomainInCart={isDomainInCart}
							onAddToCart={onAddToCart}
							onRemoveFromCart={onRemoveFromCart}
						/>
					))}
				</div>
			)}
		</section>
	);
}
