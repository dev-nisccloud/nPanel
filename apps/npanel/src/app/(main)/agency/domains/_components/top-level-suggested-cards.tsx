"use client";

import * as React from "react";
import Image from "next/image";
import { Check, ShoppingCart, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TldLogo } from "./tld-logo";
import { BuyNowDialog } from "./buy-now-dialog";
import { nameForOpenProvider } from "./use-section-domain-check";
import { parseFullDomain, normalizedItemToKenicCard } from "./kenic-card-schema";
import type { KenicCardItem } from "./kenic-card-schema";
import { trpc } from "@/utils/trpc";
import { useCurrency } from "./currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

const formatPrice = (price?: number, currency?: string) => {
	if (price == null || price === undefined) return "N/A";
	const symbols: Record<string, string> = { USD: "$", KES: "KSh", EUR: "€", GBP: "£" };
	const symbol = symbols[currency ?? "USD"] ?? currency ?? "$";
	return `${symbol} ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)}`;
};

/** Format margin for display e.g. "+15% (+KSh 100)" or "+KSh 50" */
function formatMarginLabel(
	marginType: string | null,
	marginValue: string | null,
	marginAmount: number,
	currency: string,
	format: (n: number, c: string) => string
): string | null {
	if (!marginType || marginAmount <= 0) return null;
	if (marginType === "PERCENTAGE") return `+${marginValue}% (+${format(marginAmount, currency)})`;
	const fixed = parseFloat(marginValue ?? "0");
	return `+${format(fixed, currency)}`;
}

/** Suggested single-TLD cards order: .co.ke, .ke, then .com, .org, .net, .io */
const SUGGESTED_OPEN_TLDS = ["com", "org", "net", "io"] as const;

/** Two short “why choose” points per TLD (and bundle) for suggested cards. Descriptions can wrap to two lines. */
const TLD_WHY_CHOOSE: Record<string, [string, string]> = {
	"co.ke": [
		"Kenya’s most trusted commercial extension, ideal for local businesses and brands.",
		"Strong local SEO and instant recognition with Kenyan customers.",
	],
	ke: [
		"Short, memorable .ke for a bold Kenyan identity.",
		"Perfect for startups and brands that want to stand out locally.",
	],
	com: [
		"The world’s most recognized TLD, builds trust and credibility everywhere.",
		"Best for global reach and lasting memorability.",
	],
	org: [
		"Signals purpose and trust, ideal for nonprofits and communities.",
		"Helps supporters and donors take you seriously.",
	],
	net: [
		"Classic tech and network vibe, great for web and infrastructure.",
		"Reliable choice for professionals and tech-focused brands.",
	],
	io: [
		"Loved by developers and startups for a modern, tech-forward image.",
		"Short, catchy, and perfect for apps and SaaS.",
	],
	info: [
		"Clear and informative, ideal for resources, guides and knowledge hubs.",
		"Affordable and trusted for content and reference sites.",
	],
	bundle: [
		"Lock in .co.ke, .com, .org, .net & .info together and save.",
		"One purchase, multiple identities—best value for your brand.",
	],
};

