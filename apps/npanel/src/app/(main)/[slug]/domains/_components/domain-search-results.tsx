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
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-24" />
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
      <div className="space-y-4">
        {isLoading ? (
          <SearchResultsSkeleton />
        ) : results.length > 0 ? (
          results.map((result, index) => (
            <DomainResultCard
              key={`${result.domain}-${index}`}
              result={result}
              isDomainInCart={isDomainInCart}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No domains found</div>
            <div className="text-gray-400 text-sm">
              Try searching with a different domain name or check another category.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
