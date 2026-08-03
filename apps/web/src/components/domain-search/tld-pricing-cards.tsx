"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import { TldLogo } from "@/routes/agency.domains/_components/tld-logo";
import { cn } from "@/lib/utils";

/** Stable probe label used only to fetch create/list prices (not shown to users). */
const PRICE_PROBE_NAME = "nisccloudprice";

type ShowcaseTld = {
	ext: string;
	variant: "kenyan" | "openprovider";
	note?: string;
};

/** Popular local + global extensions shown under domain search (live prices). */
const SHOWCASE_TLDS: ShowcaseTld[] = [
	{ ext: ".co.ke", variant: "kenyan", note: "Popular" },
	{ ext: ".ke", variant: "kenyan" },
	{ ext: ".com", variant: "openprovider" },
	{ ext: ".net", variant: "openprovider" },
	{ ext: ".org", variant: "openprovider" },
	{ ext: ".io", variant: "openprovider" },
];

type PricedTld = {
	amount: number;
	currency: string;
};

type CurrencyContextLike = {
	selectedCurrency: string;
	isConversionAvailable: boolean;
	convertPricesBatch: (
		prices: Array<{ amount: number; currency: string }>,
		targetCurrency: string,
	) => Promise<Array<{ convertedAmount: number; currency?: string }>>;
};

function formatPrice(price: number, currency: string = "KES") {
	const symbols: Record<string, string> = {
		USD: "$",
		KES: "KSh",
		EUR: "€",
		GBP: "£",
	};
	const symbol = symbols[currency] ?? currency;
	const formatted = new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(price);
	return `${symbol} ${formatted}`;
}

function PriceCell({
	price,
	loading,
}: {
	price?: PricedTld;
	loading: boolean;
}) {
	if (loading && !price) {
		return <Skeleton className="h-4 w-16 mx-auto" />;
	}
	if (!price) {
		return <span className="text-[11px] text-muted-foreground">Search for price</span>;
	}
	return (
		<p className="text-sm font-semibold text-foreground tabular-nums">
			{formatPrice(price.amount, price.currency)}
			<sup className="ml-0.5 text-[9px] font-normal text-muted-foreground align-super">
				/yr
			</sup>
		</p>
	);
}

export type TldPricingCardsProps = {
	currencyContext: CurrencyContextLike;
	className?: string;
};

/**
 * Live TLD price showcase under domain search (agency + customer).
 * Same source as the public landing page: Kenic fees + OpenProvider reseller prices,
 * with TLD margin applied and converted to the selected display currency (usually KES).
 */
