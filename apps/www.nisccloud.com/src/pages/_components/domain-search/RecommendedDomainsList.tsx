import * as React from "react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { trpcMutation, trpcQuery } from "@/lib/domain-search/api.ts";
import { getRecommendedBatch } from "@/lib/domain-search/tld-sections.ts";
import {
  isUnavailableKenicTld,
  normalizeToKenicCards,
  parseFullDomain,
} from "@/lib/domain-search/kenic-schema.ts";
import { nameForOpenProvider } from "@/lib/domain-search/search-utils.ts";
import { kenicItemToDomainSearchResult } from "@/lib/domain-search/to-domain-search-result.ts";
import { getCustomerRetailDisplayPrice } from "@/lib/domain-search/customer-display-price.ts";
import { usePricing } from "@/lib/domain-search/pricing-context.tsx";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { DomainResultList, DomainResultRow } from "./DomainResultRow.tsx";

function RowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          {i < count - 1 && <div className="border-b border-border" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function sortByRecommendedOrder(
  results: DomainSearchResult[],
  order: string[],
  exactDomain?: string | null,
): DomainSearchResult[] {
  const rank = new Map(order.map((ext, i) => [ext.toLowerCase(), i]));
  const getExt = (domain: string) => {
    const d = domain.toLowerCase();
    if (d.endsWith(".co.ke")) return "co.ke";
    const parts = d.split(".");
    return parts.length >= 2 ? parts.slice(1).join(".") : d;
  };

  return [...results].sort((a, b) => {
    if (exactDomain) {
      const aExact = a.domain.toLowerCase() === exactDomain;
      const bExact = b.domain.toLowerCase() === exactDomain;
      if (aExact !== bExact) return aExact ? -1 : 1;
    }
    const ai = rank.get(getExt(a.domain)) ?? 999;
    const bi = rank.get(getExt(b.domain)) ?? 999;
    return ai - bi;
  });
}

async function fetchBatchResults(params: {
  name: string;
  kenic: string[];
  open: string[];
  getPricingInfo: ReturnType<typeof usePricing>["getPricingInfo"];
  calculatePricesBatch: ReturnType<typeof usePricing>["calculatePricesBatch"];
}): Promise<DomainSearchResult[]> {
  const { name, kenic, open, getPricingInfo, calculatePricesBatch } = params;
  const out: DomainSearchResult[] = [];

  if (kenic.length > 0) {
    try {
      const kenicDomains = kenic.map((tld) => `${name}.${tld}`);
      const data = await trpcMutation<{
        normalized?: Array<{
          domain: string;
          available: boolean;
          reason?: string;
          currency?: string;
          createFee?: { amount: number; currency: string };
          renewFee?: { amount: number; currency: string };
          transferFee?: { amount: number; currency: string };
        }>;
      }>("kenic.domainCheck.check", {
        domains: kenicDomains,
        withFee: true,
        currency: "KES",
        periodYears: 1,
      });
      const cards = normalizeToKenicCards(name, data?.normalized ?? []);
      for (const item of cards) {
        const createCalc = getPricingInfo(
          item.domain,
          item.createPrice ?? 0,
          item.currency ?? "KES",
        );
        out.push(
          kenicItemToDomainSearchResult(item, {
            createFinal: createCalc.finalPrice,
            createCalc,
          }),
        );
      }
    } catch {
      // ignore kenic batch errors; OP may still succeed
    }
  }

  if (open.length > 0) {
    try {
      const res = await trpcQuery<{
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
        name: nameForOpenProvider(name),
        extensions: open,
        with_price: true,
        with_whois: false,
      });
      if (res?.success && res.data?.results) {
        const raw: DomainSearchResult[] = res.data.results.map((r) => ({
          domain: r.domain ?? "",
          status: r.status ?? "unknown",
          reason: r.reason,
          price: r.price,
        }));
        const priced = await calculatePricesBatch(raw).catch(() => raw);
        out.push(...priced);
      }
    } catch {
      // ignore
    }
  }

  return out;
}

export interface RecommendedDomainsListProps {
  searchQuery: string;
  rawSearchQuery: string;
  /** When true, skip domains already shown as exact-match / top cards */
  excludeDomains?: string[];
  onLoadingChange?: (loading: boolean) => void;
  isDomainInFlow?: (domain: string) => boolean;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  /** Compact cart-style row actions instead of landing cart buttons */
  renderRowActions?: (result: DomainSearchResult) => React.ReactNode;
}

/**
 * Progressive recommended TLD list for landing + cart.
 * Batch 0 loads top picks; "List more" appends the next batch with a bottom-only skeleton.
 */
