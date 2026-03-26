"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { useCurrency } from "./currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import { DomainResultRow, DomainResultList } from "./domain-result-row";
import {
	buildKenicDomainsFromQuery,
	normalizeToKenicCards,
	type KenicCardItem,
} from "./kenic-card-schema";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

const formatPrice = (price?: number, currency?: string) => {
	if (price == null || price === undefined) return "N/A";
	const symbols: Record<string, string> = {
		USD: "$",
		KES: "KSh",
		EUR: "Ã¢â€šÂ¬",
		GBP: " £",
	};
	const symbol = symbols[currency ?? "KES"] ?? currency ?? "KSh";
	const formatted = new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(price);
	return `${symbol} ${formatted}`;
};

/** Margin-applied prices for display and cart (from TLD settings). */
interface PricedFees {
	createFinal: number;
	renewFinal: number;
	transferFinal: number;
	createCalc: { marginAmount: number; marginType: string | null; marginValue: string | null; currency: string };
}

/** Converts KenicCardItem + PricedFees to DomainSearchResult for cart/BuyNow (uses margin-applied create price). */
function toDomainSearchResult(item: KenicCardItem, priced: PricedFees): DomainSearchResult {
	const currency = item.currency || "KES";
	return {
		domain: item.domain,
		status: item.available ? "free" : "taken",
		reason: item.reason,
		price: {
			product: { price: priced.createFinal, currency },
			reseller: { price: priced.createFinal, currency },
			calculated: {
				originalPrice: item.createPrice ?? 0,
				marginAmount: priced.createCalc.marginAmount,
				finalPrice: priced.createFinal,
				currency,
				marginType: priced.createCalc.marginType,
				marginValue: priced.createCalc.marginValue,
			},
		},
	};
}

const formatMarginInfo = (calc: PricedFees["createCalc"], formatPrice: (n: number, c: string) => string) => {
	if (!calc.marginType || calc.marginAmount <= 0) return null;
	if (calc.marginType === "PERCENTAGE") return `+${calc.marginValue}% (+${formatPrice(calc.marginAmount, calc.currency)})`;
	const fixed = parseFloat(calc.marginValue || "0");
	return `+${formatPrice(fixed, calc.currency)}`;
};

