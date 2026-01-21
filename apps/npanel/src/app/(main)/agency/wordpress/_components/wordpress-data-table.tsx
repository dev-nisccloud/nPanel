"use client";

import * as React from "react";
import { Search, RefreshCw, Grid3X3, List, EllipsisVertical } from "lucide-react";
import { z } from "zod";
import Link from "next/link";

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

import { WordPressCardsList } from "./wordpress-cards";
import { wordpressInstallationSchema } from "./schema";
import { useWordPressInstances } from "./use-wordpress-instances";

// Loading skeleton component
function WordPressTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:justify-between">
        <div className="flex flex-col gap-4 @sm/main:flex-row @sm/main:items-center @sm/main:flex-1">
          <Skeleton className="h-10 flex-1 @sm/main:max-w-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2 @sm/main:flex-nowrap">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4">
                  {/* Card header skeleton */}
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="h-5 w-32 flex-1" />
                    <Skeleton className="h-6 w-16 ml-2" />
                  </div>
                  {/* Card content skeleton */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
              ))}
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
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

export function WordPressDataTable() {
  const { data: wordpressData, isLoading, isError, error, refetch } = useWordPressInstances();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"card" | "table">("table");

  const filteredData = React.useMemo(() => {
    if (!wordpressData) return [];

    if (searchTerm.trim()) {
      return wordpressData.filter((item) =>
        (item.displayTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.domain?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.url || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return wordpressData;
  }, [wordpressData, searchTerm]);

  const handleEdit = (id: number | undefined) => {
    console.log("Edit WordPress installation:", id);
    // TODO: Implement edit functionality
  };

  const handleDelete = (id: number | undefined) => {
    console.log("Delete WordPress installation:", id);
    // TODO: Implement delete functionality
  };

  const handleCopy = (data: z.infer<typeof wordpressInstallationSchema>) => {
    console.log("Copy WordPress installation settings:", data);
    // TODO: Implement copy functionality
  };

  const handleSettings = (id: number | undefined) => {
    console.log("Open WordPress installation settings:", id);
    // TODO: Implement settings functionality
  };

  const getStatusBadge = (item: z.infer<typeof wordpressInstallationSchema>) => {
    if (item.status?.infected) {
      return <Badge variant="destructive">Infected</Badge>;
    }
    if (item.status?.unsupported) {
      return <Badge variant="secondary">Unsupported</Badge>;
    }
    if (item.status?.alive) {
      return <Badge variant="default">Online</Badge>;
    }
    return <Badge variant="secondary">Offline</Badge>;
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

  const TableView = () => (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Site</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Security</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No WordPress installations found
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="pl-6">
                  <Link 
                    href={`/agency/wordpress/${item.id}`}
                    className="font-medium text-primary hover:underline"
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
                              <Link href={`/agency/wordpress/${item.id}`}>View details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(item.id)}>
                              Edit installation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(item.id)} variant="destructive">
                              Delete
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
    <WordPressCardsList
      data={filteredData}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCopy={handleCopy}
      onSettings={handleSettings}
      cols={3}
    />
  );

  return (
    <div className="space-y-4">
      {/* Header with search and view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
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
