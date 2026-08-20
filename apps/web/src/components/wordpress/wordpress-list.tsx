"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  SearchableCleanList,
  type CleanListColumn,
  type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { cn } from "@/lib/utils";

export const WORDPRESS_STATUS_ACTIVE_BADGE_CLASS =
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";

export type WordPressListItem = SearchableCleanListItem;

export function WordPressList({
  items,
  searchQuery,
  onSearchChange,
  totalCount,
  toolbarActions,
  emptyMessage = "No WordPress installations found",
  isLoading,
  isError,
  error,
  onRetry,
  searchPlaceholder = "Search WordPress...",
  errorTitle = "Failed to load WordPress",
  columns,
}: {
  items: WordPressListItem[];
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
  columns?: CleanListColumn[];
}) {
  return (
    <SearchableCleanList
      items={items}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      totalCount={totalCount}
      toolbarActions={toolbarActions}
      emptyMessage={emptyMessage}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={onRetry}
      searchPlaceholder={searchPlaceholder}
      errorTitle={errorTitle}
      columns={columns}
    />
  );
}

export function WordPressListStatusBadge({
  label,
  variant,
  isActive,
  className,
}: {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  isActive?: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant={variant}
      className={cn(isActive && WORDPRESS_STATUS_ACTIVE_BADGE_CLASS, className)}
    >
      {label}
    </Badge>
  );
}
