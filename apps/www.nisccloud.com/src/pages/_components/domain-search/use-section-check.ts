import * as React from "react";
import { trpcQuery } from "@/lib/domain-search/api.ts";
import { getExtensionsForSection } from "@/lib/domain-search/tld-sections.ts";
import { nameForOpenProvider } from "@/lib/domain-search/search-utils.ts";
import { usePricing } from "@/lib/domain-search/pricing-context.tsx";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";

export function useSectionDomainCheck(
  searchQuery: string,
  sectionId: string,
  enabled: boolean,
) {
  const { calculatePricesBatch } = usePricing();
  const extensions = React.useMemo(() => getExtensionsForSection(sectionId), [sectionId]);
  const hasExtensions = extensions.length > 0;

  const [rawData, setRawData] = React.useState<DomainSearchResult[] | null>(null);
  const [processedResults, setProcessedResults] = React.useState<DomainSearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const lastFetchKey = React.useRef("");
  const [refreshKey, setRefreshKey] = React.useState(0);

  const calculateRef = React.useRef(calculatePricesBatch);
  calculateRef.current = calculatePricesBatch;

  React.useEffect(() => {
    if (!enabled || !searchQuery.trim() || !hasExtensions) {
      setRawData(null);
      setProcessedResults([]);
      return;
    }

    const fetchKey = `${searchQuery}:${sectionId}:${extensions.join(",")}`;
    if (lastFetchKey.current === fetchKey) return;

    let cancelled = false;
    lastFetchKey.current = fetchKey;
    setIsLoading(true);
    setIsError(false);
    setRawData(null);
    setProcessedResults([]);

    trpcQuery<{
      success: boolean;
      data?: {
        results: Array<{
          domain: string;
          status: string;
          reason?: string;
          price?: DomainSearchResult["price"];
        }>;
      };
    }>("openProvider.domains.checkAvailability", {
      name: nameForOpenProvider(searchQuery),
      extensions,
      with_price: true,
      with_whois: false,
    })
      .then((response) => {
        if (cancelled) return;
        if (!response?.success || !response.data?.results) {
          setIsError(true);
          setIsLoading(false);
          return;
        }
        // Restore curated extension order (API cache key must not reorder request).
        const order = new Map(extensions.map((ext, i) => [ext.toLowerCase(), i]));
        const getExt = (domain: string) => {
          const parts = domain.toLowerCase().split(".");
          return parts.length >= 2 ? parts.slice(1).join(".") : domain;
        };
        const rawResults: DomainSearchResult[] = [...response.data.results]
          .map((r) => ({
            domain: r.domain ?? "",
            status: r.status ?? "unknown",
            reason: r.reason,
            price: r.price,
          }))
          .sort((a, b) => (order.get(getExt(a.domain)) ?? 999) - (order.get(getExt(b.domain)) ?? 999));
        setRawData(rawResults);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, searchQuery, sectionId, extensions, hasExtensions, refreshKey]);

  React.useLayoutEffect(() => {
    if (!rawData) {
      setProcessedResults([]);
      return;
    }
    let cancelled = false;
    setIsProcessing(true);
    const batch = calculateRef.current;
    batch(rawData)
      .then((processed) => {
        if (!cancelled) setProcessedResults(processed);
      })
      .catch(() => {
        if (!cancelled) setProcessedResults(rawData);
      })
      .finally(() => {
        if (!cancelled) setIsProcessing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rawData]);

  const refetch = React.useCallback(() => {
    lastFetchKey.current = "";
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    results: processedResults,
    isLoading: isLoading || isProcessing,
    isError,
    refetch,
  };
}
