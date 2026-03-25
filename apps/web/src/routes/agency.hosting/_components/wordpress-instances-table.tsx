"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { z } from "zod";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { wordpressInstallationSchema } from "../../agency.wordpress/_components/schema";
import { useWordPressInstances } from "../../agency.wordpress/_components/use-wordpress-instances";
import { Plus, RefreshCw } from "lucide-react";

// Loading skeleton component
function WordPressTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Site</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Security</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="pl-6">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Error component
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
  hostingData?: any; // Will be properly typed
  onInstallClick?: () => void;
}

export function WordPressInstancesTable({ domainName, onInstallClick }: WordPressInstancesTableProps) {
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

  // Filter WordPress instances by domain name (including subdomains)
  const filteredData = React.useMemo(() => {
    if (!wordpressData) return [];

    // Filter by domain name - check if the domain name matches or is a subdomain
    const domainFiltered = wordpressData.filter((item) => {
      const itemDomain = item.domain?.name || "";
      const itemUrl = item.url || "";
      
      // Check if domain matches exactly or is a subdomain
      // e.g., if domainName is "example.com", match "example.com", "www.example.com", "blog.example.com", etc.
      const domainMatch = itemDomain === domainName || 
                         itemDomain.endsWith(`.${domainName}`) ||
                         itemUrl.includes(domainName);
      
      return domainMatch;
    });

    // Apply search filter if provided
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
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
          Active
        </Badge>
      );
    }
    return <Badge variant="destructive">Suspended</Badge>;
  };

  const getSecurityBadge = (item: z.infer<typeof wordpressInstallationSchema>) => {
    const securityStatus = item.features?.security?.status;
    if (securityStatus === "secureRecommended") {
      return <Badge variant="default">Secure</Badge>;
    }
    return <Badge variant="secondary">Needs Attention</Badge>;
  };

  if (isLoading) {
    return <WordPressTableSkeleton />;
  }

  if (isError) {
    return <WordPressTableError error={error as Error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      {/* Header with search and install button */}
      <div className="flex items-center justify-between">
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
          {searchTerm && (
            <Badge variant="outline" className="text-muted-foreground">
              {filteredData.length} of {wordpressData?.length || 0}
            </Badge>
          )}
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
          {onInstallClick && (
            <Button onClick={onInstallClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Install WordPress
            </Button>
          )}
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Site</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Security</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No WordPress installations found for {domainName}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => {
                    if (item.id) {
                      window.location.href = `/agency/wordpress/${item.id}`;
                    }
                  }}
                >
                  <TableCell className="pl-6">
                    <Link 
                      href={`/agency/wordpress/${item.id}`}
                      className="font-medium text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.displayTitle || item.title || `Installation ${item.id}`}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-muted-foreground">
                      {item.version || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.title || "—"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item)}
                  </TableCell>
                  <TableCell>
                    {getSecurityBadge(item)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