export function TldPricingCards({ currencyContext, className }: TldPricingCardsProps) {
	const { getPricingInfo, isLoadingTldSettings, hasDefaultSetting, selectedCurrency } =
		useDomainPricing(currencyContext);
	const { convertPricesBatch } = currencyContext;
	const [pricesByExt, setPricesByExt] = React.useState<Record<string, PricedTld>>({});
	const [loading, setLoading] = React.useState(true);

	const kenicMutation = trpc.kenic.domainCheck.check.useMutation();
	const utils = trpc.useUtils();
	const kenicMutateRef = React.useRef(kenicMutation.mutateAsync);
	kenicMutateRef.current = kenicMutation.mutateAsync;
	const fetchAvailabilityRef = React.useRef(utils.openProvider.domains.checkAvailability.fetch);
	fetchAvailabilityRef.current = utils.openProvider.domains.checkAvailability.fetch;

	const pricingReady = !isLoadingTldSettings && hasDefaultSetting;
	const displayCurrency = selectedCurrency || "KES";

	const toDisplay = React.useCallback(
		async (basePrice: number, currency: string, domainLabel: string): Promise<PricedTld | null> => {
			if (typeof basePrice !== "number" || Number.isNaN(basePrice)) return null;
			const calc = getPricingInfo(domainLabel, basePrice, currency);
			if (currency === displayCurrency) {
				return { amount: calc.finalPrice, currency: displayCurrency };
			}
			const [converted] = await convertPricesBatch(
				[{ amount: calc.finalPrice, currency }],
				displayCurrency,
			);
			if (!converted || Number.isNaN(converted.convertedAmount)) {
				return { amount: calc.finalPrice, currency: calc.currency };
			}
			return { amount: converted.convertedAmount, currency: displayCurrency };
		},
		[convertPricesBatch, displayCurrency, getPricingInfo],
	);

	React.useEffect(() => {
		if (isLoadingTldSettings) return;

		let cancelled = false;

		async function load() {
			setLoading(true);
			const next: Record<string, PricedTld> = {};

			const localTlds = SHOWCASE_TLDS.filter((t) => t.variant === "kenyan");
			const globalTlds = SHOWCASE_TLDS.filter((t) => t.variant === "openprovider");
			const kenicDomains = localTlds.map(({ ext }) => `${PRICE_PROBE_NAME}${ext}`);
			const openExtensions = globalTlds.map(({ ext }) => ext.replace(/^\./, ""));

			const [kenicRes, openRes] = await Promise.allSettled([
				kenicMutateRef.current({
					domains: kenicDomains,
					withFee: true,
					currency: "KES",
					periodYears: 1,
				}),
				fetchAvailabilityRef.current({
					name: PRICE_PROBE_NAME,
					extensions: openExtensions,
					with_price: true,
					with_whois: false,
				}),
			]);

			if (cancelled) return;

			if (kenicRes.status === "fulfilled") {
				const normalized =
					(kenicRes.value as { normalized?: Array<{
						domain: string;
						createFee?: { amount: number; currency: string };
						currency?: string;
					}> })?.normalized ?? [];
				for (const item of normalized) {
					const domain = item.domain?.toLowerCase() ?? "";
					const ext = localTlds.find((t) => domain.endsWith(t.ext))?.ext;
					if (!ext || item.createFee?.amount == null) continue;
					const priced = await toDisplay(
						item.createFee.amount,
						item.createFee.currency ?? item.currency ?? "KES",
						domain,
					);
					if (priced) next[ext] = priced;
				}
			}

			if (openRes.status === "fulfilled" && openRes.value?.success) {
				const results = openRes.value.data?.results ?? [];
				for (const r of results) {
					const domain = (r.domain ?? "").toLowerCase();
					const ext = globalTlds.find((t) => domain.endsWith(t.ext))?.ext;
					const raw = r.price?.reseller?.price;
					const currency = r.price?.reseller?.currency ?? "USD";
					if (!ext || raw == null) continue;
					const priced = await toDisplay(raw, currency, domain);
					if (priced) next[ext] = priced;
				}
			}

			if (!cancelled) {
				setPricesByExt(next);
				setLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
		// Intentionally omit kenicMutation / utils — stable enough; re-run when pricing readiness changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isLoadingTldSettings, pricingReady, displayCurrency, toDisplay]);

	const showLoading = loading || isLoadingTldSettings;

	return (
		<div className={cn("w-full mt-4 space-y-2", className)}>
			<p className="text-center text-[11px] text-muted-foreground">
				Popular extensions · live prices include margin · search above for any TLD
			</p>
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
				{SHOWCASE_TLDS.map(({ ext, variant, note }) => (
					<div
						key={ext}
						className="bg-card border border-border rounded-xl p-3.5 flex flex-col items-center justify-center text-center gap-2 min-h-[7.5rem]"
					>
						<TldLogo
							tld={ext}
							variant={variant}
							className="bg-transparent bg-none shadow-none"
						/>
						<div className="flex items-center gap-1.5 flex-wrap justify-center">
							<span className="font-bold text-sm text-foreground">{ext}</span>
							{note ? (
								<span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
									{note}
								</span>
							) : null}
						</div>
						<PriceCell price={pricesByExt[ext]} loading={showLoading} />
					</div>
				))}
			</div>
		</div>
	);
}