export interface TopLevelSuggestedCardsProps {
	/** Sanitized name only (no TLD). */
	searchQuery: string;
	/** Raw query (e.g. "example.com") to derive exact match TLD. */
	rawSearchQuery: string;
	isDomainInCart: (domain: string) => boolean;
	onAddToCart: (result: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
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
	onAddToCart,
	onRemoveFromCart,
	onLoadingChange,
}: TopLevelSuggestedCardsProps) {
	const currencyContext = useCurrency();
	const { getPricingInfo, calculatePricesBatch } = useDomainPricing(currencyContext);
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

	// OpenProvider: com, org, net, info, io
	const openProviderQuery = trpc.openProvider.domains.checkAvailability.useQuery(
		{
			name: nameForOpenProvider(name),
			extensions: ["com", "org", "net", "info", "io"],
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

	// Build bundle: .co.ke (KENIC), .com, .org, .net, .info (OpenProvider). At least 3 available. Totals always in KES.
	const bundleInfo = React.useMemo(() => {
		const items: { tld: string; domain: string; available: boolean; basePrice: number; currency: string }[] = [];
		if (kenicCoKe?.available && kenicCoKe.createPrice != null) {
			items.push({ tld: "co.ke", domain: kenicCoKe.domain, available: true, basePrice: kenicCoKe.createPrice, currency: kenicCoKe.currency ?? "KES" });
		}
		for (const r of openProviderPriced) {
			if (r.status !== "free" || !r.price?.reseller?.price) continue;
			const tld = r.domain.includes(".") ? r.domain.split(".").slice(-1)[0] ?? "" : "";
			if (tld === "com") items.push({ tld: "com", domain: r.domain, available: true, basePrice: r.price.reseller.price, currency: r.price.reseller.currency ?? "USD" });
			if (tld === "org") items.push({ tld: "org", domain: r.domain, available: true, basePrice: r.price.reseller.price, currency: r.price.reseller.currency ?? "USD" });
			if (tld === "net") items.push({ tld: "net", domain: r.domain, available: true, basePrice: r.price.reseller.price, currency: r.price.reseller.currency ?? "USD" });
			if (tld === "info") items.push({ tld: "info", domain: r.domain, available: true, basePrice: r.price.reseller.price, currency: r.price.reseller.currency ?? "USD" });
		}
		if (items.length < 3) return null;
		return { items };
	}, [kenicCoKe, openProviderPriced]);

	// Convert bundle base prices to KES, then sum and add 15% markup. Start before paint.
	const [bundleTotalKes, setBundleTotalKes] = React.useState<number | null>(null);
	React.useLayoutEffect(() => {
		if (!bundleInfo?.items.length || !convertPricesBatch) {
			setBundleTotalKes(null);
			return;
		}
		let cancelled = false;
		const prices = bundleInfo.items.map((i) => ({ amount: i.basePrice, currency: i.currency }));
		convertPricesBatch(prices, TARGET_CURRENCY)
			.then((converted) => {
				if (cancelled || !converted?.length) return;
				const totalBaseKes = (converted as Array<{ convertedAmount: number }>).reduce((sum, c) => sum + (c.convertedAmount ?? 0), 0);
				setBundleTotalKes(Math.round(totalBaseKes * 1.15 * 100) / 100);
			})
			.catch(() => {
				if (!cancelled) setBundleTotalKes(null);
			});
		return () => { cancelled = true; };
	}, [bundleInfo, convertPricesBatch]);

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
	const showOrg = exactMatchTld !== "org" && byDomain.get(`${name}.org`)?.status === "free";
	const showNet = exactMatchTld !== "net" && byDomain.get(`${name}.net`)?.status === "free";
	const showIo = exactMatchTld !== "io" && byDomain.get(`${name}.io`)?.status === "free";

	const isLoading = loading;
	const suggestedSectionReady = !kenicMutation.isPending && !openProviderQuery.isLoading && openProviderSettled;
	if (!suggestedSectionReady) {
		return (
			<>
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="bg-card border border-border rounded-lg p-3">
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
			showOrg={showOrg}
			showNet={showNet}
			showIo={showIo}
			name={name}
			byDomain={byDomain}
			getPricingInfo={getPricingInfo}
			isDomainInCart={isDomainInCart}
			onAddToCart={onAddToCart}
			onRemoveFromCart={onRemoveFromCart}
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
	showOrg,
	showNet,
	showIo,
	name,
	byDomain,
	getPricingInfo,
	isDomainInCart,
	onAddToCart,
	onRemoveFromCart,
	formatPrice,
}: {
	showCoKe: boolean;
	kenicCoKe: KenicCardItem | null;
	showKe: boolean;
	kenicKe: KenicCardItem | null;
	bundleInfo: { items: { tld: string; domain: string; basePrice: number; currency: string }[] } | null;
	bundleTotalKes: number | null;
	showCom: boolean;
	showOrg: boolean;
	showNet: boolean;
	showIo: boolean;
	name: string;
	byDomain: Map<string, DomainSearchResult>;
	getPricingInfo: (domain: string, original: number, currency: string) => { finalPrice: number; marginAmount: number; marginType: string | null; marginValue: string | null; currency: string };
	isDomainInCart: (domain: string) => boolean;
	onAddToCart: (r: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
	formatPrice: (price?: number, currency?: string) => string;
}) {
	const cards: React.ReactNode[] = [];

	if (showCoKe && kenicCoKe) {
		const currency = kenicCoKe.currency ?? "KES";
		const createCalc = getPricingInfo(kenicCoKe.domain, kenicCoKe.createPrice ?? 0, currency);
		const marginLabel = formatMarginLabel(createCalc.marginType, createCalc.marginValue, createCalc.marginAmount, currency, formatPrice);
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
				displayPrice={createCalc.finalPrice}
				currency={currency}
				originalPrice={kenicCoKe.createPrice ?? undefined}
				marginLabel={marginLabel}
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
		const marginLabel = formatMarginLabel(createCalc.marginType, createCalc.marginValue, createCalc.marginAmount, currency, formatPrice);
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
				displayPrice={createCalc.finalPrice}
				currency={currency}
				originalPrice={kenicKe.createPrice ?? undefined}
				marginLabel={marginLabel}
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
				isDomainInCart={isDomainInCart}
				onAddToCart={onAddToCart}
				byDomain={byDomain}
				kenicCoKe={kenicCoKe}
				getPricingInfo={getPricingInfo}
			/>
		);
	}

	// .com, .org, .net, .io from OpenProvider – original in converted (KES), display price after markup + conversion, show markup %
	for (const tld of SUGGESTED_OPEN_TLDS) {
		const domain = `${name}.${tld}`;
		const r = byDomain.get(domain);
		const show = (tld === "com" && showCom) || (tld === "org" && showOrg) || (tld === "net" && showNet) || (tld === "io" && showIo);
		if (!show || !r || r.status !== "free") continue;
		const calc = r.price?.calculated as {
			convertedPrice?: number;
			convertedOriginalPrice?: number;
			displayCurrency?: string;
			finalPrice: number;
			originalPrice?: number;
			currency: string;
			marginType?: string | null;
			marginValue?: string | null;
			marginAmount?: number;
		} | undefined;
		const displayPrice = calc?.convertedPrice ?? calc?.finalPrice ?? r.price?.reseller?.price ?? 0;
		const currency = calc?.displayCurrency ?? calc?.currency ?? r.price?.reseller?.currency ?? "USD";
		// Original shown in display (converted) currency; markup from calculated or (display - original)
		const originalPrice = calc?.convertedOriginalPrice ?? calc?.originalPrice ?? r.price?.reseller?.price;
		const marginAmountDisplay = originalPrice != null && displayPrice != null ? displayPrice - originalPrice : (calc?.marginAmount ?? 0);
		const marginLabel = formatMarginLabel(
			calc?.marginType ?? null,
			calc?.marginValue ?? null,
			marginAmountDisplay,
			currency,
			formatPrice
		);
		cards.push(
			<SingleTldCard
				key={tld}
				tld={tld}
				domain={domain}
				available
				displayPrice={displayPrice}
				currency={currency}
				originalPrice={originalPrice}
				marginLabel={marginLabel}
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
	originalPrice,
	marginLabel,
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
	displayPrice: number;
	currency: string;
	originalPrice?: number;
	marginLabel?: string | null;
	displayResult: DomainSearchResult;
	isDomainInCart: (d: string) => boolean;
	onAddToCart: (r: DomainSearchResult) => void;
	onRemoveFromCart: (d: string) => void;
	variant: "kenyan" | "openprovider";
	formatPrice: (price?: number, currency?: string) => string;
}) {
	const [buyOpen, setBuyOpen] = React.useState(false);
	const isInCart = isDomainInCart(domain);
	return (
		<>
			<div className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col relative">
				<div className="flex items-center justify-between gap-2 mb-2">
					<TldLogo tld={tld} variant={variant} />
				<Badge className={available ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs" : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs"}>
					{available ? "Available" : "Taken"}
				</Badge>
				</div>
				<div className="font-bold text-sm text-primary mb-1 truncate" title={domain}>{domain}</div>
				{available && (
					<div className="space-y-0.5 mb-2">
						{originalPrice != null && (
							<div className="text-[10px] text-muted-foreground">Original: {formatPriceProp(originalPrice, currency)}</div>
						)}
						{marginLabel != null && marginLabel !== "" && (
							<div className="text-[10px] text-green-600 dark:text-green-400">{marginLabel}</div>
						)}
						<div className="text-sm font-bold text-foreground">{formatPriceProp(displayPrice, currency)}</div>
					</div>
				)}
				{available && TLD_WHY_CHOOSE[tld] ? (
					<div>
						<div className="border-t border-border my-2" />
						<ul className="space-y-1.5 mb-3 text-[11px] text-muted-foreground">
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
							<Button size="sm" variant="default" onClick={() => setBuyOpen(true)} className="text-xs h-8 px-3">Buy Now</Button>
							<Button size="sm" variant={isInCart ? "destructive" : "outline"} onClick={(e) => { e?.preventDefault(); isInCart ? onRemoveFromCart(domain) : onAddToCart(displayResult); }} className="h-8 w-8 p-0" title={isInCart ? "Remove from cart" : "Add to cart"}>
								{isInCart ? <XCircle className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
							</Button>
						</>
					) : (
						<Button size="sm" variant="outline" disabled className="text-xs h-8 px-3">Not available</Button>
					)}
				</div>
			</div>
			{available && <BuyNowDialog open={buyOpen} onOpenChange={setBuyOpen} domain={displayResult} />}
		</>
	);
}

const DISPLAY_CURRENCY = "KES";

/** Order for bundle TLD display: .co.ke first, then .com, .org, .net, .info */
const BUNDLE_TLD_ORDER = ["co.ke", "com", "org", "net", "info"];

function BundleCard({
	searchName,
	bundleInfo,
	bundleTotalKes,
	formatPrice,
	isDomainInCart,
	onAddToCart,
	byDomain,
	kenicCoKe,
	getPricingInfo,
}: {
	searchName: string;
	bundleInfo: { items: { tld: string; domain: string; basePrice: number; currency: string }[] };
	bundleTotalKes: number | null;
	formatPrice: (price?: number, currency?: string) => string;
	isDomainInCart: (d: string) => boolean;
	onAddToCart: (r: DomainSearchResult) => void;
	byDomain: Map<string, DomainSearchResult>;
	kenicCoKe: KenicCardItem | null;
	getPricingInfo: (domain: string, original: number, currency: string) => { finalPrice: number; marginAmount: number; marginType: string | null; marginValue: string | null; currency: string };
}) {
	const bundleLabelParts = React.useMemo(() => {
		const byTld = new Map(bundleInfo.items.map((i) => [i.tld, i]));
		return BUNDLE_TLD_ORDER.filter((tld) => byTld.has(tld));
	}, [bundleInfo.items]);

	const handleAddBundle = () => {
		for (const item of bundleInfo.items) {
			if (item.tld === "co.ke" && kenicCoKe) {
				const currency = kenicCoKe.currency ?? "KES";
				const createCalc = getPricingInfo(kenicCoKe.domain, kenicCoKe.createPrice ?? 0, currency);
				onAddToCart({
					domain: kenicCoKe.domain,
					status: "free",
					price: {
						product: { price: createCalc.finalPrice, currency },
						reseller: { price: createCalc.finalPrice, currency },
						calculated: { originalPrice: kenicCoKe.createPrice ?? 0, marginAmount: createCalc.marginAmount, finalPrice: createCalc.finalPrice, currency: createCalc.currency, marginType: createCalc.marginType, marginValue: createCalc.marginValue },
					},
				});
			} else {
				const r = byDomain.get(item.domain);
				if (r) onAddToCart(r);
			}
		}
	};
	const anyInCart = bundleInfo.items.some((i) => isDomainInCart(i.domain));
	return (
		<div key="bundle" className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col relative">
			<Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground">Bundle & save</Badge>
			<div className="flex items-center justify-between gap-2 mb-2">
				<div className="flex items-center justify-center rounded-lg bg-muted p-2 size-10">
					<Image src="/nisciconoriginal.png" alt="Bundle" width={24} height={24} className="object-contain" />
				</div>
			</div>
			<div className="font-bold text-sm mb-1 min-h-[2.5rem] line-clamp-2 break-words" title={bundleLabelParts.length ? `${searchName}.${bundleLabelParts[0]}${bundleLabelParts.slice(1).map((t) => ` + .${t}`).join("")}` : ""}>
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
			<div className="text-sm font-bold text-foreground mb-2">
				{bundleTotalKes != null ? formatPrice(bundleTotalKes, DISPLAY_CURRENCY) : "…"} total
			</div>
			{TLD_WHY_CHOOSE.bundle ? (
				<div>
					<div className="border-t border-border my-2" />
					<ul className="space-y-1.5 mb-3 text-[11px] text-muted-foreground">
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
				<Button size="sm" variant="default" onClick={handleAddBundle} className="text-xs h-8 px-3" disabled={anyInCart}>
					{anyInCart ? "In cart" : "Add bundle to cart"}
				</Button>
			</div>
		</div>
	);
}
