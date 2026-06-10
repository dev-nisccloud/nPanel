"use client";

import * as React from "react";
import { Check, ShoppingCart, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TldLogo } from "./tld-logo";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { nameForOpenProvider } from "./use-section-domain-check";
import { parseFullDomain, normalizedItemToKenicCard } from "./kenic-card-schema";
import type { KenicCardItem } from "./kenic-card-schema";
import { trpc } from "@/utils/trpc";
import { useCurrency } from "./currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { getCustomerRetailDisplayPrice } from "./customer-domain-display-price";
import { createDomainBundleCheckoutContext, formatDomainBundleLabel } from "@/lib/domain-bundle-checkout";
import { useBundleTotalKes } from "@/hooks/use-bundle-total-kes";

const formatPrice = (price?: number, currency?: string) => {
	if (price == null || price === undefined) return "N/A";
	const symbols: Record<string, string> = { USD: "$", KES: "KSh", EUR: "€", GBP: " ?" };
	const symbol = symbols[currency ?? "USD"] ?? currency ?? "$";
	return `${symbol} ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)}`;
};

/** Suggested single-TLD cards order: .co.ke, .ke, then .com */
const SUGGESTED_OPEN_TLDS = ["com"] as const;

/** Two short ?why choose?? points per TLD (and bundle) for suggested cards. Descriptions can wrap to two lines. */
const TLD_WHY_CHOOSE: Record<string, [string, string]> = {
	"co.ke": [
		"Kenya's most trusted commercial extension, ideal for local businesses and brands.",
		"Strong local SEO and instant recognition with Kenyan customers.",
	],
	ke: [
		"Short, memorable .ke for a bold Kenyan identity.",
		"Perfect for startups and brands that want to stand out locally.",
	],
	com: [
		"The worlds most recognized TLD, builds trust and credibility everywhere.",
		"Best for global reach and lasting memorability."
	],
	info: [
		"Clear and informative, ideal for resources, guides and knowledge hubs.",
		"Affordable and trusted for content and reference sites.",
	],
	bundle: [
		"Lock in .co.ke, .ke, .com & .net together and save.",
		"One purchase, multiple identities best value for your brand.",
	],
};

export interface TopLevelSuggestedCardsProps {
	/** Sanitized name only (no TLD). */
	searchQuery: string;
	/** Raw query (e.g. "example.com") to derive exact match TLD. */
	rawSearchQuery: string;
	isDomainInCart: (domain: string) => boolean;
	isDomainBundleInCart: (domainNames: string[]) => boolean;
	onAddToCart: (result: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
	onAddDomainBundle: (params: {
		domains: DomainSearchResult[];
		bundlePrice: number;
		bundleCurrency?: string;
		bundleLabel?: string;
	}) => void;
	onRemoveDomainBundle: (domainNames: string[]) => void;
	onLoadingChange?: (loading: boolean) => void;
}

/** Derive exact match TLD from raw query (e.g. "example.co.ke" -> "co.ke"). */
function getExactMatchTld(rawSearchQuery: string): string | null {
	const s = rawSearchQuery.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./i, "");
	const parsed = parseFullDomain(s);
	return parsed ? parsed.tld : null;
}

