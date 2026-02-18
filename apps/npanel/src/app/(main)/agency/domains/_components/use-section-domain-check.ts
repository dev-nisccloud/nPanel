"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { getTldExtensionsByCategory } from "@nPanel/utils";
import { categoryNameToSectionId } from "./domain-section-titles";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import type { DomainPricingHook } from "@/hooks/use-domain-search";

const CATEGORIES = getTldExtensionsByCategory();

function getExtensionsForSection(sectionId: string): string[] {
	const category = CATEGORIES.find(
		(c) => categoryNameToSectionId(c.name) === sectionId
	);
	if (!category) return [];
	return category.extensions.map((ext) => (ext.startsWith(".") ? ext.slice(1) : ext));
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
			name: searchQuery,
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

	React.useEffect(() => {
		if (!query.data?.success || !query.data.data?.results) {
			setProcessedResults([]);
			return;
		}
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
			.then((processed) => setProcessedResults(processed))
			.catch(() => setProcessedResults(rawResults))
			.finally(() => setIsProcessing(false));
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
