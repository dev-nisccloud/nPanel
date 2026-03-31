"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersectionObserver } from "usehooks-ts";
import { getSectionTitle } from "./domain-section-titles";
import { useSectionDomainCheck } from "./use-section-domain-check";
import { DomainResultRow, DomainResultList } from "./domain-result-row";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import type { DomainPricingHook } from "@/hooks/use-domain-search";

const SECTION_ID_ALL = "all";

const formatPrice = (price?: number, currency?: string) => {
	if (price == null || price === undefined) return "N/A";
	const symbols: Record<string, string> = {
		USD: "$",
		KES: "KSh",
		EUR: "€",
		GBP: " ?",
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

function sectionResultToRowProps(
	result: DomainSearchResult,
	isDomainInCart: (domain: string) => boolean,
	onAddToCart: (r: DomainSearchResult) => void,
	onRemoveFromCart: (domain: string) => void
) {
	const isAvailable = result.status === "free";
	const calculated = result.price?.calculated as {
		convertedPrice?: number;
		convertedOriginalPrice?: number;
		displayCurrency?: string;
		finalPrice?: number;
		originalPrice?: number;
		currency?: string;
	} | undefined;

	let displayPrice: number | undefined;
	let displayCurrency: string | undefined;
	let originalPrice: number | undefined;
	let originalCurrency: string | undefined;
	let marginLabel: string | null = null;

	if (isAvailable) {
		displayPrice = calculated?.convertedPrice ?? calculated?.finalPrice ?? result.price?.reseller?.price;
		displayCurrency = calculated?.displayCurrency ?? calculated?.currency ?? result.price?.reseller?.currency ?? "USD";
		// Show original in display (converted) currency when available
		originalPrice = calculated?.convertedOriginalPrice ?? calculated?.originalPrice ?? result.price?.reseller?.price;
		originalCurrency = displayCurrency;
		marginLabel = formatMarginInfo(result.price?.calculated, formatPrice);
	}
	return {
		domain: result.domain,
		isAvailable,
		originalPrice,
		originalCurrency,
		marginLabel: marginLabel ?? undefined,
		displayPrice,
		displayCurrency,
		reason: result.reason ?? undefined,
		displayResult: result,
		isDomainInCart,
		onAddToCart,
		onRemoveFromCart,
	};
}

function SectionSkeleton() {
	return (
		<div className="space-y-0">
			{Array.from({ length: 6 }).map((_, i) => (
				<React.Fragment key={i}>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
						<div className="min-w-0 flex-1 space-y-2">
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-36" />
								<Skeleton className="h-5 w-16 rounded-full" />
							</div>
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-3 w-20" />
						</div>
						<div className="flex items-center gap-3 shrink-0">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-8 w-20" />
							<Skeleton className="h-8 w-8" />
						</div>
					</div>
					{i < 5 && <div className="border-b border-border" />}
				</React.Fragment>
			))}
		</div>
	);
}

const MAX_VISIBLE_RESULTS = 100;

export interface DomainSearchSectionProps {
	sectionId: string;
	searchQuery: string;
	pricingHook: DomainPricingHook;
	isDomainInCart: (domain: string) => boolean;
	onAddToCart: (result: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
	/** When true, query runs immediately (pill/tab mode). When false/undefined, query runs when section is in view. */
	isSelected?: boolean;
	/** When true (e.g. tab visited before), keep query enabled so cache is used on return; avoids refetch when switching back. */
	enableQuery?: boolean;
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
	isSelected,
	enableQuery,
	onLoadingChange,
}: DomainSearchSectionProps) {
	const { isIntersecting, ref } = useIntersectionObserver({ threshold: 0.1 });
	const inView = isSelected !== undefined ? (enableQuery ?? isSelected) : isIntersecting;
	const { results, isLoading, isError, refetch } = useSectionDomainCheck(
		searchQuery,
		sectionId,
		inView,
		pricingHook
	);

	const onLoadingChangeRef = React.useRef(onLoadingChange);
	onLoadingChangeRef.current = onLoadingChange;
	// NOTE: useEffect (NOT useLayoutEffect) ?? reporting loading state to parent is a side-effect,
	// not a DOM measurement. useLayoutEffect here caused synchronous state cascade during commit.
	React.useEffect(() => {
		onLoadingChangeRef.current?.(isSelected ? isLoading : false);
	}, [isSelected, isLoading]);

	const [visibleCount, setVisibleCount] = React.useState(MAX_VISIBLE_RESULTS);
	const hasMore = results.length > visibleCount;
	const visibleResults = React.useMemo(
		() => results.slice(0, visibleCount),
		[results, visibleCount]
	);

	const title = sectionId === SECTION_ID_ALL ? "All TLDs" : getSectionTitle(sectionId);

	if (!searchQuery.trim()) return null;

	// Per-section loading: only this section shows skeleton when this section?s query is loading
	if (isSelected === false) return <div className="min-h-[200px]" aria-hidden />;

	return (
		<section ref={isSelected !== undefined ? undefined : ref} className="mb-8">
			{!isSelected && (
				<h3 className="text-base font-semibold tracking-tight text-card-foreground mb-4">
					{title}
				</h3>
			)}
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
				<>
					<DomainResultList>
						{visibleResults.map((result, index) => (
							<DomainResultRow
								key={`${result.domain}-${index}`}
								{...sectionResultToRowProps(result, isDomainInCart, onAddToCart, onRemoveFromCart)}
							/>
						))}
					</DomainResultList>
					{hasMore && (
						<div className="mt-4 flex justify-center">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setVisibleCount((prev) => prev + MAX_VISIBLE_RESULTS)}
							>
								Show more ({results.length - visibleCount} more)
							</Button>
						</div>
					)}
				</>
			)}
		</section>
	);
}