export function TopLevelSuggestedCards({
	searchQuery,
	rawSearchQuery,
	isDomainInCart,
	isDomainBundleInCart,
	onAddToCart,
	onRemoveFromCart,
	onAddDomainBundle,
	onRemoveDomainBundle,
	onLoadingChange,
}: TopLevelSuggestedCardsProps) {
	const currencyContext = useCurrency();
	const { getPricingInfo, calculatePricesBatch, hasDefaultSetting, isLoadingTldSettings } =
		useDomainPricing(currencyContext);
	const retailPricingReady = !isLoadingTldSettings && hasDefaultSetting;
	const { convertPricesBatch } = currencyContext;
	const TARGET_CURRENCY = "KES";
	const name = React.useMemo(() => searchQuery.trim().toLowerCase().replace(/\s+/g, ""), [searchQuery]);
	const exactMatchTld = React.useMemo(() => getExactMatchTld(rawSearchQuery), [rawSearchQuery]);

	// KENIC: only .co.ke and .ke for this name
	const kenicDomains = React.useMemo(
		() => (name ? [`${name}.co.ke`, `${name}.ke`] : []),
		[name]
	);
	const kenicMutation = trpc.kenic.domainCheck.check.useMutation();
	const [kenicCoKe, setKenicCoKe] = React.useState<KenicCardItem | null>(null);
	const [kenicKe, setKenicKe] = React.useState<KenicCardItem | null>(null);

	// OpenProvider: com, net (bundle + suggested .com card); io kept for byDomain consistency if needed
	const openProviderQuery = trpc.openProvider.domains.checkAvailability.useQuery(
		{
			name: nameForOpenProvider(name),
			extensions: ["com", "net", "io"],
			with_price: true,
			with_whois: false,
		},
		{ enabled: !!name }
	);

	const [openProviderPriced, setOpenProviderPriced] = React.useState<DomainSearchResult[]>([]);
	/** True only after OpenProvider query and async pricing have both settled (so we don't show cards partially). */
	const [openProviderSettled, setOpenProviderSettled] = React.useState(true);
	const queryData = openProviderQuery.data;
	const calculatePricesBatchRef = React.useRef(calculatePricesBatch);
	calculatePricesBatchRef.current = calculatePricesBatch;

	// Start pricing batch as soon as OpenProvider data arrives (before paint)
	React.useLayoutEffect(() => {
		const rawResults = queryData?.success && queryData?.data?.results
			? (queryData.data.results as Array<{ domain: string; status: string; reason?: string; price?: DomainSearchResult["price"] }>)
			: [];
		if (!rawResults.length) {
			setOpenProviderPriced([]);
			setOpenProviderSettled(true);
			return;
		}
		setOpenProviderSettled(false);
		const batch = calculatePricesBatchRef.current;
		if (!batch) {
			setOpenProviderPriced(rawResults.map((r) => ({
				domain: r.domain,
				status: r.status ?? "unknown",
				reason: r.reason,
				price: r.price,
			})));
			setOpenProviderSettled(true);
			return;
		}
		let cancelled = false;
		const raw: DomainSearchResult[] = rawResults.map((r) => ({
			domain: r.domain,
			status: r.status ?? "unknown",
			reason: r.reason,
			price: r.price,
		}));
		const markSettled = () => {
			if (!cancelled) setOpenProviderSettled(true);
		};
		batch(raw).then((priced) => {
			if (!cancelled) setOpenProviderPriced(priced);
			markSettled();
		}).catch(() => {
			if (!cancelled) setOpenProviderPriced(raw);
			markSettled();
		});
		return () => { cancelled = true; };
	}, [queryData]);

	const isMountedRef = React.useRef(true);
	React.useEffect(() => {
		isMountedRef.current = true;
		return () => { isMountedRef.current = false; };
	}, []);

	React.useEffect(() => {
		if (!name || kenicDomains.length === 0) {
			setKenicCoKe(null);
			setKenicKe(null);
			return;
		}
		setKenicCoKe(null);
		setKenicKe(null);
		kenicMutation.mutate(
			{ domains: kenicDomains, withFee: true, currency: "KES", periodYears: 1 },
			{
				onSuccess: (data) => {
					if (!isMountedRef.current) return;
					const normalized = "normalized" in data ? data.normalized : undefined;
					if (normalized && Array.isArray(normalized)) {
						const coKeItem = normalized.find((n: { domain: string }) => n.domain.toLowerCase() === `${name}.co.ke`);
						const keItem = normalized.find((n: { domain: string }) => n.domain.toLowerCase() === `${name}.ke`);
						if (coKeItem) setKenicCoKe(normalizedItemToKenicCard(coKeItem));
						if (keItem) setKenicKe(normalizedItemToKenicCard(keItem));
					}
				},
				onError: () => {
					if (isMountedRef.current) {
						setKenicCoKe(null);
						setKenicKe(null);
					}
				},
			}
		);
	}, [name, String(kenicDomains)]);

	const onLoadingChangeRef = React.useRef(onLoadingChange);
	onLoadingChangeRef.current = onLoadingChange;
	const loading = kenicMutation.isPending || openProviderQuery.isLoading || !openProviderSettled;
	React.useLayoutEffect(() => {
		onLoadingChangeRef.current?.(loading);
	}, [loading]);

	// Build bundle: .co.ke, .ke (KENIC), .com, .net (OpenProvider). At least 3 available. Totals always in KES.
	const bundleInfo = React.useMemo(() => {
		const items: { tld: string; domain: string; available: boolean; basePrice: number; currency: string }[] = [];
		if (kenicCoKe?.available && kenicCoKe.createPrice != null) {
			items.push({ tld: "co.ke", domain: kenicCoKe.domain, available: true, basePrice: kenicCoKe.createPrice, currency: kenicCoKe.currency ?? "KES" });
		}
		if (kenicKe?.available && kenicKe.createPrice != null) {
			items.push({ tld: "ke", domain: kenicKe.domain, available: true, basePrice: kenicKe.createPrice, currency: kenicKe.currency ?? "KES" });
		}
		for (const r of openProviderPriced) {
			if (r.status !== "free" || !r.price?.reseller?.price) continue;
			const tld = r.domain.includes(".") ? r.domain.split(".").slice(-1)[0] ?? "" : "";
			if (tld === "com") items.push({ tld: "com", domain: r.domain, available: true, basePrice: r.price.reseller.price, currency: r.price.reseller.currency ?? "USD" });
			if (tld === "net") items.push({ tld: "net", domain: r.domain, available: true, basePrice: r.price.reseller.price, currency: r.price.reseller.currency ?? "USD" });
		}
		if (items.length < 3) return null;
		return { items };
	}, [kenicCoKe, kenicKe, openProviderPriced]);

	const bundleBasePrices = React.useMemo(
		() => bundleInfo?.items.map((i) => ({ amount: i.basePrice, currency: i.currency })) ?? [],
		[bundleInfo],
	);
	const bundleTotalKes = useBundleTotalKes(bundleBasePrices, convertPricesBatch);

	// Priced results for OpenProvider single-TLD cards (for cart/dialog)
	const byDomain = React.useMemo(() => {
		const map = new Map<string, DomainSearchResult>();
		for (const r of openProviderPriced) map.set(r.domain, r);
		return map;
	}, [openProviderPriced]);

	if (!name) return null;

	const showCoKe = exactMatchTld !== "co.ke" && kenicCoKe?.available === true;
	const showKe = exactMatchTld !== "ke" && kenicKe?.available === true;
	const showCom = exactMatchTld !== "com" && byDomain.get(`${name}.com`)?.status === "free";

	const isLoading = loading;
	const suggestedSectionReady = !kenicMutation.isPending && !openProviderQuery.isLoading && openProviderSettled;
	if (!suggestedSectionReady) {
		return (
			<>
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="bg-card border border-border rounded-lg p-4 md:p-5 min-h-[200px]">
						<div className="flex justify-between items-center mb-2">
							<Skeleton className="h-14 w-14 rounded-lg" />
							<Skeleton className="h-5 w-16" />
						</div>
						<Skeleton className="h-4 w-full mb-2" />
						<Skeleton className="h-4 w-32 mb-2" />
						<Skeleton className="h-8 w-full mt-2" />
					</div>
				))}
			</>
		);
	}

	return (
		<TopLevelCardsInner
			showCoKe={showCoKe}
			kenicCoKe={kenicCoKe}
			showKe={showKe}
			kenicKe={kenicKe}
			bundleInfo={bundleInfo}
			bundleTotalKes={bundleTotalKes}
			showCom={showCom}
			name={name}
			byDomain={byDomain}
			getPricingInfo={getPricingInfo}
			retailPricingReady={retailPricingReady}
			isDomainInCart={isDomainInCart}
			isDomainBundleInCart={isDomainBundleInCart}
			onAddToCart={onAddToCart}
			onRemoveFromCart={onRemoveFromCart}
			onAddDomainBundle={onAddDomainBundle}
			onRemoveDomainBundle={onRemoveDomainBundle}
			formatPrice={formatPrice}
		/>
	);
}

