"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTldExtensionsByCategory } from "@nPanel/utils";
import { categoryNameToSectionId } from "./domain-section-titles";
import { KenyanTldCards } from "./kenyan-tld-cards";
import { DomainSearchSection } from "./domain-search-section";
import { useCurrency } from "./currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import type { DomainSearchResult } from "./domain-search";

interface DomainSearchResultsProps {
  searchQuery: string;
  error: string | null;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
  /** Called when any part (Kenyan or sections) starts/stops loading; use for search button spinner. */
  onLoadingChange?: (loading: boolean) => void;
}

const CATEGORIES = getTldExtensionsByCategory();
const SECTION_IDS = CATEGORIES.map((c) => categoryNameToSectionId(c.name));

export function DomainSearchResults({
  searchQuery,
  error,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
  onLoadingChange,
}: DomainSearchResultsProps) {
  const currencyContext = useCurrency();
  const pricingHook = useDomainPricing(currencyContext);

  // Global loading: aggregate Kenyan + all sections so the search button can show spinner when any are loading
  const [loadingSources, setLoadingSources] = React.useState<Set<string>>(new Set());
  const reportLoading = React.useCallback((sourceId: string, loading: boolean) => {
    setLoadingSources((prev) => {
      const next = new Set(prev);
      if (loading) next.add(sourceId);
      else next.delete(sourceId);
      return next;
    });
  }, []);

  React.useEffect(() => {
    onLoadingChange?.(loadingSources.size > 0);
  }, [loadingSources, onLoadingChange]);

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
      {/* Kenyan TLD cards first */}
      {searchQuery && searchQuery.trim().length > 0 && (
        <KenyanTldCards
          searchQuery={searchQuery.trim()}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
          isDomainInCart={isDomainInCart}
          onLoadingChange={(loading) => reportLoading("kenyan", loading)}
        />
      )}

      {/* Category sections - fetch when scrolled into view, cached per section */}
      {searchQuery &&
        searchQuery.trim().length > 0 &&
        SECTION_IDS.map((sectionId) => (
          <DomainSearchSection
            key={sectionId}
            sectionId={sectionId}
            searchQuery={searchQuery.trim()}
            pricingHook={pricingHook}
            isDomainInCart={isDomainInCart}
            onAddToCart={onAddToCart}
            onRemoveFromCart={onRemoveFromCart}
            onLoadingChange={(loading) => reportLoading(sectionId, loading)}
          />
        ))}
    </div>
  );
}
