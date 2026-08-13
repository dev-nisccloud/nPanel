"use client";

import * as React from "react";
import { useLocation, Link } from "react-router";
import { Search, Plus, RefreshCw, Eye } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CleanList, CleanListRow } from "@/components/ui/clean-list";
import { VisitSiteButton } from "@/components/ui/list-row-actions";

import { wordpressInstallationSchema } from "@/routes/$slug.wordpress/_components/schema";
import { useWordPressInstances } from "@/routes/$slug.wordpress/_components/use-wordpress-instances";

function WordPressTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </div>
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WordPressTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <h3 className="text-lg font-semibold text-destructive">Error Loading WordPress Instances</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {error.message || "An unexpected error occurred while fetching WordPress instances."}
      </p>
      <Button onClick={onRetry} className="mt-4">
        Try Again
      </Button>
    </div>
  );
}

interface WordPressInstancesTableProps {
  domainName: string;
  hostingData?: unknown;
  onInstallClick?: () => void;
}

export function WordPressInstancesTable({ domainName, onInstallClick }: WordPressInstancesTableProps) {
  const { pathname } = useLocation();
  const isAgency = pathname.startsWith("/agency");
  const teamSlug = pathname.split("/")[1] ?? "";
  const detailBasePath = isAgency
    ? "/agency/wordpress"
    : teamSlug
      ? `/${teamSlug}/wordpress`
      : "/agency/wordpress";

  const { data: wordpressData, isLoading, isError, error, refetch } = useWordPressInstances();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredData = React.useMemo(() => {
    if (!wordpressData) return [];

    const domainFiltered = wordpressData.filter((item) => {
      const itemDomain = item.domain?.name || "";
      const itemUrl = item.url || "";

      return (
        itemDomain === domainName ||
        itemDomain.endsWith(`.${domainName}`) ||
        itemUrl.includes(domainName)
      );
    });

    if (searchTerm.trim()) {
      return domainFiltered.filter((item) =>
        (item.displayTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.domain?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.url || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return domainFiltered;
  }, [wordpressData, domainName, searchTerm]);

  const getStatusBadge = (item: z.infer<typeof wordpressInstallationSchema>) => {
    const isActive = item.status?.alive && !item.status?.infected && !item.status?.unsupported;
    if (isActive) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
        >
          Active
        </Badge>
      );
    }
    return <Badge variant="destructive">Suspended</Badge>;
  };

  const getSecurityLabel = (item: z.infer<typeof wordpressInstallationSchema>) => {
    const securityStatus = item.features?.security?.status;
    return securityStatus === "secureRecommended" ? "Secure" : "Needs Attention";
  };

  if (isLoading) {
    return <WordPressTableSkeleton />;
  }

  if (isError) {
    return <WordPressTableError error={error as Error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search WordPress installations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm ? (
            <Badge variant="outline" className="text-muted-foreground">
              {filteredData.length} of {wordpressData?.length || 0}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            title="Refresh WordPress instances"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          {onInstallClick ? (
            <Button onClick={onInstallClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Install WordPress
            </Button>
          ) : null}
        </div>
      </div>

      <CleanList emptyMessage={`No WordPress installations found for ${domainName}`}>
        {filteredData.map((item) => {
          const href = `${detailBasePath}/${item.id}`;
          const title = item.displayTitle || item.title || `Installation ${item.id}`;

          return (
            <CleanListRow
              key={item.id}
              title={
                <Link to={href} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                  {title}
                </Link>
              }
              description={
                <span className="block truncate">
                  {`${item.domain?.name || domainName} · v${item.version || "Unknown"} · ${getSecurityLabel(item)}`}
                </span>
              }
              trailing={getStatusBadge(item)}
              onClick={() => {
                if (item.id) {
                  window.location.href = href;
                }
              }}
              actions={
                <>
                  <VisitSiteButton url={item.url || item.domain?.name} />
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2.5 text-xs" asChild>
                    <Link to={href}>
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Link>
                  </Button>
                </>
              }
            />
          );
        })}
      </CleanList>
    </div>
  );
}
