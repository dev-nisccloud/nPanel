"use client";

import * as React from "react";
import { Search, Globe, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { TldCard } from "./_components/tld-card";
import { TldCardSkeleton } from "./_components/tld-card-skeleton";
import { TldDetailsSheet } from "./_components/tld-details-sheet";
import type { OpenproviderTld } from "@/types/openprovider";

export default function TldsPage() {
  // Hooks at top level for performance
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTld, setSelectedTld] = React.useState<OpenproviderTld | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  
  // Allow fetching all TLDs - rate limits only occur on rapid successive requests
  const [limit] = React.useState(2500); // Max limit to get all TLDs
  const [offset] = React.useState(0);

  // Fetch TLDs from OpenProvider
  const {
    data: tldsData,
    isLoading,
    error,
    refetch,
  } = trpc.openProvider.tlds.getTlds.useQuery(
    {
      limit,
      offset,
      status: "ACT",
      with_price: true,
      with_description: false, // Disable description to reduce payload size
      with_restrictions: false, // Disable restrictions to reduce payload size
    },
    {
      placeholderData: (previousData) => previousData,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't auto-refetch on mount if we have cached data
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes - prevents rapid refetches
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      retry: (failureCount, error: any) => {
        // Check if it's a rate limit error (429 or error code 299)
        const isRateLimit = 
          error?.data?.code === "TIMEOUT" ||
          error?.data?.httpStatus === 429 ||
          error?.message?.includes("429") ||
          error?.message?.includes("rate limit") ||
          error?.message?.includes("OpenProvider API Error 299");
        
        // Don't retry rate limit errors immediately - they need exponential backoff
        if (isRateLimit) {
          return failureCount < 2; // Only retry twice for rate limits
        }
        
        // Don't retry on 4xx errors (client errors) except rate limits
        if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
          return false;
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex, error: any) => {
        // Check if it's a rate limit error
        const isRateLimit = 
          error?.data?.code === "TIMEOUT" ||
          error?.data?.httpStatus === 429 ||
          error?.message?.includes("429") ||
          error?.message?.includes("rate limit") ||
          error?.message?.includes("OpenProvider API Error 299");
        
        if (isRateLimit) {
          // Exponential backoff for rate limits: 5s, 10s
          return Math.min(5000 * Math.pow(2, attemptIndex), 30000);
        }
        
        // Standard exponential backoff for other errors
        return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
      },
    }
  );

  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleTldClick = React.useCallback((tld: OpenproviderTld) => {
    setSelectedTld(tld);
    setIsSheetOpen(true);
  }, []);

  const handleSheetOpenChange = React.useCallback((open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      // Clear selected TLD when sheet closes
      setSelectedTld(null);
    }
  }, []);

  // Filter TLDs based on search query
  const filteredTlds = React.useMemo(() => {
    const tlds = tldsData?.data?.results || [];
    if (!searchQuery.trim()) return tlds;

    const query = searchQuery.toLowerCase().trim();
    return tlds.filter((tld) => {
      return (
        tld.name.toLowerCase().includes(query) ||
        (tld.prices?.create_price?.reseller?.price &&
          tld.prices.create_price.reseller.price.toString().includes(query))
      );
    });
  }, [tldsData?.data?.results, searchQuery]);

  // Check if error is rate limit related
  const isRateLimitError = error && (
    error.data?.code === "TIMEOUT" ||
    error.data?.httpStatus === 429 ||
    error.message?.includes("429") ||
    error.message?.includes("rate limit") ||
    error.message?.includes("OpenProvider API Error 299")
  );

  // Show error state
  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <Alert variant={isRateLimitError ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isRateLimitError ? (
              <>
                Rate limit exceeded. You've made too many requests in a short time. 
                Please wait a moment before refreshing again.
              </>
            ) : (
              error.message || "Failed to load TLDs"
            )}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? "Retrying..." : "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  const tlds = tldsData?.data?.results || [];

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">TLDs</h1>
        <p className="text-muted-foreground">
          Browse and search available top-level domains (TLDs) with pricing and
          registration information.
        </p>
      </div>

      {/* Search Box and Refresh Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search TLDs by name (e.g., .com, .net)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          title="Refresh TLDs"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Content */}
      {isLoading && !tldsData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <TldCardSkeleton key={index} />
          ))}
        </div>
      ) : !tlds || tlds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">No TLDs found</p>
          <p className="text-muted-foreground">
            Unable to load TLDs. Please try again later.
          </p>
        </div>
      ) : filteredTlds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">No TLDs found</p>
          <p className="text-muted-foreground mb-4">
            No TLDs match your search query "{searchQuery}".
          </p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear Search
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredTlds.map((tld, index) => (
              <TldCard
                key={`${tld.name}-${index}`}
                tld={tld}
                onClick={() => handleTldClick(tld)}
              />
            ))}
          </div>
          {tldsData?.meta && (
            <div className="text-center text-sm text-muted-foreground">
              {tldsData.meta.total > filteredTlds.length ? (
                <>Showing {filteredTlds.length} of {tldsData.meta.total} TLDs</>
              ) : (
                <>Showing all {filteredTlds.length} TLDs</>
              )}
            </div>
          )}
        </>
      )}

      {/* TLD Details Sheet */}
      <TldDetailsSheet
        open={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
        tld={selectedTld}
      />
    </div>
  );
}
