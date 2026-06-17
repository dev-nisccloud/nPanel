"use client";

import * as React from "react";
import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { wpDetailLayout } from "@/components/wordpress/wp-detail-layout";

export function JetBackupPageShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className={wpDetailLayout.page}>
      <div className={wpDetailLayout.container}>
        <div className="flex flex-col gap-2 @sm/main:flex-row @sm/main:items-start @sm/main:justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function JetBackupStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function JetBackupToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  onRefresh,
  isRefreshing,
  actions,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  viewMode?: "card" | "table";
  onViewModeChange?: (mode: "card" | "table") => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actions?: React.ReactNode;
}) {
  const submitSearch = () => onSearchSubmit?.();

  return (
    <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
      <div className="flex flex-1 items-center gap-2 @sm/main:max-w-sm">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSearchSubmit) {
              e.preventDefault();
              submitSearch();
            }
          }}
          placeholder="Search accounts..."
        />
        {onSearchSubmit ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={submitSearch}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {onRefresh ? (
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function JetBackupErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {message ? <p className="mb-4 max-w-md text-sm text-muted-foreground">{message}</p> : null}
      {onRetry ? (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      ) : null}
    </div>
  );
}

export function JetBackupTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-6 py-4 last:border-b-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function JetBackupStatusBadge({ status }: { status: string | undefined }) {
  const normalized = (status ?? "").toLowerCase();
  const variant =
    normalized === "completed" || normalized === "running" || normalized === "active"
      ? "default"
      : normalized === "failed" || normalized === "critical"
        ? "destructive"
        : normalized === "pending" || normalized === "warning"
          ? "secondary"
          : "outline";

  return <Badge variant={variant}>{status ?? "Unknown"}</Badge>;
}
