"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  SearchableCleanList,
  type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { cn } from "@/lib/utils";

export const HOSTING_STATUS_ACTIVE_BADGE_CLASS =
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";

export type HostingSubscriptionListItem = SearchableCleanListItem;

export function HostingSubscriptionsList({
  items,
  searchQuery,
  onSearchChange,
  totalCount,
  toolbarActions,
  emptyMessage = "No subscriptions found",
  isLoading,
  isError,
  error,
  onRetry,
  searchPlaceholder = "Search subscriptions...",
}: {
  items: HostingSubscriptionListItem[];
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
      errorTitle="Failed to load subscriptions"
    />
  );
}

export function HostingStatusBadge({
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
      className={cn(isActive && HOSTING_STATUS_ACTIVE_BADGE_CLASS, className)}
    >
      {label}
    </Badge>
  );
}
