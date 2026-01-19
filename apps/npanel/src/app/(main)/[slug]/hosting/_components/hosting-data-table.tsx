"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Grid3X3, List, EllipsisVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
// import { useDataTableInstance } from "@/hooks/use-data-table-instance";

// Table imports (commented out for performance)
// import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
// import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
// import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
// import { hostingColumns } from "./columns";
import { getStatusDisplayText, getStatusBadgeVariant } from "./hosting-utils";

import { HostingCardsList } from "./hosting-cards";
import { useHostingSubscriptions } from "./use-hosting-subscriptions";
import { HostingPricing } from "./hosting-pricing";

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
      
      {/* Cards grid skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            {/* Card header skeleton */}
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
            
            {/* Card content skeleton */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-18" />
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
  const pathname = usePathname();
  const teamSlug = pathname.split("/")[1];
  
  const { data, isLoading, isError, error, refetch, hasServiceSubscriptions, rawData } = useHostingSubscriptions();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"card" | "table">("table");

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
    // Navigate to details page using team slug
    window.location.href = `/${teamSlug}/hosting/${id}`;
  };

  const handleEdit = (id: number) => {
    // Open edit modal or navigate to edit page
    // TODO: Implement edit functionality
  };

  const handleSuspend = (id: number) => {
    // Handle suspension
    // TODO: Implement suspend functionality
  };

  const handleCancel = (id: number) => {
    // Handle cancellation
    // TODO: Implement cancel functionality
  };

  // Show loading state
  if (isLoading) {
    return <HostingTableSkeleton />;
  }

  // Show error state
  if (isError) {
    return <HostingTableError error={error as Error} onRetry={() => refetch()} />;
  }

  // Show pricing cards only if team has NO service subscriptions
  // If team has service subscriptions but no Plesk data, still show empty state (not pricing)
  if (!isLoading) {
    // If we have a definitive answer that there are no service subscriptions, show pricing
    if (hasServiceSubscriptions === false) {
      return <HostingPricing />;
    }

    // If has service subscriptions but no data, show empty state with message
    if (hasServiceSubscriptions === true && (!data || data.length === 0)) {
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold">No hosting subscriptions found</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Your team has hosting subscriptions, but no matching Plesk subscriptions were found.
            <br />
            <span className="text-xs">This may happen if the subscription hasn't been provisioned yet or the Plesk filter ID doesn't match.</span>
          </p>
        </div>
      );
    }

    // Fallback: if hasServiceSubscriptions is undefined but we're not loading, show pricing
    // This shouldn't normally happen, but handle it gracefully
    if (hasServiceSubscriptions === undefined) {
      return <HostingPricing />;
    }
  }

  const TableView = () => (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subscription Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                No subscriptions found
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <Link 
                    href={`/${teamSlug}/hosting/${subscription.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {subscription.subscriptionName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(subscription.status)}>
                    {getStatusDisplayText(subscription.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                              <Link href={`/${teamSlug}/hosting/${subscription.id}`}>View details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(subscription.id)}>
                              Edit subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem>Renew</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSuspend(subscription.id)}>
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              variant="destructive"
                              onClick={() => handleCancel(subscription.id)}
                            >
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Actions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const CardView = () => (
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
  );

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
        
        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      {viewMode === "card" ? <CardView /> : <TableView />}
    </div>
  );
}