export function RecommendedDomainsList({
  searchQuery,
  rawSearchQuery,
  excludeDomains = [],
  onLoadingChange,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
  renderRowActions,
}: RecommendedDomainsListProps) {
  const { getPricingInfo, calculatePricesBatch } = usePricing();
  const [results, setResults] = React.useState<DomainSearchResult[]>([]);
  const [batchIndex, setBatchIndex] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [isInitialLoading, setIsInitialLoading] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const name = searchQuery.trim().toLowerCase().replace(/\s+/g, "");
  const exactDomain = React.useMemo(() => {
    const raw = rawSearchQuery.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./i, "");
    if (!raw.includes(".")) return null;
    const parsed = parseFullDomain(raw);
    return parsed ? `${parsed.name}.${parsed.tld}`.toLowerCase() : null;
  }, [rawSearchQuery]);

  const excludeSet = React.useMemo(
    () => new Set(excludeDomains.map((d) => d.toLowerCase())),
    [excludeDomains],
  );

  const onLoadingChangeRef = React.useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  React.useEffect(() => {
    onLoadingChangeRef.current?.(isInitialLoading);
  }, [isInitialLoading]);

  React.useEffect(() => {
    if (!name) {
      setResults([]);
      setBatchIndex(0);
      setHasMore(true);
      setIsError(false);
      return;
    }

    let cancelled = false;
    setIsInitialLoading(true);
    setIsError(false);
    setResults([]);
    setBatchIndex(0);

    const batch = getRecommendedBatch(0);
    const order = [...batch.kenic, ...batch.open];

    fetchBatchResults({
      name,
      kenic: batch.kenic,
      open: batch.open,
      getPricingInfo,
      calculatePricesBatch,
    })
      .then((fetched) => {
        if (cancelled) return;
        const sorted = sortByRecommendedOrder(fetched, order, exactDomain);
        setResults(sorted);
        setHasMore(batch.hasMore);
        setIsInitialLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
          setIsInitialLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, exactDomain]);

  const handleListMore = async () => {
    if (!name || isLoadingMore || !hasMore) return;
    const nextIndex = batchIndex + 1;
    const batch = getRecommendedBatch(nextIndex);
    if (batch.open.length === 0 && batch.kenic.length === 0) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    try {
      const fetched = await fetchBatchResults({
        name,
        kenic: batch.kenic,
        open: batch.open,
        getPricingInfo,
        calculatePricesBatch,
      });
      const order = [...batch.kenic, ...batch.open];
      const sorted = sortByRecommendedOrder(fetched, order, null);
      setResults((prev) => {
        const seen = new Set(prev.map((r) => r.domain.toLowerCase()));
        const appended = sorted.filter((r) => !seen.has(r.domain.toLowerCase()));
        return [...prev, ...appended];
      });
      setBatchIndex(nextIndex);
      setHasMore(batch.hasMore);
    } catch {
      // keep existing results
    } finally {
      setIsLoadingMore(false);
    }
  };

  const visibleResults = React.useMemo(() => {
    return results.filter((r) => {
      const d = r.domain.toLowerCase();
      if (excludeSet.has(d)) return false;
      if (isUnavailableKenicTld(d)) return false;
      // Exact match is shown in ExactMatchSection above — skip duplicate in list
      if (exactDomain && d === exactDomain) return false;
      return true;
    });
  }, [results, excludeSet, exactDomain]);

  if (!name) return null;

  return (
    <section className="mb-6">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold tracking-tight text-card-foreground">
          Popular extensions
        </h3>
        <p className="text-xs text-muted-foreground">
          .co.ke · .ke · .com · .net · more
        </p>
      </div>

      {isInitialLoading && <RowSkeleton count={6} />}

      {isError && !isInitialLoading && (
        <p className="text-sm text-destructive py-2">Could not load popular domains.</p>
      )}

      {!isInitialLoading && !isError && visibleResults.length > 0 && (
        <>
          {renderRowActions ? (
            <div className="space-y-2">
              {visibleResults.map((r) => (
                <div key={r.domain}>{renderRowActions(r)}</div>
              ))}
            </div>
          ) : (
            <DomainResultList>
              {visibleResults.map((result, index) => {
                const { displayPrice, displayCurrency } = getCustomerRetailDisplayPrice(result);
                return (
                  <DomainResultRow
                    key={`${result.domain}-${index}`}
                    domain={result.domain}
                    isAvailable={result.status === "free"}
                    displayPrice={displayPrice}
                    displayCurrency={displayCurrency}
                    reason={result.reason}
                    displayResult={result}
                    isDomainInCart={isDomainInCart}
                    onAddToCart={onAddToCart}
                    onRemoveFromCart={onRemoveFromCart}
                  />
                );
              })}
            </DomainResultList>
          )}
        </>
      )}

      {!isInitialLoading && !isError && visibleResults.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No popular results yet.</p>
      )}

      {/* Bottom-only loader for newly appended rows */}
      {isLoadingMore && (
        <div className="mt-2 border-t border-border pt-1">
          <RowSkeleton count={3} />
        </div>
      )}

      {hasMore && !isInitialLoading && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={isLoadingMore}
            onClick={() => void handleListMore()}
          >
            {isLoadingMore ? "Loading…" : "List more"}
          </Button>
        </div>
      )}
    </section>
  );
}
