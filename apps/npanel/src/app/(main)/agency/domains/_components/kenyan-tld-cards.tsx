"use client";

import * as React from "react";
import { ShoppingCart, XCircle } from "lucide-react";
import { TldLogo } from "./tld-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { useCurrency } from "./currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import { BuyNowDialog } from "./buy-now-dialog";
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
		EUR: "€",
		GBP: "£",
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

function KenyanTldCard({
	item,
	priced,
	isDomainInCart,
	onAddToCart,
	onRemoveFromCart,
}: {
	item: KenicCardItem;
	priced: PricedFees;
	isDomainInCart: (domain: string) => boolean;
	onAddToCart: (result: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
}) {
	const [buyNowOpen, setBuyNowOpen] = React.useState(false);
	const isInCart = isDomainInCart(item.domain);
	const displayResult = toDomainSearchResult(item, priced);

	const handleCart = (e?: React.MouseEvent) => {
		e?.preventDefault();
		e?.stopPropagation();
		if (isInCart) onRemoveFromCart(item.domain);
		else if (item.available) onAddToCart(displayResult);
	};

	const marginLabel = formatMarginInfo(priced.createCalc, formatPrice);
	const currency = item.currency || "KES";

	return (
		<>
			<div className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col">
				{/* Row 1: Logo (left) + Availability (right) */}
				<div className="flex items-center justify-between gap-2 mb-2">
					<TldLogo tld={item.tld} variant="kenyan" />
					<Badge
						className={
							item.available
								? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs"
								: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs"
						}
					>
						{item.available ? "Available" : "Taken"}
					</Badge>
				</div>

				{/* Row 2: Domain name - bold primary */}
				<div className="font-bold text-sm text-primary mb-1 truncate" title={item.domain}>
					{item.domain}
				</div>

				{/* Registration (dominant): just price, bigger, bold black; then Renewal / Transfer with labels; margin line when present */}
				{item.available && (
					<div className="space-y-0.5 mb-2">
						{/* Registration: price only, slightly larger, bold, black */}
						<div className="text-sm font-bold text-foreground">
							{formatPrice(priced.createFinal, currency)}
						</div>
						{marginLabel != null && (
							<div className="text-[10px] text-muted-foreground text-green-600 dark:text-green-400">
								{marginLabel}
							</div>
						)}
						<div className="text-xs text-muted-foreground space-y-0.5 pt-0.5">
							{item.renewPrice != null && (
								<div>Renewal: {formatPrice(priced.renewFinal, currency)}</div>
							)}
							{item.transferPrice != null && (
								<div>Transfer: {formatPrice(priced.transferFinal, currency)}</div>
							)}
						</div>
					</div>
				)}

				{/* Reason from API when present (available or not) — only show if non-null */}
				{item.reason != null && item.reason !== "" && (
					<div className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
						{item.reason}
					</div>
				)}

				{/* Cart + Buy Now */}
				<div className="mt-auto flex items-center justify-center gap-2">
					{item.available ? (
						<>
							<Button
								size="sm"
								variant="default"
								onClick={(e) => {
									e?.preventDefault();
									setBuyNowOpen(true);
								}}
								className="text-xs h-8 px-3"
							>
								Buy Now
							</Button>
							<Button
								size="sm"
								variant={isInCart ? "destructive" : "outline"}
								onClick={handleCart}
								className="h-8 w-8 p-0"
								title={isInCart ? "Remove from cart" : "Add to cart"}
							>
								{isInCart ? (
									<XCircle className="h-4 w-4" />
								) : (
									<ShoppingCart className="h-4 w-4" />
								)}
							</Button>
						</>
					) : (
						<Button size="sm" variant="outline" disabled className="text-xs h-8 px-3">
							Not available
						</Button>
					)}
				</div>
			</div>

			{item.available && (
				<BuyNowDialog
					open={buyNowOpen}
					onOpenChange={setBuyNowOpen}
					domain={displayResult}
				/>
			)}
		</>
	);
}

const KENYAN_CARDS_SKELETON = (
	<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
		{Array.from({ length: 9 }).map((_, i) => (
			<div key={i} className="bg-card border border-border rounded-lg p-3">
				<div className="flex justify-between items-center mb-2">
					<Skeleton className="h-12 w-12 rounded-lg" />
					<Skeleton className="h-5 w-16" />
				</div>
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-3 w-20 mb-1" />
				<Skeleton className="h-3 w-24 mb-2" />
				<Skeleton className="h-8 w-full mt-2" />
			</div>
		))}
	</div>
);

export interface KenyanTldCardsProps {
	searchQuery: string;
	onAddToCart: (result: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
	isDomainInCart: (domain: string) => boolean;
	/** Report loading state for aggregation (e.g. search button spinner). */
	onLoadingChange?: (loading: boolean) => void;
}

export function KenyanTldCards({
	searchQuery,
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

	React.useEffect(() => {
		if (!sanitized || domains.length === 0) {
			setCards(null);
			return;
		}
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
					const normalized = "normalized" in data ? data.normalized : undefined;
					if (normalized && Array.isArray(normalized)) {
						setCards(normalizeToKenicCards(sanitized, normalized));
					} else {
						setCards(null);
					}
				},
				onError: () => setCards(null),
			}
		);
	}, [sanitized, domains]);

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

	React.useEffect(() => {
		onLoadingChange?.(checkMutation.isPending);
	}, [checkMutation.isPending, onLoadingChange]);

	if (!sanitized) return null;

	// Kenyan-only loading: skeleton only for this block; other sections are independent
	const isLoading = checkMutation.isPending;
	const error = checkMutation.isError;

	if (isLoading && cards == null) return KENYAN_CARDS_SKELETON;

	const list = cards ?? [];

	return (
		<section className="mb-6">
			<h3 className="text-base font-semibold tracking-tight text-card-foreground mb-4">
				Give your brand a Kenyan vibe
			</h3>
			{error && (
				<p className="text-sm text-destructive mb-2">
					Could not load Kenyan TLD availability. Try again later.
				</p>
			)}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
				{list.map((item) => {
					const priced = pricedMap.get(item.domain) ?? {
						createFinal: item.createPrice ?? 0,
						renewFinal: item.renewPrice ?? 0,
						transferFinal: item.transferPrice ?? 0,
						createCalc: { marginAmount: 0, marginType: null, marginValue: null, currency: item.currency ?? "KES" },
					};
					return (
						<KenyanTldCard
							key={item.domain}
							item={item}
							priced={priced}
							isDomainInCart={isDomainInCart}
							onAddToCart={onAddToCart}
							onRemoveFromCart={onRemoveFromCart}
						/>
					);
				})}
			</div>
		</section>
	);
}
