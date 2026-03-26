"use client";

import * as React from "react";
import { ShoppingCart, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TldLogo } from "./tld-logo";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { parseFullDomain, isKenicTld, normalizedItemToKenicCard } from "./kenic-card-schema";
import { nameForOpenProvider } from "./use-section-domain-check";
import type { KenicCardItem } from "./kenic-card-schema";
import { trpc } from "@/utils/trpc";
import { useCurrency } from "./currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { Check } from "lucide-react";

const formatPrice = (price?: number, currency?: string) => {
	if (price == null || price === undefined) return "N/A";
	const symbols: Record<string, string> = {
		USD: "$",
		KES: "KSh",
		EUR: "Ã¢â€šÂ¬",
		GBP: " £",
	};
	const symbol = symbols[currency ?? "USD"] ?? currency ?? "$";
	return `${symbol} ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)}`;
};

/** Marketing copy for the exact match card: two short bullets (same layout as .com / bundle cards). */
const EXACT_MATCH_WHY_CHOOSE: [string, string] = [
	"This is your exact domain search, secure it before someone else does.",
	"One address, one identity. Lock in your brand with this extension you n.",
];

interface PricedFees {
	createFinal: number;
	createCalc: { marginAmount: number; marginType: string | null; marginValue: string | null; currency: string };
}

function toDomainSearchResult(item: KenicCardItem, createFinal: number, createCalc: PricedFees["createCalc"]): DomainSearchResult {
	return {
		domain: item.domain,
		status: item.available ? "free" : "taken",
		reason: item.reason,
		price: {
			product: { price: createFinal, currency: item.currency },
			reseller: { price: createFinal, currency: item.currency },
			calculated: {
				originalPrice: item.createPrice ?? 0,
				marginAmount: createCalc.marginAmount,
				finalPrice: createFinal,
				currency: item.currency,
				marginType: createCalc.marginType,
				marginValue: createCalc.marginValue,
			},
		},
	};
}

