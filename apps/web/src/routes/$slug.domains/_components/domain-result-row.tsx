"use client";

import * as React from "react";
import { ShoppingCart, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGlobalBuyNowStore } from "@/stores/global-buy-now-store";
import { trpc } from "@/utils/trpc";
import type { DomainSearchResult } from "@/hooks/use-domain-search";

const formatPrice = (price?: number, currency?: string) => {
	if (price == null || price === undefined) return "N/A";
	const symbols: Record<string, string> = { USD: "$", KES: "KSh", EUR: "€", GBP: " ?" };
	const symbol = symbols[currency ?? "USD"] ?? currency ?? "$";
	return `${symbol} ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)}`;
};

export interface DomainResultRowProps {
	/** Domain name (e.g. example.co.ke) ? bold, foreground, same size as price. */
	domain: string;
	/** Whether the domain is available for registration. */
	isAvailable: boolean;
	/** Final price to show (after markup and conversion) ? bold, primary. */
	displayPrice: number;
	displayCurrency: string;
	/** Reason/description from API ? shown in left column. */
	reason?: string | null;
	/** For cart and Buy Now. */
	displayResult: DomainSearchResult;
	isDomainInCart: (domain: string) => boolean;
	onAddToCart: (r: DomainSearchResult) => void;
	onRemoveFromCart: (domain: string) => void;
}

/**
 * Single row in the table-like list (no TLD logo). Used for Kenyan TLDs and category sections.
 * Left: domain (bold foreground), original price, margin, availability badge, reason.
 * Right: price (bold primary) + /1st yr, Buy Now + cart icon.
 */
export function DomainResultRow({
	domain,
	isAvailable,
	displayPrice,
	displayCurrency,
	reason,
	displayResult,
	isDomainInCart,
	onAddToCart,
	onRemoveFromCart,
}: DomainResultRowProps) {
	const openForProduct = useGlobalBuyNowStore((s) => s.openForProduct);
	const { data: domainsProductId } = trpc.clientSubscriptions.getDomainsProductId.useQuery(undefined, { enabled: true });
	const handleBuyNow = React.useCallback(() => {
		if (domainsProductId) openForProduct({ productId: domainsProductId, productName: "Domains", domain: displayResult });
	}, [domainsProductId, openForProduct, displayResult]);
	const isInCart = isDomainInCart(domain);

	const handleCart = (e?: React.MouseEvent) => {
		e?.preventDefault();
		e?.stopPropagation();
		if (isInCart) onRemoveFromCart(domain);
		else if (isAvailable) onAddToCart(displayResult);
	};

	return (
		<>
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0">
				{/* Left: domain, availability, reason */}
				<div className="min-w-0 flex-1 space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-bold text-sm text-foreground truncate" title={domain}>
							{domain}
						</span>
						<Badge
							className={
								isAvailable
									? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs shrink-0"
									: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs shrink-0"
							}
						>
							{isAvailable ? "Available" : "Taken"}
						</Badge>
					</div>
					{reason != null && reason !== "" && (
						<div className="text-[11px] text-muted-foreground line-clamp-2" title={reason}>
							{reason}
						</div>
					)}
				</div>
				{/* Right: price /1st yr, Buy Now, cart */}
				<div className="flex items-center gap-3 shrink-0">
					<div className="text-right">
						<span className="font-bold text-sm text-primary">
							{formatPrice(displayPrice, displayCurrency)}
						</span>
						<span className="text-sm text-foreground"> /1st yr</span>
					</div>
					{isAvailable ? (
						<div className="flex items-center gap-1.5">
							<Button
								size="sm"
								variant="default"
								onClick={(e) => { e?.preventDefault(); handleBuyNow(); }}
								className="text-xs h-8 px-3"
								disabled={!domainsProductId}
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
								{isInCart ? <XCircle className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
							</Button>
						</div>
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

/** Wrapper that renders a list of rows with dividers (no divider after last). */
export function DomainResultList({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={className}>
			{React.Children.map(React.Children.toArray(children), (child, index) => (
				<React.Fragment key={index}>
					{child}
					{index < React.Children.count(children) - 1 && (
						<div className="border-b border-border" aria-hidden />
					)}
				</React.Fragment>
			))}
		</div>
	);
}