const KENYAN_LIST_SKELETON = (
	<div className="space-y-0 mb-6">
		{Array.from({ length: 6 }).map((_, i) => (
			<React.Fragment key={i}>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
					<div className="min-w-0 flex-1 space-y-2">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-32" />
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

export interface KenyanTldCardsProps {
	searchQuery: string;
	/** When false, Kenyan TLDs do not start loading until suggestions (exact + top-level cards) have loaded. */
	suggestionsReady?: boolean;
	/** When false (e.g. tab not selected), do not fetch; used in tabbed layout so data loads only when tab is active. */
	isSelected?: boolean;
	/** When true, omit the section heading (tab label is used instead). */
	embeddedInTabs?: boolean;
	onAddToCart: (result: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
	isDomainInCart: (domain: string) => boolean;
	/** Report loading state for aggregation (e.g. search button spinner). */
	onLoadingChange?: (loading: boolean) => void;
}

export function KenyanTldCards({
	searchQuery,
	suggestionsReady = true,
	isSelected = true,
	embeddedInTabs = false,
	onAddToCart,
	onRemoveFromCart,
	isDomainInCart,
	onLoadingChange,
}: KenyanTldCardsProps) {
	const currencyContext = useCurrency();
	const { getPricingInfo } = useDomainPricing(currencyContext);

	const sanitized = React.useMemo(() => {
		const t = searchQuery.trim().toLowerCase().replace(/\s+/g, "");
		return t.length > 0 ? t : "";
	}, [searchQuery]);

	const domains = React.useMemo(
		() => (sanitized ? buildKenicDomainsFromQuery(sanitized) : []),
		[sanitized]
	);

	const checkMutation = trpc.kenic.domainCheck.check.useMutation();

	const [cards, setCards] = React.useState<KenicCardItem[] | null>(null);

	const isMountedRef = React.useRef(true);
	const lastFetchedSanitizedRef = React.useRef<string | null>(null);

	React.useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// NOTE: useEffect (NOT useLayoutEffect) — only clears state, no DOM measurement needed.
	// useLayoutEffect here caused synchronous cascade: clear → re-render → useEffect fires mutation → re-render.
	React.useEffect(() => {
		if (!sanitized) return;
		if (lastFetchedSanitizedRef.current !== null && lastFetchedSanitizedRef.current !== sanitized) {
			lastFetchedSanitizedRef.current = null;
			setCards(null);
		}
	}, [sanitized]);

	// Only start KENIC request when this tab is selected and suggestions have loaded. Do not re-fetch when returning to tab if we already have data for this search.
	React.useEffect(() => {
		if (!isSelected || !suggestionsReady || !sanitized || domains.length === 0) {
			return;
		}
		const alreadyHaveDataForThisSearch = cards != null && lastFetchedSanitizedRef.current === sanitized;
		if (alreadyHaveDataForThisSearch) {
			return;
		}
		lastFetchedSanitizedRef.current = sanitized;
		setCards(null);
		checkMutation.mutate(
			{
				domains,
				withFee: true,
				currency: "KES",
				periodYears: 1,
			},
			{
				onSuccess: (data) => {
					if (!isMountedRef.current) return;
					const normalized = "normalized" in data ? data.normalized : undefined;
					if (normalized && Array.isArray(normalized)) {
						setCards(normalizeToKenicCards(sanitized, normalized));
					} else {
						setCards(null);
					}
				},
				onError: () => {
					if (isMountedRef.current) {
						setCards(null);
						lastFetchedSanitizedRef.current = null;
					}
				},
			}
		);
	}, [isSelected, suggestionsReady, sanitized, domains]);

	/** Apply TLD margin to each card's create/renew/transfer. */
	const pricedMap = React.useMemo(() => {
		const map = new Map<string, PricedFees>();
		if (!cards) return map;
		const currency = "KES";
		for (const item of cards) {
			const createCalc = getPricingInfo(item.domain, item.createPrice ?? 0, item.currency ?? currency);
			const renewCalc = getPricingInfo(item.domain, item.renewPrice ?? 0, item.currency ?? currency);
			const transferCalc = getPricingInfo(item.domain, item.transferPrice ?? 0, item.currency ?? currency);
			map.set(item.domain, {
				createFinal: createCalc.finalPrice,
				renewFinal: renewCalc.finalPrice,
				transferFinal: transferCalc.finalPrice,
				createCalc: {
					marginAmount: createCalc.marginAmount,
					marginType: createCalc.marginType,
					marginValue: createCalc.marginValue,
					currency: createCalc.currency,
				},
			});
		}
		return map;
	}, [cards, getPricingInfo]);

	const onLoadingChangeRef = React.useRef(onLoadingChange);
	onLoadingChangeRef.current = onLoadingChange;
	React.useEffect(() => {
		onLoadingChangeRef.current?.(isSelected ? checkMutation.isPending : false);
	}, [isSelected, checkMutation.isPending]);

	if (!sanitized) return null;

	// When tab is not selected, render nothing (panel is hidden; data stays mounted for when user returns)
	if (!isSelected) return <div className="min-h-[200px]" aria-hidden />;

	// Show skeleton until suggestions have loaded, then while KENIC is loading
	const waitForSuggestions = !suggestionsReady && sanitized.length > 0;
	const isLoading = checkMutation.isPending;
	const error = checkMutation.isError;

	if (waitForSuggestions || (isLoading && cards == null)) return (
		<section className="mb-6">
			{!embeddedInTabs && (
				<h3 className="text-base font-semibold tracking-tight text-card-foreground mb-4">
					Give your brand a Kenyan vibe
				</h3>
			)}
			{KENYAN_LIST_SKELETON}
		</section>
	);

	const list = cards ?? [];

	return (
		<section className="mb-6">
			{!embeddedInTabs && (
				<h3 className="text-base font-semibold tracking-tight text-card-foreground mb-4">
					Give your brand a Kenyan vibe
				</h3>
			)}
			{error && (
				<p className="text-sm text-destructive mb-2">
					Could not load Kenyan TLD availability. Try again later.
				</p>
			)}
			<DomainResultList>
				{list.map((item) => {
					const priced = pricedMap.get(item.domain) ?? {
						createFinal: item.createPrice ?? 0,
						renewFinal: item.renewPrice ?? 0,
						transferFinal: item.transferPrice ?? 0,
						createCalc: { marginAmount: 0, marginType: null, marginValue: null, currency: item.currency ?? "KES" },
					};
					const displayResult = toDomainSearchResult(item, priced);
					const currency = item.currency ?? "KES";
					const marginLabel = formatMarginInfo(priced.createCalc, formatPrice);
					return (
						<DomainResultRow
							key={item.domain}
							domain={item.domain}
							isAvailable={item.available}
							originalPrice={item.available ? item.createPrice : undefined}
							originalCurrency={item.available ? currency : undefined}
							marginLabel={item.available ? marginLabel ?? undefined : undefined}
							displayPrice={item.available ? priced.createFinal : undefined}
							displayCurrency={item.available ? currency : undefined}
							reason={item.reason ?? undefined}
							displayResult={displayResult}
							isDomainInCart={isDomainInCart}
							onAddToCart={onAddToCart}
							onRemoveFromCart={onRemoveFromCart}
						/>
					);
				})}
			</DomainResultList>
		</section>
	);
}
