"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryTabs } from "./category-tabs";
import { DomainResultCard } from "./domain-result-card";
import type { DomainSearchResult } from "./domain-search";

interface DomainSearchResultsProps {
  results: DomainSearchResult[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoading: boolean;
  error: string | null;
  isDomainInCart: (domain: string) => boolean;
  onAddToCart: (result: DomainSearchResult) => void;
  onRemoveFromCart: (domain: string) => void;
}

function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col p-3 bg-card border border-border rounded-lg">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-7 w-full mt-auto" />
        </div>
      ))}
    </div>
  );
}

export function DomainSearchResults({
  results,
  activeTab,
  onTabChange,
  isLoading,
  error,
  isDomainInCart,
  onAddToCart,
  onRemoveFromCart,
}: DomainSearchResultsProps) {
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
      {/* Category Tabs */}
      <CategoryTabs value={activeTab} onValueChange={onTabChange} />

      {/* Search Results */}
      <div>
        {isLoading ? (
          <SearchResultsSkeleton />
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {results.map((result, index) => (
              <DomainResultCard
                key={`${result.domain}-${index}`}
                result={result}
                isDomainInCart={isDomainInCart}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-2">No domains found</div>
            <div className="text-muted-foreground/70 text-sm">
              Try searching with a different domain name or check another category.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
