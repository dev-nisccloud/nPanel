"use client";

import * as React from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { creativeBriefSchema } from "./schema";

// Skeleton component for loading state
function CreativeBriefsListingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      
      {/* List skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Skeleton className="h-5 w-48 flex-shrink-0" />
                <Skeleton className="h-4 w-32 flex-shrink-0" />
                <Skeleton className="h-4 w-24 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error component
function CreativeBriefsListingError({ error, onRetry }: { error: Error; onRetry: () => void }) {
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
      <h3 className="mb-2 text-lg font-semibold">Failed to load creative briefs</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || "An error occurred while fetching creative briefs."}
      </p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

// Empty state component
function CreativeBriefsEmptyState({ onCreateBrief }: { onCreateBrief?: () => void }) {
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold">No creative briefs found</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Get started by creating your first creative brief.
      </p>
      {onCreateBrief && (
        <Button onClick={onCreateBrief}>
          <Plus className="mr-2 h-4 w-4" />
          Create Brief
        </Button>
      )}
    </div>
  );
}

interface CreativeBriefsListingProps {
  data: z.infer<typeof creativeBriefSchema>[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCreateBrief?: () => void;
}

// Status badge helper
function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "DRAFT":
      return "secondary";
    case "REVIEWING":
      return "default";
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "REVIEWING":
      return "Reviewing";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

// Creative Brief Card Component (List View)
function CreativeBriefCard({
  data,
  onEdit,
  onDelete,
  className,
}: {
  data: z.infer<typeof creativeBriefSchema>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(data.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data.id);
    }
  };

  const handleCardClick = () => {
    // Open edit dialog when card is clicked
    if (onEdit) {
      onEdit(data.id);
    }
  };

  // Format timeline
  const formatTimeline = () => {
    if (!data.timelineStartDate || !data.timelineEndDate) {
      return "Not set";
    }
    const start = format(data.timelineStartDate, "MMM dd, yyyy");
    const end = format(data.timelineEndDate, "MMM dd, yyyy");
    return `${start} - ${end}`;
  };

  // Format submitted date
  const formatSubmitted = () => {
    return format(data.createdAt, "MMM dd, yyyy");
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md hover:border-primary/50", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Top row with status and actions */}
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={getStatusBadgeVariant(data.status)}>
              {getStatusText(data.status)}
            </Badge>
            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit creative brief</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete creative brief (this action cannot be reversed)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* List view columns */}
        <div className="flex items-center gap-6">
          {/* Brief Name Column - Fixed width with ellipsis */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" title={data.name}>
              {data.name}
            </p>
          </div>

          {/* Timeline Column */}
          <div className="w-64 flex-shrink-0">
            <p className="text-sm text-muted-foreground">{formatTimeline()}</p>
          </div>

          {/* Submitted Column */}
          <div className="w-32 flex-shrink-0">
            <p className="text-sm text-muted-foreground">{formatSubmitted()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CreativeBriefsListing({
  data,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  onEdit,
  onDelete,
  onCreateBrief,
}: CreativeBriefsListingProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }
    const query = searchQuery.toLowerCase();
    return data.filter((brief) =>
      brief.name.toLowerCase().includes(query) ||
      brief.background.toLowerCase().includes(query) ||
      brief.objectives.toLowerCase().includes(query) ||
      brief.requirements.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  if (isLoading) {
    return <CreativeBriefsListingSkeleton />;
  }

  if (isError) {
    return <CreativeBriefsListingError error={error!} onRetry={onRetry!} />;
  }

  return (
    <div className="space-y-4">
      {/* Header with search and create button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search briefs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {onCreateBrief && (
          <Button size="sm" onClick={onCreateBrief}>
            <Plus className="mr-2 h-4 w-4" />
            Create Brief
          </Button>
        )}
      </div>

      {/* List view cards */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            {filteredData.length > 0 ? (
              <div className="space-y-2">
                {filteredData.map((brief) => (
                  <CreativeBriefCard
                    key={brief.id}
                    data={brief}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            ) : (
              <CreativeBriefsEmptyState onCreateBrief={onCreateBrief} />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
