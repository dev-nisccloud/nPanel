import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { CATEGORY_PILLS } from "@/lib/domain-search/tld-sections.ts";
import { getSectionTooltip } from "@/lib/domain-search/domain-section-titles.ts";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { ExactMatchSection } from "./ExactMatchSection.tsx";
import { TopLevelSuggestedCards } from "./TopLevelSuggestedCards.tsx";
import { KenyanTldCards } from "./KenyanTldCards.tsx";
import { DomainSearchSection } from "./DomainSearchSection.tsx";

const DEFAULT_CATEGORY_ID = "popular";

export interface DomainSearchResultsProps {
  searchQuery: string;
  rawSearchQuery: string;
  error: string | null;
  onLoadingChange?: (loading: boolean) => void;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  isDomainBundleInCart: (domainNames: string[]) => boolean;
  onAddDomainBundle: (params: {
    domains: DomainSearchResult[];
    bundlePrice: number;
    bundleCurrency?: string;
    bundleLabel?: string;
  }) => void;
  onRemoveDomainBundle: (domainNames: string[]) => void;
}

export function DomainSearchResults({
  searchQuery,
  rawSearchQuery,
  error,
  onLoadingChange,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
  isDomainBundleInCart,
  onAddDomainBundle,
  onRemoveDomainBundle,
}: DomainSearchResultsProps) {
  const [loadingSources, setLoadingSources] = React.useState<Set<string>>(new Set());
  const onLoadingChangeRef = React.useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  const suggestionsStartedRef = React.useRef(false);
  const prevSearchQueryRef = React.useRef(rawSearchQuery);
  if (prevSearchQueryRef.current !== rawSearchQuery) {
    prevSearchQueryRef.current = rawSearchQuery;
    if (rawSearchQuery.trim().length > 0) suggestionsStartedRef.current = false;
  }

  const reportLoading = React.useCallback((sourceId: string, loading: boolean) => {
    setLoadingSources((prev) => {
      const next = new Set(prev);
      if (loading) {
        next.add(sourceId);
        if (sourceId === "exact" || sourceId === "top-suggested") suggestionsStartedRef.current = true;
      } else {
        next.delete(sourceId);
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    onLoadingChangeRef.current?.(loadingSources.size > 0);
  }, [loadingSources]);

  const suggestionsReady =
    suggestionsStartedRef.current &&
    !loadingSources.has("exact") &&
    !loadingSources.has("top-suggested");

  const [selectedCategoryId, setSelectedCategoryId] = React.useState(DEFAULT_CATEGORY_ID);
  const visitedCategoryIdsRef = React.useRef<Set<string>>(new Set([DEFAULT_CATEGORY_ID]));

  React.useEffect(() => {
    if (!searchQuery.trim()) return;
    visitedCategoryIdsRef.current = new Set([DEFAULT_CATEGORY_ID]);
    setSelectedCategoryId(DEFAULT_CATEGORY_ID);
  }, [searchQuery]);

  React.useEffect(() => {
    const hasDot = rawSearchQuery.trim().includes(".");
    const hasSearchName = searchQuery.trim().length > 0;
    setLoadingSources((prev) => {
      const removeExact = !hasDot && prev.has("exact");
      const removeTopSuggested = !hasSearchName && prev.has("top-suggested");
      if (!removeExact && !removeTopSuggested) return prev;
      const next = new Set(prev);
      if (removeExact) next.delete("exact");
      if (removeTopSuggested) next.delete("top-suggested");
      return next;
    });
  }, [rawSearchQuery, searchQuery]);

  React.useEffect(() => {
    if (!selectedCategoryId) return;
    visitedCategoryIdsRef.current.add(selectedCategoryId);
  }, [selectedCategoryId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {rawSearchQuery.trim().length > 0 && (
        <section className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-4">
            {rawSearchQuery.trim().includes(".") && (
              <ExactMatchSection
                rawSearchQuery={rawSearchQuery.trim()}
                onLoadingChange={(loading) => reportLoading("exact", loading)}
                isDomainInCart={isDomainInCart}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
              />
            )}
            {searchQuery.trim().length > 0 && (
              <TopLevelSuggestedCards
                searchQuery={searchQuery.trim()}
                rawSearchQuery={rawSearchQuery.trim()}
                onLoadingChange={(loading) => reportLoading("top-suggested", loading)}
                isDomainInCart={isDomainInCart}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
                isDomainBundleInCart={isDomainBundleInCart}
                onAddDomainBundle={onAddDomainBundle}
                onRemoveDomainBundle={onRemoveDomainBundle}
              />
            )}
          </div>
        </section>
      )}

      {searchQuery && searchQuery.trim().length > 0 && (
        <section className="mb-8">
          <h3 className="text-base font-semibold tracking-tight text-card-foreground mb-3">
            More options
          </h3>
          <div className="bg-transparent rounded-lg py-3 px-1">
            <TooltipProvider key={searchQuery} delayDuration={200} skipDelayDuration={0}>
              <ScrollArea className="w-full">
                <div className="flex gap-2 flex-nowrap w-max pb-4 pr-2">
                  {CATEGORY_PILLS.map(({ sectionId, label }) => {
                    const isActive = selectedCategoryId === sectionId;
                    const tooltip = getSectionTooltip(sectionId);
                    const pill = (
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(sectionId)}
                        className={`
                          shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer
                          ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-foreground border border-border hover:bg-muted/50"
                          }
                        `}
                      >
                        {label}
                      </button>
                    );
                    return (
                      <React.Fragment key={sectionId}>
                        {tooltip ? (
                          <Tooltip disableHoverableContent>
                            <TooltipTrigger asChild>{pill}</TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={6} className="max-w-xs text-center">
                              {tooltip}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          pill
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </TooltipProvider>
          </div>
          <div className="mt-4">
            {CATEGORY_PILLS.map(({ sectionId }) => {
              const isSelected = selectedCategoryId === sectionId;
              const enableQuery = isSelected || visitedCategoryIdsRef.current.has(sectionId);
              return (
                <div
                  key={sectionId}
                  role="tabpanel"
                  aria-hidden={!isSelected}
                  style={{ display: isSelected ? "block" : "none" }}
                >
                  {sectionId === "kenyan" ? (
                    <KenyanTldCards
                      searchQuery={searchQuery.trim()}
                      suggestionsReady={suggestionsReady}
                      isSelected={isSelected}
                      embeddedInTabs
                      onLoadingChange={(loading) => reportLoading(sectionId, loading)}
                      isDomainInCart={isDomainInCart}
                      onAddToCart={onAddToCart}
                      onRemoveFromCart={onRemoveFromCart}
                    />
                  ) : (
                    <DomainSearchSection
                      sectionId={sectionId}
                      searchQuery={searchQuery.trim()}
                      isSelected={isSelected}
                      enableQuery={enableQuery}
                      onLoadingChange={(loading) => reportLoading(sectionId, loading)}
                      isDomainInCart={isDomainInCart}
                      onAddToCart={onAddToCart}
                      onRemoveFromCart={onRemoveFromCart}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