function TopLevelCardsInner({
	showCoKe,
	kenicCoKe,
	showKe,
	kenicKe,
	bundleInfo,
	bundleTotalKes,
	showCom,
	name,
	byDomain,
	getPricingInfo,
	retailPricingReady,
	isDomainInCart,
	isDomainBundleInCart,
	onAddToCart,
	onRemoveFromCart,
	onAddDomainBundle,
	onRemoveDomainBundle,
	formatPrice,
}: {
	showCoKe: boolean;
	kenicCoKe: KenicCardItem | null;
	showKe: boolean;
	kenicKe: KenicCardItem | null;
	bundleInfo: { items: { tld: string; domain: string; basePrice: number; currency: string }[] } | null;
	bundleTotalKes: number | null;
	showCom: boolean;
	name: string;
	byDomain: Map<string, DomainSearchResult>;
	getPricingInfo: (domain: string, original: number, currency: string) => { finalPrice: number; marginAmount: number; marginType: string | null; marginValue: string | null; currency: string };
	retailPricingReady: boolean;
	isDomainInCart: (domain: string) => boolean;
	isDomainBundleInCart: (domainNames: string[]) => boolean;
	onAddToCart: (r: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
	onAddDomainBundle: (params: {
		domains: DomainSearchResult[];
		bundlePrice: number;
		bundleCurrency?: string;
		bundleLabel?: string;
	}) => void;
	onRemoveDomainBundle: (domainNames: string[]) => void;
	formatPrice: (price?: number, currency?: string) => string;
}) {
	const cards: React.ReactNode[] = [];

	if (showCoKe && kenicCoKe) {
		const currency = kenicCoKe.currency ?? "KES";
		const createCalc = getPricingInfo(kenicCoKe.domain, kenicCoKe.createPrice ?? 0, currency);
		const displayResult: DomainSearchResult = {
			domain: kenicCoKe.domain,
			status: "free",
			reason: kenicCoKe.reason,
			price: {
				product: { price: createCalc.finalPrice, currency },
				reseller: { price: createCalc.finalPrice, currency },
				calculated: { originalPrice: kenicCoKe.createPrice ?? 0, marginAmount: createCalc.marginAmount, finalPrice: createCalc.finalPrice, currency: createCalc.currency, marginType: createCalc.marginType, marginValue: createCalc.marginValue },
			},
		};
		cards.push(
			<SingleTldCard
				key="co.ke"
				tld="co.ke"
				domain={kenicCoKe.domain}
				available
				displayPrice={retailPricingReady ? createCalc.finalPrice : undefined}
				currency={retailPricingReady ? currency : undefined}
				displayResult={displayResult}
				isDomainInCart={isDomainInCart}
				onAddToCart={onAddToCart}
				onRemoveFromCart={onRemoveFromCart}
				variant="kenyan"
				formatPrice={formatPrice}
			/>
		);
	}

	if (showKe && kenicKe) {
		const currency = kenicKe.currency ?? "KES";
		const createCalc = getPricingInfo(kenicKe.domain, kenicKe.createPrice ?? 0, currency);
		const displayResult: DomainSearchResult = {
			domain: kenicKe.domain,
			status: "free",
			reason: kenicKe.reason,
			price: {
				product: { price: createCalc.finalPrice, currency },
				reseller: { price: createCalc.finalPrice, currency },
				calculated: { originalPrice: kenicKe.createPrice ?? 0, marginAmount: createCalc.marginAmount, finalPrice: createCalc.finalPrice, currency: createCalc.currency, marginType: createCalc.marginType, marginValue: createCalc.marginValue },
			},
		};
		cards.push(
			<SingleTldCard
				key="ke"
				tld="ke"
				domain={kenicKe.domain}
				available
				displayPrice={retailPricingReady ? createCalc.finalPrice : undefined}
				currency={retailPricingReady ? currency : undefined}
				displayResult={displayResult}
				isDomainInCart={isDomainInCart}
				onAddToCart={onAddToCart}
				onRemoveFromCart={onRemoveFromCart}
				variant="kenyan"
				formatPrice={formatPrice}
			/>
		);
	}

	// Bundle card (total always in KES)
		if (bundleInfo) {
			cards.push(
				<BundleCard
					key="bundle"
					searchName={name}
					bundleInfo={bundleInfo}
					bundleTotalKes={bundleTotalKes}
					formatPrice={formatPrice}
					byDomain={byDomain}
					kenicCoKe={kenicCoKe}
					kenicKe={kenicKe}
					isDomainBundleInCart={isDomainBundleInCart}
					onAddDomainBundle={onAddDomainBundle}
					onRemoveDomainBundle={onRemoveDomainBundle}
				/>
			);
		}

		// .com from OpenProvider; display only final price for customer view
	for (const tld of SUGGESTED_OPEN_TLDS) {
		const domain = `${name}.${tld}`;
		const r = byDomain.get(domain);
		const show = tld === "com" && showCom;
		if (!show || !r || r.status !== "free") continue;
		const { displayPrice, displayCurrency } = getCustomerRetailDisplayPrice(r);
		const showPrice =
			retailPricingReady && displayPrice != null && displayCurrency != null && !Number.isNaN(displayPrice);
		cards.push(
			<SingleTldCard
				key={tld}
				tld={tld}
				domain={domain}
				available
				displayPrice={showPrice ? displayPrice : undefined}
				currency={showPrice ? displayCurrency : undefined}
				displayResult={r}
				isDomainInCart={isDomainInCart}
				onAddToCart={onAddToCart}
				onRemoveFromCart={onRemoveFromCart}
				variant="openprovider"
				formatPrice={formatPrice}
			/>
		);
	}

	return <>{cards}</>;
}

function SingleTldCard({
	tld,
	domain,
	available,
	displayPrice,
	currency,
	displayResult,
	isDomainInCart,
	onAddToCart,
	onRemoveFromCart,
	variant,
	formatPrice: formatPriceProp,
}: {
	tld: string;
	domain: string;
	available: boolean;
	displayPrice?: number;
	currency?: string;
	displayResult: DomainSearchResult;
	isDomainInCart: (d: string) => boolean;
	onAddToCart: (r: DomainSearchResult) => void;
	onRemoveFromCart: (d: string) => void;
	variant: "kenyan" | "openprovider";
	formatPrice: (price?: number, currency?: string) => string;
}) {
	const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
	const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, { enabled: true });
	const isInCart = isDomainInCart(domain);
	const priceReady =
		available &&
		displayPrice != null &&
		!Number.isNaN(displayPrice) &&
		Boolean(currency);
	return (
		<>
			<div className="bg-card border border-border rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow flex flex-col relative min-h-[200px]">
				<div className="flex items-center justify-between gap-2 mb-2">
					<TldLogo tld={tld} variant={variant} />
				<Badge className={available ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs" : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs"}>
					{available ? "Available" : "Taken"}
				</Badge>
				</div>
				<div className="font-bold text-base text-primary mb-1 truncate" title={domain}>{domain}</div>
				{priceReady && (
					<div className="space-y-0.5 mb-2">
						<div className="text-base font-bold text-foreground">{formatPriceProp(displayPrice!, currency!)}</div>
					</div>
				)}
				{available && TLD_WHY_CHOOSE[tld] ? (
					<div>
						<div className="border-t border-border my-2" />
						<ul className="space-y-1.5 mb-3 text-xs text-muted-foreground">
							{TLD_WHY_CHOOSE[tld].map((line, i) => (
								<li key={i} className="flex gap-1.5 items-start">
									<Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" aria-hidden />
									<span className="line-clamp-2">{line}</span>
								</li>
							))}
						</ul>
					</div>
				) : null}
				<div className="mt-auto flex items-center justify-center gap-2">
					{available ? (
						<>
							<Button size="sm" variant="default" onClick={() => domainsProductId && openForProduct({ productId: domainsProductId, productName: "Domains", domain: displayResult })} className="text-xs h-8 px-3" disabled={!domainsProductId || !priceReady}>Buy Now</Button>
							<Button size="sm" variant={isInCart ? "destructive" : "outline"} onClick={(e) => { e?.preventDefault(); if (isInCart) onRemoveFromCart(domain); else if (priceReady) onAddToCart(displayResult); }} className="h-8 w-8 p-0" disabled={!priceReady && !isInCart} title={isInCart ? "Remove from cart" : "Add to cart"}>
								{isInCart ? <XCircle className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
							</Button>
						</>
					) : (
						<Button size="sm" variant="outline" disabled className="text-xs h-8 px-3">Not available</Button>
					)}
				</div>
			</div>
		</>
	);
}

const DISPLAY_CURRENCY = "KES";

/** Order for bundle TLD display: .co.ke, .ke, .com, .net */
const BUNDLE_TLD_ORDER = ["co.ke", "ke", "com", "net"];

function BundleCard({
	searchName,
	bundleInfo,
	bundleTotalKes,
	formatPrice,
	byDomain,
	kenicCoKe,
	kenicKe,
	isDomainBundleInCart,
	onAddDomainBundle,
	onRemoveDomainBundle,
}: {
	searchName: string;
	bundleInfo: { items: { tld: string; domain: string; basePrice: number; currency: string }[] };
	bundleTotalKes: number | null;
	formatPrice: (price?: number, currency?: string) => string;
	byDomain: Map<string, DomainSearchResult>;
	kenicCoKe: KenicCardItem | null;
	kenicKe: KenicCardItem | null;
	isDomainBundleInCart: (domainNames: string[]) => boolean;
	onAddDomainBundle: (params: {
		domains: DomainSearchResult[];
		bundlePrice: number;
		bundleCurrency?: string;
		bundleLabel?: string;
	}) => void;
	onRemoveDomainBundle: (domainNames: string[]) => void;
}) {
	const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
	const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, {
		enabled: true,
	});
	const bundleLabelParts = React.useMemo(() => {
		const byTld = new Map(bundleInfo.items.map((i) => [i.tld, i]));
		return BUNDLE_TLD_ORDER.filter((tld) => byTld.has(tld));
	}, [bundleInfo.items]);

	const buildBundleDomainResults = React.useCallback((): DomainSearchResult[] => {
		const results: DomainSearchResult[] = [];
		for (const item of bundleInfo.items) {
			if (item.tld === "co.ke" && kenicCoKe) {
				const currency = kenicCoKe.currency ?? "KES";
				const basePrice = kenicCoKe.createPrice ?? 0;
				results.push({
					domain: kenicCoKe.domain,
					status: "free",
					price: {
						product: { price: basePrice, currency },
						reseller: { price: basePrice, currency },
					},
				});
			} else if (item.tld === "ke" && kenicKe) {
				const currency = kenicKe.currency ?? "KES";
				const basePrice = kenicKe.createPrice ?? 0;
				results.push({
					domain: kenicKe.domain,
					status: "free",
					price: {
						product: { price: basePrice, currency },
						reseller: { price: basePrice, currency },
					},
				});
			} else {
				const r = byDomain.get(item.domain);
				if (r) results.push(r);
			}
		}
		return results;
	}, [bundleInfo.items, byDomain, kenicCoKe, kenicKe]);

	const handleGetDeal = () => {
		if (!domainsProductId || bundleTotalKes == null) return;
		const domains = buildBundleDomainResults();
		if (domains.length !== bundleInfo.items.length) return;
		openForProduct({
			productId: domainsProductId,
			productName: "Domains",
			domainBundle: createDomainBundleCheckoutContext({
				domains,
				bundlePrice: bundleTotalKes,
				bundleCurrency: DISPLAY_CURRENCY,
				bundleLabel: formatDomainBundleLabel(domains.map((d) => d.domain)),
			}),
		});
	};

	const bundleDomains = React.useMemo(() => buildBundleDomainResults(), [buildBundleDomainResults]);
	const bundleDomainNames = React.useMemo(
		() => bundleDomains.map((d) => d.domain).filter(Boolean),
		[bundleDomains],
	);
	const bundleReady =
		bundleTotalKes != null && bundleDomains.length === bundleInfo.items.length;
	const bundleInCart = bundleReady && isDomainBundleInCart(bundleDomainNames);

	const handleBundleCartToggle = (e?: React.MouseEvent) => {
		e?.preventDefault();
		if (!bundleReady || bundleTotalKes == null) return;
		if (bundleInCart) {
			onRemoveDomainBundle(bundleDomainNames);
			return;
		}
		onAddDomainBundle({
			domains: bundleDomains,
			bundlePrice: bundleTotalKes,
			bundleCurrency: DISPLAY_CURRENCY,
			bundleLabel: formatDomainBundleLabel(bundleDomainNames),
		});
	};

	return (
		<div key="bundle" className="bg-card border border-border rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow flex flex-col relative min-h-[200px]">
			<Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground">Bundle & save</Badge>
			<div className="flex items-center justify-between gap-2 mb-2">
				<div className="flex items-center justify-center rounded-lg bg-muted p-2 size-10">
					<img src="/nisciconoriginal.png" alt="Bundle" width={24} height={24} className="object-contain" />
				</div>
			</div>
			<div className="font-bold text-base mb-1 min-h-[2.5rem] line-clamp-2 break-words" title={bundleLabelParts.length ? `${searchName}.${bundleLabelParts[0]}${bundleLabelParts.slice(1).map((t) => ` + .${t}`).join("")}` : ""}>
				{bundleLabelParts.length > 0 ? (
					<>
						<span className="text-foreground">{searchName}</span>
						<span className="text-primary">.{bundleLabelParts[0]}</span>
						{bundleLabelParts.slice(1).map((tld) => (
							<React.Fragment key={tld}>
								<span className="text-foreground"> + </span>
								<span className="text-primary">.{tld}</span>
							</React.Fragment>
						))}
					</>
				) : null}
			</div>
			<div className="text-base font-bold text-foreground mb-2 line-clamp-2 break-words">
				{bundleTotalKes != null ? formatPrice(bundleTotalKes, DISPLAY_CURRENCY) : "-"}
			</div>
			{TLD_WHY_CHOOSE.bundle ? (
				<div>
					<div className="border-t border-border my-2" />
					<ul className="space-y-1.5 mb-3 text-xs text-muted-foreground">
						{TLD_WHY_CHOOSE.bundle.map((line, i) => (
							<li key={i} className="flex gap-1.5 items-start">
								<Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" aria-hidden />
								<span className="line-clamp-2">{line}</span>
							</li>
						))}
					</ul>
				</div>
			) : null}
			<div className="mt-auto flex items-center justify-center gap-2">
				<Button
					size="sm"
					variant="default"
					onClick={handleGetDeal}
					className="text-xs h-8 px-3"
					disabled={!domainsProductId || bundleTotalKes == null}
				>
					Get deal
				</Button>
				<Button
					size="sm"
					variant={bundleInCart ? "destructive" : "outline"}
					onClick={handleBundleCartToggle}
					className="h-8 w-8 p-0"
					disabled={!bundleReady && !bundleInCart}
					title={bundleInCart ? "Remove bundle from cart" : "Add bundle to cart"}
				>
					{bundleInCart ? <XCircle className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
				</Button>
			</div>
		</div>
	);
}
