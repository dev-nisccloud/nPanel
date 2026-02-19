"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { getTldExtensionsByCategory } from "@nPanel/utils";
import { categoryNameToSectionId } from "./domain-section-titles";
import { isKenicTld } from "./kenic-card-schema";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import type { DomainPricingHook } from "@/hooks/use-domain-search";

const CATEGORIES = getTldExtensionsByCategory();

/** Section extensions for OpenProvider only – Kenyan TLDs are excluded (handled by KENIC). */
function getExtensionsForSection(sectionId: string): string[] {
	// Popular tab: explicit curated list and order
	if (sectionId === "popular") {
		return [
			"com",
			"app",
			"ai",
			"net",
			"org",
			"io",
			"online",
			"shop",
			"store",
			"space",
			"site",
			"studio",
			"live",
			"cloud",
			"me",
			"agency",
			"capital",
		];
	}

	if (sectionId === "all") {
		const seen = new Set<string>();
		for (const category of CATEGORIES) {
			for (const ext of category.extensions) {
				const e = ext.startsWith(".") ? ext.slice(1) : ext;
				if (!isKenicTld(e)) seen.add(e);
			}
		}
		return Array.from(seen);
	}
	const category = CATEGORIES.find(
		(c) => categoryNameToSectionId(c.name) === sectionId
	);
	if (!category) return [];
	return category.extensions
		.map((ext) => (ext.startsWith(".") ? ext.slice(1) : ext))
		.filter((ext) => !isKenicTld(ext));
}

/** OpenProvider rejects names with dots (error 303). Use only the last label, e.g. "me.fineyakwoyo" → "fineyakwoyo". */
export function nameForOpenProvider(name: string): string {
	const t = name.trim();
	if (!t) return t;
	const parts = t.split(".");
	return parts[parts.length - 1] ?? t;
}

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

export function useSectionDomainCheck(
	searchQuery: string,
	sectionId: string,
	inView: boolean,
	pricingHook: DomainPricingHook
) {
	const extensions = React.useMemo(
		() => getExtensionsForSection(sectionId),
		[sectionId]
	);
	const hasExtensions = extensions.length > 0;

	const query = trpc.openProvider.domains.checkAvailability.useQuery(
		{
			name: nameForOpenProvider(searchQuery),
			extensions,
			with_price: true,
			with_whois: false,
		},
		{
			enabled: !!searchQuery.trim() && inView && hasExtensions,
			staleTime: STALE_TIME,
			gcTime: GC_TIME,
			refetchOnWindowFocus: false,
			refetchOnReconnect: true,
			refetchOnMount: false,
		}
	);

	const [processedResults, setProcessedResults] = React.useState<
		DomainSearchResult[]
	>([]);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const lastProcessedRef = React.useRef<string>("");
	const calculatePricesBatchRef = React.useRef(pricingHook?.calculatePricesBatch);
	calculatePricesBatchRef.current = pricingHook?.calculatePricesBatch;

	// Start pricing batch as soon as query data arrives (before paint)
	React.useLayoutEffect(() => {
		if (!query.data?.success || !query.data.data?.results) {
			setProcessedResults([]);
			return;
		}
		let cancelled = false;
		const raw = query.data.data.results as Array<{
			domain: string;
			status: string;
			reason?: string;
			price?: DomainSearchResult["price"];
		}>;
		const rawResults: DomainSearchResult[] = raw.map((r) => ({
			domain: r.domain ?? "",
			status: r.status ?? "unknown",
			reason: r.reason,
			price: r.price,
		}));
		const dataKey = rawResults
			.map((r) => `${r.domain}:${r.status}:${r.price?.reseller?.price ?? 0}`)
			.join("|");
		if (lastProcessedRef.current === dataKey) return;
		lastProcessedRef.current = dataKey;
		setIsProcessing(true);
		const batch = calculatePricesBatchRef.current;
		if (!batch) {
			setProcessedResults(rawResults);
			setIsProcessing(false);
			return;
		}
		batch(rawResults)
			.then((processed) => {
				if (!cancelled) setProcessedResults(processed);
			})
			.catch(() => {
				if (!cancelled) setProcessedResults(rawResults);
			})
			.finally(() => {
				if (!cancelled) setIsProcessing(false);
			});
		return () => {
			cancelled = true;
		};
	}, [query.data]);

	// Show cards only when margin and conversion are done (no raw-then-priced glitch)
	return {
		results: processedResults,
		isLoading: query.isLoading || isProcessing,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}

export { getExtensionsForSection };
