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
import { Search, Grid3X3, List } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router";
import { useLocation } from "react-router";
// import { useDataTableInstance } from "@/hooks/use-data-table-instance";

// Table imports (commented out for performance)
// import { DataTable as DataTableNew } from "../../../components/data-table/data-table";
// import { DataTablePagination } from "../../../components/data-table/data-table-pagination";
// import { DataTableViewOptions } from "../../../components/data-table/data-table-view-options";
// import { hostingColumns } from "./columns";
import { getStatusDisplayText, getStatusBadgeVariant } from "./hosting-utils";

import { HostingCardsList } from "./hosting-cards";
import { HostingPricing } from "./hosting-pricing";
import type { CustomerHostingListItem } from "./schema";
import { useTeamEmailSubscriptions } from "./use-team-email-subscriptions";

/** Canonical segment for `/emails/:id` — matches API resolution (Plesk id when known). */
function emailHostingDetailId(sub: Pick<CustomerHostingListItem, "id" | "pleskSubscriptionId">) {
  return sub.pleskSubscriptionId ?? sub.id;
}

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
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1];
  const { data, isLoading, isError, error, refetch } = useTeamEmailSubscriptions(teamSlug);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"card" | "table">("table");

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }
    const q = searchQuery.toLowerCase();
    return data.filter((subscription) =>
      (subscription.subscriptionName ?? "").toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  // Table implementation (commented out for performance)
  // const columns = hostingColumns;
  // const table = useDataTableInstance({ 
  //   data, 
  //   columns, 
  //   getRowId: (row) => row.id.toString() 
  // });

  const handleViewDetails = (subscription: Pick<CustomerHostingListItem, "id" | "pleskSubscriptionId">) => {
    window.location.href = `/${teamSlug}/emails/${emailHostingDetailId(subscription)}`;
  };

  // Show loading state
  if (isLoading) {
    return <HostingTableSkeleton />;
  }

  // Show error state
  if (isError) {
    return <HostingTableError error={error as unknown as Error} onRetry={() => refetch()} />;
  }

  // No subscriptions: show pricing (products-based) so the customer can choose a plan
  if (data.length === 0) {
    return <HostingPricing />;
  }

  const TableView = () => (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Subscription / Domain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Subscription date</TableHead>
            <TableHead>Expiry date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No subscriptions found
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell className="pl-6">
                  <Link
                    to={`/${teamSlug}/emails/${emailHostingDetailId(subscription)}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {subscription.primaryDomain ?? subscription.subscriptionName ?? subscription.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(subscription.status)}
                    className={String(subscription.status).toUpperCase() === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800" : ""}
                  >
                    {getStatusDisplayText(subscription.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {subscription.subscriptionDate
                    ? new Date(subscription.subscriptionDate).toLocaleDateString()
                    : "- "}
                </TableCell>
                <TableCell>
                  {subscription.expiryDate
                    ? new Date(subscription.expiryDate).toLocaleDateString()
                    : "- "}
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
        onViewDetails={(sub) => {
          const payload =
            typeof sub === "string"
              ? { id: sub, pleskSubscriptionId: null }
              : typeof sub === "number"
                ? { id: String(sub), pleskSubscriptionId: null }
                : {
                    id: String((sub as CustomerHostingListItem).id),
                    pleskSubscriptionId: (sub as CustomerHostingListItem).pleskSubscriptionId ?? null,
                  };
          handleViewDetails(payload);
        }}
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

      {viewMode === "card" ? <CardView /> : <TableView />}
    </div>
  );
}
