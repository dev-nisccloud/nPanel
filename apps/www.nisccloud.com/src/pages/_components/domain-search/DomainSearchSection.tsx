import * as React from "react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { getSectionTitle } from "@/lib/domain-search/domain-section-titles.ts";
import { getCustomerRetailDisplayPrice } from "@/lib/domain-search/customer-display-price.ts";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { DomainResultList, DomainResultRow } from "./DomainResultRow.tsx";
import { useSectionDomainCheck } from "./use-section-check.ts";

function SectionSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          {i < 5 && <div className="border-b border-border" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export interface DomainSearchSectionProps {
  sectionId: string;
  searchQuery: string;
  isSelected?: boolean;
  enableQuery?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
}

export function DomainSearchSection({
  sectionId,
  searchQuery,
  isSelected,
  enableQuery,
  onLoadingChange,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
}: DomainSearchSectionProps) {
  const inView = enableQuery ?? isSelected ?? false;
  const { results, isLoading, isError, refetch } = useSectionDomainCheck(
    searchQuery,
    sectionId,
    inView,
  );

  const onLoadingChangeRef = React.useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  React.useLayoutEffect(() => {
    onLoadingChangeRef.current?.(isSelected ? isLoading : false);
  }, [isSelected, isLoading]);

  const title = sectionId === "all" ? "All TLDs" : getSectionTitle(sectionId);

  if (!searchQuery.trim()) return null;
  if (isSelected === false) return <div className="min-h-[200px]" aria-hidden />;

  return (
    <section className="mb-8">
      {!isSelected && (
        <h3 className="text-base font-semibold tracking-tight text-card-foreground mb-4">
          {title}
        </h3>
      )}
      {isLoading && <SectionSkeleton />}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          <p>Could not load this section.</p>
          <Button variant="outline" size="sm" className="mt-2 cursor-pointer" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}
      {!isLoading && !isError && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No domains in this category.</p>
      )}
      {!isLoading && !isError && results.length > 0 && (
        <DomainResultList>
          {results.map((result, index) => {
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
    </section>
  );
}
