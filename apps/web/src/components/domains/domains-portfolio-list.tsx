"use client";

import * as React from "react";
import { Globe } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  SearchableCleanList,
  type CleanListColumn,
  type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { cn } from "@/lib/utils";

export type DomainsPortfolioListItem = SearchableCleanListItem;

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  EXPIRED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  SUSPENDED: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
  TRANSFERRING: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PENDING: "secondary",
  EXPIRED: "destructive",
  SUSPENDED: "outline",
  TRANSFERRING: "secondary",
  UPGRADED: "secondary",
  DOWNGRADED: "secondary",
};

export function DomainStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const upper = String(status).toUpperCase();
  return (
    <Badge
      variant={STATUS_VARIANTS[upper] || "secondary"}
      className={cn("text-xs", STATUS_COLORS[upper], className)}
    >
      {upper}
    </Badge>
  );
}

export function DomainSourceBadge({
  source,
}: {
  source: "openprovider" | "kenic";
}) {
  if (source === "kenic") {
    return (
      <Badge
        variant="outline"
        className="text-xs border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-400"
        title="KC"
      >
        KC
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-xs border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400"
      title="OP"
    >
      OP
    </Badge>
  );
}

export function DomainsPortfolioList({
  items,
  searchQuery,
  onSearchChange,
  totalCount,
  toolbarActions,
  emptyMessage = "No domains found",
  isLoading,
  isError,
  error,
  onRetry,
  searchPlaceholder = "Search domains...",
  columns,
}: {
  items: DomainsPortfolioListItem[];
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
      errorTitle="Failed to load domains"
      columns={columns}
    />
  );
}

export function DomainListTitle({
  domain,
  leading,
}: {
  domain: React.ReactNode;
  leading?: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {leading ?? <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className="truncate">{domain}</span>
    </span>
  );
}

export function formatDomainDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}
