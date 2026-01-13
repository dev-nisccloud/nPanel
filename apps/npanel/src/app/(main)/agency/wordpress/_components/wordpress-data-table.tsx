"use client";

import * as React from "react";
import { Search, RefreshCw } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { WordPressCardsList } from "./wordpress-cards";
import { wordpressInstallationSchema } from "./schema";
import { useWordPressInstances } from "./use-wordpress-instances";

// Loading skeleton component
function WordPressTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2 @sm/main:flex-nowrap">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4">
                  {/* Card header skeleton */}
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="h-5 w-32 flex-1" />
                    <Skeleton className="h-6 w-16 ml-2" />
                  </div>
                  {/* Card content skeleton */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
    </div>
  );
}

// Error component
function WordPressTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <h3 className="text-lg font-semibold text-destructive">Error Loading WordPress Instances</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {error.message || "An unexpected error occurred while fetching WordPress instances."}
      </p>
      <Button onClick={onRetry} className="mt-4">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

export function WordPressDataTable() {
  const { data: wordpressData, isLoading, isError, error, refetch } = useWordPressInstances();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!wordpressData) return [];

    if (searchTerm.trim()) {
      return wordpressData.filter((item) =>
        (item.displayTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.domain?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.url || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return wordpressData;
  }, [wordpressData, searchTerm]);

  const handleEdit = (id: number | undefined) => {
    console.log("Edit WordPress installation:", id);
    // TODO: Implement edit functionality
  };

  const handleDelete = (id: number | undefined) => {
    console.log("Delete WordPress installation:", id);
    // TODO: Implement delete functionality
  };

  const handleCopy = (data: z.infer<typeof wordpressInstallationSchema>) => {
    console.log("Copy WordPress installation settings:", data);
    // TODO: Implement copy functionality
  };

  const handleSettings = (id: number | undefined) => {
    console.log("Open WordPress installation settings:", id);
    // TODO: Implement settings functionality
  };

  if (isLoading) {
    return <WordPressTableSkeleton />;
  }

  if (isError) {
    return <WordPressTableError error={error as Error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search WordPress installations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 @sm/main:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex-shrink-0 min-w-0"
          >
            <RefreshCw className="h-4 w-4 @sm/main:mr-2" />
            <span className="hidden @sm/main:inline">Refresh</span>
          </Button>
        </div>
      </div>
      
      {/* Results count */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          WordPress Installations
        </span>
        <span className="text-sm font-medium">
          {filteredData.length} total
        </span>
        {searchTerm && (
          <>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {filteredData.length} filtered
            </span>
          </>
        )}
        </div>

      {/* Cards implementation */}
      <WordPressCardsList
        data={filteredData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onSettings={handleSettings}
        cols={3}
      />
        </div>
  );
}
