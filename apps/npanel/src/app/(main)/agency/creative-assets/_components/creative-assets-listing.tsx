"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { creativeAssetSchema } from "./schema";
import { CreativeAssetsCardsList } from "./creative-assets-cards";

// Skeleton component for loading state
function CreativeAssetsListingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      
      {/* Cards skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            {/* Card header skeleton */}
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-5 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            
            {/* Card content skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error component
function CreativeAssetsListingError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold">Failed to load creative assets</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || "An error occurred while fetching creative assets."}
      </p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

interface CreativeAssetsListingProps {
  data: z.infer<typeof creativeAssetSchema>[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  archivingAssetId?: string | null;
  unarchivingAssetId?: string | null;
  onAddAsset?: () => void;
}

export function CreativeAssetsListing({
  data,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  onEdit,
  onArchive,
  onUnarchive,
  archivingAssetId = null,
  unarchivingAssetId = null,
  onAddAsset,
}: CreativeAssetsListingProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [publicFilter, setPublicFilter] = React.useState<string>("all");

  // Filter data based on search query and filters
  const filteredData = React.useMemo(() => {
    let filtered = data;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((asset) =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((asset) => asset.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((asset) => asset.category === categoryFilter);
    }

    // Public filter
    if (publicFilter !== "all") {
      const isPublic = publicFilter === "public";
      filtered = filtered.filter((asset) => asset.isPublic === isPublic);
    }

    return filtered;
  }, [data, searchQuery, statusFilter, categoryFilter, publicFilter]);

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = data.map((asset) => asset.category).filter(Boolean) as string[];
    return Array.from(new Set(cats));
  }, [data]);

  const handleEdit = (id: string) => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleArchive = (id: string) => {
    if (onArchive) {
      onArchive(id);
    }
  };

  // const handleUploadVersion = (id: string) => {
  //   if (onUploadVersion) {
  //     onUploadVersion(id);
  //   }
  // };

  // Show loading state
  if (isLoading) {
    return <CreativeAssetsListingSkeleton />;
  }

  // Show error state
  if (isError && error) {
    return <CreativeAssetsListingError error={error} onRetry={onRetry || (() => {})} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <Badge variant="outline" className="text-muted-foreground">
              {filteredData.length} of {data.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="text-xs text-muted-foreground">
              Status:
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="category-filter" className="text-xs text-muted-foreground">
                Category:
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label htmlFor="public-filter" className="text-xs text-muted-foreground">
              Visibility:
            </Label>
            <Select value={publicFilter} onValueChange={setPublicFilter}>
              <SelectTrigger id="public-filter" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {onAddAsset && (
            <Button size="sm" onClick={onAddAsset}>
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Button>
          )}
        </div>
      </div>
      
      {/* Cards implementation */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            {filteredData.length > 0 ? (
              <CreativeAssetsCardsList
                data={filteredData}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onUnarchive={onUnarchive}
                archivingAssetId={archivingAssetId}
                unarchivingAssetId={unarchivingAssetId}
                cols={3}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No creative assets found</p>
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all" || publicFilter !== "all" ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