export interface ExactMatchSectionProps {
	/** Raw query as entered (e.g. "example.com", "example.co.ke") – not sanitized. */
	rawSearchQuery: string;
	isDomainInCart: (domain: string) => boolean;
	onAddToCart: (result: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
	onLoadingChange?: (loading: boolean) => void;
}

export function ExactMatchSection({
	rawSearchQuery,
	isDomainInCart,
	onAddToCart,
	onRemoveFromCart,
	onLoadingChange,
}: ExactMatchSectionProps) {
	const currencyContext = useCurrency();
	const { getPricingInfo } = useDomainPricing(currencyContext);

	const normalizedRaw = React.useMemo(() => {
		let s = rawSearchQuery.trim().toLowerCase();
		s = s.replace(/^https?:\/\//, "").replace(/^www\./i, "");
		return s;
	}, [rawSearchQuery]);
	const parsed = React.useMemo(() => parseFullDomain(normalizedRaw), [normalizedRaw]);
	const fullDomain = parsed ? `${parsed.name}.${parsed.tld}`.toLowerCase() : "";
	const isKenic = parsed ? isKenicTld(parsed.tld) : false;

	// KENIC path: single domain check
	const kenicMutation = trpc.kenic.domainCheck.check.useMutation();
	const [kenicCard, setKenicCard] = React.useState<KenicCardItem | null>(null);

	// OpenProvider path: name + single extension (name must be single label – no dots, or API 303)
	const openProviderQuery = trpc.openProvider.domains.checkAvailability.useQuery(
		{
			name: nameForOpenProvider(parsed?.name ?? ""),
			extensions: parsed && !isKenic ? [parsed.tld] : [],
			with_price: true,
			with_whois: false,
		},
		{ enabled: !!parsed && !isKenic && !!parsed.name.trim() }
	);

	const pricingHook = useDomainPricing(currencyContext);
	const [openProviderResult, setOpenProviderResult] = React.useState<DomainSearchResult | null>(null);
	const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
	const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, { enabled: true });

	const openProviderRaw = openProviderQuery.data?.success && openProviderQuery.data?.data?.results
		? (openProviderQuery.data.data.results as Array<{ domain: string; status: string; reason?: string; price?: DomainSearchResult["price"] }>)[0]
		: null;

	const isMountedRef = React.useRef(true);
	React.useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	React.useEffect(() => {
		if (!parsed || !isKenic || !fullDomain) {
			setKenicCard(null);
			return;
		}
		setKenicCard(null);
		kenicMutation.mutate(
			{ domains: [fullDomain], withFee: true, currency: "KES", periodYears: 1 },
			{
				onSuccess: (data) => {
					if (!isMountedRef.current) return;
					const normalized = "normalized" in data ? data.normalized : undefined;
					if (normalized && Array.isArray(normalized)) {
						const item = normalized.find((n) => n.domain.toLowerCase() === fullDomain);
						if (item) setKenicCard(normalizedItemToKenicCard(item));
						else setKenicCard(null);
					} else {
						setKenicCard(null);
					}
				},
				onError: () => {
					if (isMountedRef.current) setKenicCard(null);
				},
			}
		);
	}, [fullDomain, isKenic, parsed?.name, parsed?.tld]);

	const { calculatePricesBatch } = pricingHook;

	// OpenProvider: clear when domain changes; start pricing batch when raw data exists (after paint)
	React.useEffect(() => {
		if (!openProviderRaw || !calculatePricesBatch) {
			setOpenProviderResult(null);
			return;
		}
		const rawDomain = openProviderRaw.domain?.toLowerCase() ?? "";
		if (rawDomain !== fullDomain) {
			setOpenProviderResult(null);
			return;
		}
		let cancelled = false;
		const raw: DomainSearchResult = {
			domain: openProviderRaw.domain,
			status: openProviderRaw.status ?? "unknown",
			reason: openProviderRaw.reason,
			price: openProviderRaw.price,
		};
		calculatePricesBatch([raw])
			.then(([priced]) => {
				if (!cancelled && priced) setOpenProviderResult(priced);
			})
			.catch(() => {
				if (!cancelled) setOpenProviderResult(raw);
			});
		return () => {
			cancelled = true;
		};
	}, [openProviderRaw, calculatePricesBatch, fullDomain]);

	const onLoadingChangeRef = React.useRef(onLoadingChange);
	onLoadingChangeRef.current = onLoadingChange;
	const kenicLoading = isKenic && kenicMutation.isPending;
	const openProviderLoading = !isKenic && openProviderQuery.isLoading;
	const anyLoading = kenicLoading || openProviderLoading;
	React.useEffect(() => {
		onLoadingChangeRef.current?.(anyLoading);
	}, [anyLoading]);

	if (!parsed || !rawSearchQuery.trim()) return null;

	const isLoading = anyLoading;
	const isKenicPath = isKenic;

	if (isLoading && !kenicCard && !openProviderResult) {
		return (
			<div className="bg-card border border-border rounded-lg p-4 md:p-5 min-h-[200px]">
				<div className="flex justify-between items-center mb-2">
					<Skeleton className="h-14 w-14 rounded-lg" />
					<Skeleton className="h-5 w-16" />
				</div>
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-32 mb-2" />
				<Skeleton className="h-8 w-full mt-2" />
			</div>
		);
	}

	if (isKenicPath && kenicCard) {
		const currency = kenicCard.currency || "KES";
		const createCalc = getPricingInfo(kenicCard.domain, kenicCard.createPrice ?? 0, currency);
		const createFinal = createCalc.finalPrice;
		const displayResult = toDomainSearchResult(kenicCard, createFinal, {
			marginAmount: createCalc.marginAmount,
			marginType: createCalc.marginType,
			marginValue: createCalc.marginValue,
			currency: createCalc.currency,
		});
		const marginLabel =
			createCalc.marginType && createCalc.marginAmount > 0
				? createCalc.marginType === "PERCENTAGE"
					? `+${createCalc.marginValue}% (+${formatPrice(createCalc.marginAmount, createCalc.currency)})`
					: `+${formatPrice(parseFloat(String(createCalc.marginValue ?? 0)), createCalc.currency)}`
				: null;
		const isInCart = isDomainInCart(kenicCard.domain);

		return (
			<>
				<div className="bg-card border border-border rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow flex flex-col relative min-h-[200px]">
					<div className="flex items-center justify-between gap-2 mb-2">
						<TldLogo tld={kenicCard.tld} variant="kenyan" />
						<Badge
							className={
								kenicCard.available
									? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs"
									: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs"
							}
						>
							{kenicCard.available ? "Available" : "Taken"}
						</Badge>
					</div>
					<div className="font-bold text-base text-primary mb-1 truncate" title={kenicCard.domain}>
						{kenicCard.domain}
					</div>
					{kenicCard.available && (
						<div className="space-y-0.5 mb-2">
							{kenicCard.createPrice != null && (
								<div className="text-xs text-muted-foreground">Original: {formatPrice(kenicCard.createPrice, currency)}</div>
							)}
							{marginLabel != null && marginLabel !== "" && (
								<div className="text-xs text-green-600 dark:text-green-400">{marginLabel}</div>
							)}
							<div className="text-base font-bold text-foreground">{formatPrice(createFinal, currency)}</div>
						</div>
					)}
					{kenicCard.available ? (
						<div>
							<div className="border-t border-border my-2" />
							<ul className="space-y-1.5 mb-3 text-xs text-muted-foreground">
								{EXACT_MATCH_WHY_CHOOSE.map((line, i) => (
									<li key={i} className="flex gap-1.5 items-start">
										<Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" aria-hidden />
										<span className="line-clamp-2">{line}</span>
									</li>
								))}
							</ul>
						</div>
					) : (
						kenicCard.reason != null && kenicCard.reason !== "" && (
							<div className="text-xs text-muted-foreground mb-3 line-clamp-2">{kenicCard.reason}</div>
						)
					)}
					<div className="mt-auto flex items-center justify-center gap-2">
						{kenicCard.available ? (
							<>
								<Button size="sm" variant="default" onClick={() => domainsProductId && openForProduct({ productId: domainsProductId, productName: "Domains", domain: displayResult })} className="text-xs h-8 px-3" disabled={!domainsProductId}>
									Buy Now
								</Button>
								<Button
									size="sm"
									variant={isInCart ? "destructive" : "outline"}
									onClick={(e) => {
										e?.preventDefault();
										if (isInCart) onRemoveFromCart(kenicCard.domain);
										else onAddToCart(displayResult);
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
			</>
		);
	}

	if (!isKenicPath && openProviderResult) {
		const r = openProviderResult;
		const calculated = r.price?.calculated as {
			originalPrice?: number;
			convertedOriginalPrice?: number;
			marginAmount?: number;
			finalPrice: number;
			currency: string;
			marginType?: string | null;
			marginValue?: string | null;
			convertedPrice?: number;
			displayCurrency?: string;
		} | undefined;
		const displayPrice = calculated
			? (calculated.convertedPrice ?? calculated.finalPrice)
			: r.price?.reseller?.price;
		const displayCurrency = calculated?.displayCurrency ?? calculated?.currency ?? r.price?.reseller?.currency ?? "USD";
		// Original: show in display currency (converted) when available, so the card matches .com / other cards
		const originalPrice = calculated?.convertedOriginalPrice ?? calculated?.originalPrice ?? r.price?.reseller?.price;
		const originalCurrency = calculated?.convertedOriginalPrice != null ? displayCurrency : (calculated?.currency ?? r.price?.reseller?.currency ?? "USD");
		// Margin in display currency for the label
		const marginAmountOriginal = calculated?.marginAmount ?? 0;
		const marginInDisplayCurrency =
			calculated?.convertedPrice != null &&
			calculated?.finalPrice != null &&
			calculated.finalPrice > 0 &&
			marginAmountOriginal > 0
				? marginAmountOriginal * (calculated.convertedPrice / calculated.finalPrice)
				: marginAmountOriginal;
		const marginLabel =
			calculated?.marginType && (marginAmountOriginal > 0 || (calculated.marginValue != null && calculated.marginValue !== ""))
				? calculated.marginType === "PERCENTAGE"
					? `+${calculated.marginValue}% (+${formatPrice(marginInDisplayCurrency, displayCurrency)})`
					: `+${formatPrice(marginInDisplayCurrency, displayCurrency)}`
				: null;
		const isAvailable = r.status === "free";
		const isInCart = isDomainInCart(r.domain);
		const tld = r.domain.includes(".") ? r.domain.split(".").slice(-1)[0] ?? "" : "";

		return (
			<>
				<div className="bg-card border border-border rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow flex flex-col relative min-h-[200px]">
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
					<div className="font-bold text-base text-primary mb-1 truncate" title={r.domain}>
						{r.domain}
					</div>
					{isAvailable && r.price && (
						<div className="space-y-0.5 mb-2">
							{originalPrice != null && (
								<div className="text-xs text-muted-foreground">Original: {formatPrice(originalPrice, originalCurrency)}</div>
							)}
							{marginLabel != null && marginLabel !== "" && (
								<div className="text-xs text-green-600 dark:text-green-400">{marginLabel}</div>
							)}
							<div className="text-base font-bold text-foreground">{formatPrice(displayPrice, displayCurrency)}</div>
						</div>
					)}
					{isAvailable ? (
						<div>
							<div className="border-t border-border my-2" />
							<ul className="space-y-1.5 mb-3 text-xs text-muted-foreground">
								{EXACT_MATCH_WHY_CHOOSE.map((line, i) => (
									<li key={i} className="flex gap-1.5 items-start">
										<Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" aria-hidden />
										<span className="line-clamp-2">{line}</span>
									</li>
								))}
							</ul>
						</div>
					) : (
						r.reason != null && r.reason !== "" && (
							<div className="text-xs text-muted-foreground mb-3 line-clamp-2">{r.reason}</div>
						)
					)}
					<div className="mt-auto flex items-center justify-center gap-2">
						{isAvailable ? (
							<>
								<Button size="sm" variant="default" onClick={() => domainsProductId && openForProduct({ productId: domainsProductId, productName: "Domains", domain: r })} className="text-xs h-8 px-3" disabled={!domainsProductId}>
									Buy Now
								</Button>
								<Button
									size="sm"
									variant={isInCart ? "destructive" : "outline"}
									onClick={(e) => {
										e?.preventDefault();
										if (isInCart) onRemoveFromCart(r.domain);
										else onAddToCart(r);
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
			</>
		);
	}

	return null;
}
