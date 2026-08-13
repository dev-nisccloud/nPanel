"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CleanList, CleanListRow } from "@/components/ui/clean-list";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export type SearchableCleanListItem = {
  key: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
};

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-full max-w-sm" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </div>
            <Skeleton className="h-7 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ListError({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

export function SearchableCleanList({
  items,
  searchQuery,
  onSearchChange,
  totalCount,
  toolbarActions,
  emptyMessage = "Nothing to show.",
  isLoading,
  isError,
  error,
  onRetry,
  searchPlaceholder = "Search...",
  errorTitle = "Failed to load",
}: {
  items: SearchableCleanListItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  totalCount: number;
  toolbarActions?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  searchPlaceholder?: string;
  errorTitle?: string;
}) {
  if (isLoading) {
    return <ListSkeleton />;
  }

  if (isError) {
    return (
      <ListError
        title={errorTitle}
        error={(error as Error) ?? new Error("Unknown error")}
        onRetry={() => onRetry?.()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 @sm/main:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery ? (
            <Badge variant="outline" className="shrink-0 text-muted-foreground">
              {items.length} of {totalCount}
            </Badge>
          ) : null}
        </div>
        {toolbarActions ? (
          <div className="flex flex-wrap items-center gap-2">{toolbarActions}</div>
        ) : null}
      </div>

      <CleanList emptyMessage={emptyMessage}>
        {items.map((item) => (
          <CleanListRow
            key={item.key}
            title={item.title}
            description={item.description}
            trailing={item.trailing}
            actions={item.actions}
            onClick={item.onClick}
          />
        ))}
      </CleanList>
    </div>
  );
}
