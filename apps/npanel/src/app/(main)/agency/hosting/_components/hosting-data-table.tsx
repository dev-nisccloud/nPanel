"use client";

import * as React from "react";

import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
// import { useDataTableInstance } from "@/hooks/use-data-table-instance";

// Table imports (commented out for performance)
// import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
// import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
// import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
// import { hostingColumns } from "./columns";
// import { getStatusDisplayText, getStatusBadgeVariant } from "./hosting-utils";

import { HostingCardsList } from "./hosting-cards";
import { useHostingSubscriptions } from "./use-hosting-subscriptions";

// Skeleton component for loading state
function HostingTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      
      {/* Cards skeleton */}
      <div className="grid gap-4 grid-cols-1">
        {Array.from({ length: 5 }).map((_, i) => (
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
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-18" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            
            {/* Description skeleton */}
            <div className="mt-4 pt-4 border-t">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error component
function HostingTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
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
      <h3 className="mb-2 text-lg font-semibold">Failed to load subscriptions</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || "An error occurred while fetching hosting subscriptions."}
      </p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

export function HostingDataTable() {
  const { data, isLoading, isError, error, refetch } = useHostingSubscriptions();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }
    
    return data.filter((subscription) =>
      subscription.subscriptionName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  // Table implementation (commented out for performance)
  // const columns = hostingColumns;
  // const table = useDataTableInstance({ 
  //   data, 
  //   columns, 
  //   getRowId: (row) => row.id.toString() 
  // });

  const handleViewDetails = (id: number) => {
    // Navigate to details page
    window.location.href = `/agency/hosting/${id}`;
  };

  const handleEdit = (id: number) => {
    // Open edit modal or navigate to edit page
    console.log("Edit subscription:", id);
  };

  const handleSuspend = (id: number) => {
    // Handle suspension
    console.log("Suspend subscription:", id);
  };

  const handleCancel = (id: number) => {
    // Handle cancellation
    console.log("Cancel subscription:", id);
  };

  // Show loading state
  if (isLoading) {
    return <HostingTableSkeleton />;
  }

  // Show error state
  if (isError) {
    return <HostingTableError error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
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
      </div>
      
      {/* Cards grid implementation */}
      <div className="p-4">
        <HostingCardsList
          data={filteredData}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onSuspend={handleSuspend}
          onCancel={handleCancel}
          cols={3}
        />
      </div>

      {/* Table implementation (commented out for performance) */}
      {/* <div className="overflow-hidden rounded-lg border">
        <DataTableNew table={table} columns={columns} />
      </div>
      <DataTablePagination table={table} /> */}
    </div>
  );
}
