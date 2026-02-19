"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getTldExtensionsByCategory } from "@nPanel/utils";
import { categoryNameToSectionId, getSectionTooltip } from "./domain-section-titles";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExactMatchSection } from "./exact-match-section";
import { TopLevelSuggestedCards } from "./top-level-suggested-cards";
import { KenyanTldCards } from "./kenyan-tld-cards";
import { DomainSearchSection } from "./domain-search-section";
import { useCurrency } from "./currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import type { DomainSearchResult } from "./domain-search";

interface DomainSearchResultsProps {
  /** Sanitized name (no TLD) for Kenyan + category sections. */
  searchQuery: string;
  /** Raw input as entered (e.g. "example.com") for exact-match card. */
  rawSearchQuery: string;
  error: string | null;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  /** Called when any part (Kenyan or sections) starts/stops loading; use for search button spinner. */
  onLoadingChange?: (loading: boolean) => void;
}

const CATEGORIES = getTldExtensionsByCategory();
/** Order: Popular first, Kenyan second, then rest of categories. No "All" tab. */
const CATEGORY_PILLS: { sectionId: string; label: string }[] = [
  { sectionId: "popular", label: "Popular" },
  { sectionId: "kenyan", label: "Kenyan" },
  ...CATEGORIES.slice(1).map((c) => ({ sectionId: categoryNameToSectionId(c.name), label: c.name })),
];
const DEFAULT_CATEGORY_ID = "popular";

export function DomainSearchResults({
  searchQuery,
  rawSearchQuery,
  error,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
  onLoadingChange,
}: DomainSearchResultsProps) {
  const currencyContext = useCurrency();
  const pricingHook = useDomainPricing(currencyContext);

  // Global loading: aggregate exact match + Kenyan + all sections so the search button can show spinner when any are loading
  const [loadingSources, setLoadingSources] = React.useState<Set<string>>(new Set());
  const onLoadingChangeRef = React.useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Suggestions (exact + top-suggested) must load first; Kenyan TLDs wait until suggestions have settled
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
      } else next.delete(sourceId);
      return next;
    });
  }, []);

  // Notify parent of loading before paint so spinner updates immediately; no-op if unmounted
  React.useLayoutEffect(() => {
    if (isMountedRef.current) onLoadingChangeRef.current?.(loadingSources.size > 0);
  }, [loadingSources]);

  const suggestionsReady =
    suggestionsStartedRef.current &&
    !loadingSources.has("exact") &&
    !loadingSources.has("top-suggested");

  const [selectedCategoryId, setSelectedCategoryId] = React.useState(DEFAULT_CATEGORY_ID);
  const visitedCategoryIdsRef = React.useRef<Set<string>>(new Set([DEFAULT_CATEGORY_ID]));
  const prevSearchQueryRefForTabs = React.useRef(searchQuery);

  // Reset tab when search query changes – run before paint so correct tab shows immediately
  if (prevSearchQueryRefForTabs.current !== searchQuery && searchQuery.trim().length > 0) {
    prevSearchQueryRefForTabs.current = searchQuery;
    visitedCategoryIdsRef.current = new Set([DEFAULT_CATEGORY_ID]);
  }
  React.useLayoutEffect(() => {
    if (searchQuery.trim().length > 0) {
      setSelectedCategoryId(DEFAULT_CATEGORY_ID);
    }
  }, [searchQuery]);

  // Update visited set synchronously during render (ref mutation is allowed)
  if (selectedCategoryId) visitedCategoryIdsRef.current.add(selectedCategoryId);

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
      {/* Top-level: exact match (no title) + suggested cards (.co.ke, .ke, bundle, .com, .org, .net, .io) – load first */}
      {rawSearchQuery.trim().length > 0 && (
        <section className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <ExactMatchSection
              rawSearchQuery={rawSearchQuery.trim()}
              isDomainInCart={isDomainInCart}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
              onLoadingChange={(loading) => reportLoading("exact", loading)}
            />
            {searchQuery.trim().length > 0 && (
              <TopLevelSuggestedCards
                searchQuery={searchQuery.trim()}
                rawSearchQuery={rawSearchQuery.trim()}
                isDomainInCart={isDomainInCart}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
                onLoadingChange={(loading) => reportLoading("top-suggested", loading)}
              />
            )}
          </div>
        </section>
      )}

      {/* More options: pill tabs (Popular, Kenyan, then categories). Each tab has its own loader; revisiting a tab shows cached data. */}
      {searchQuery && searchQuery.trim().length > 0 && (
        <section className="mb-8">
          <h3 className="text-base font-semibold tracking-tight text-card-foreground mb-3">
            More options
          </h3>
          <div className="bg-card rounded-lg border border-border p-2.5">
            <ScrollArea className="w-full -mx-1 px-1">
              <div className="flex gap-2 flex-nowrap w-max pb-1">
                {CATEGORY_PILLS.map(({ sectionId, label }) => {
                  const isActive = selectedCategoryId === sectionId;
                  const tooltip = getSectionTooltip(sectionId);
                  const pill = (
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(sectionId)}
                      className={`
                        shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${isActive
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
                        <Tooltip>
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
                      onAddToCart={onAddToCart}
                      onRemoveFromCart={onRemoveFromCart}
                      isDomainInCart={isDomainInCart}
                      onLoadingChange={(loading) => reportLoading(sectionId, loading)}
                    />
                  ) : (
                    <DomainSearchSection
                      sectionId={sectionId}
                      searchQuery={searchQuery.trim()}
                      pricingHook={pricingHook}
                      isDomainInCart={isDomainInCart}
                      onAddToCart={onAddToCart}
                      onRemoveFromCart={onRemoveFromCart}
                      isSelected={isSelected}
                      enableQuery={enableQuery}
                      onLoadingChange={(loading) => reportLoading(sectionId, loading)}
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
