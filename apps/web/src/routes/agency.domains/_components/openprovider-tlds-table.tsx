"use client";

import * as React from "react";
import { RefreshCw, Search } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

import { tldSchema } from "./schema";
import { TldCardsList } from "./tld-card";

// Global cache for TLDs data to persist across tab switches
let globalTldsCache: {
  data: z.infer<typeof tldSchema>[];
  timestamp: number;
  isLoading: boolean;
  error: Error | null;
} = {
  data: [],
  timestamp: 0,
  isLoading: false,
  error: null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Custom hook for batch fetching TLDs with OpenProvider-compliant rate limiting
function useTldsBatchFetch() {
  const [allData, setAllData] = React.useState<z.infer<typeof tldSchema>[]>(globalTldsCache.data);
  const [isLoading, setIsLoading] = React.useState(globalTldsCache.isLoading);
  const [error, setError] = React.useState<Error | null>(globalTldsCache.error);
  const [isRefetching, setIsRefetching] = React.useState(false);
  const [loadingProgress, setLoadingProgress] = React.useState({ current: 0, total: 0, message: '' });

  const utils = trpc.useUtils();

  const fetchAllTlds = React.useCallback(async (isRefresh = false) => {
    // Check if we have valid cached data and it's not a refresh
    const now = Date.now();
    const isCacheValid = globalTldsCache.data.length > 0 && 
                        (now - globalTldsCache.timestamp) < CACHE_DURATION;
    
    if (!isRefresh && isCacheValid) {
      // Use cached data
      setAllData(globalTldsCache.data);
      setIsLoading(false);
      setError(globalTldsCache.error);
      return;
    }

    try {
      if (isRefresh) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Update global cache loading state
      globalTldsCache.isLoading = true;
      
      // Optimized approach: Use larger batches with smart delays
      // OpenProvider allows 300 identical calls per 300 seconds
      // We'll use 2000 records per batch with 2-second delays = ~150 calls per 300 seconds (safe margin)
      let allTlds: any[] = [];
      let offset = 0;
      const batchSize = 850; // Larger batch size for speed
      let hasMore = true;
      let batchCount = 0;
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 3;
      
      // Estimate total batches (we'll update this as we go)
      let estimatedTotalBatches = 3; // Start with conservative estimate
      
      while (hasMore && consecutiveErrors < maxConsecutiveErrors) {
        batchCount++;
        
        // Update progress
        setLoadingProgress({
          current: batchCount,
          total: estimatedTotalBatches,
          message: `Fetching batch ${batchCount}... (${allTlds.length} TLDs loaded)`
        });
        
        try {
          const result = await utils.openProvider.tlds.getTlds.fetch({
            limit: batchSize,
            offset: offset,
            status: 'ACT',
            with_price: true,
            with_description: true,
            with_restrictions: true,
          });
          
          if (result.success && result.data?.results) {
            allTlds = [...allTlds, ...result.data.results];
            consecutiveErrors = 0; // Reset error counter on success
            
            // Update estimated total based on actual data
            if (result.data.total) {
              estimatedTotalBatches = Math.ceil(result.data.total / batchSize);
            }
            
            // Check if we got fewer results than requested (end of data)
            if (result.data.results.length < batchSize) {
              hasMore = false;
            } else {
              offset += batchSize;
              
              // Smart delay: 2 seconds between requests
              // This gives us ~150 requests per 300 seconds (well under 300 limit)
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } else {
            hasMore = false;
          }
        } catch (batchError: any) {
          consecutiveErrors++;
          
          // Handle OpenProvider-specific rate limiting errors
          const errorMessage = batchError?.message || '';
          const isRateLimit = errorMessage.includes('429') || 
                             errorMessage.includes('rate limit') || 
                             errorMessage.includes('Too Many Requests') ||
                             errorMessage.includes('OpenProvider API Error 299') ||
                             errorMessage.includes('Access denied') ||
                             errorMessage.includes('10005') ||
                             errorMessage.includes('4007');
          
          if (isRateLimit) {
            // Exponential backoff for rate limits
            const backoffDelay = Math.min(2000 * Math.pow(2, consecutiveErrors), 30000); // Max 30 seconds
            console.log(`OpenProvider rate limit hit on batch ${batchCount}, waiting ${backoffDelay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            
            // Retry the same batch (don't increment offset)
            continue;
          } else {
            // For non-rate-limit errors, stop fetching
            throw batchError;
          }
        }
      }
      
      if (consecutiveErrors >= maxConsecutiveErrors) {
        throw new Error('Too many consecutive rate limit errors. Please try again later.');
      }
      
      // Update local state and global cache
      setAllData(allTlds);
      globalTldsCache.data = allTlds;
      globalTldsCache.timestamp = Date.now();
      globalTldsCache.isLoading = false;
      globalTldsCache.error = null;
    } catch (err) {
      let errorMessage = 'Failed to fetch TLDs';
      
      if (err instanceof Error) {
        const message = err.message;
        
        // OpenProvider-specific error handling
        if (message.includes('429') || message.includes('rate limit') || message.includes('Too Many Requests')) {
          errorMessage = 'OpenProvider rate limit exceeded. Please wait 5 minutes before trying again.';
        } else if (message.includes('OpenProvider API Error 299') || message.includes('10005')) {
          errorMessage = 'OpenProvider API access denied due to excessive identical calls. Please wait 5 minutes.';
        } else if (message.includes('4007')) {
          errorMessage = 'OpenProvider API temporarily blocked due to excessive use. Please wait 5 minutes.';
        } else if (message.includes('Too many consecutive rate limit errors')) {
          errorMessage = 'Multiple rate limit errors encountered. Please wait 5 minutes before trying again.';
        } else {
          errorMessage = message;
        }
      }
      
      const errorObj = new Error(errorMessage);
      setError(errorObj);
      
      // Update global cache with error
      globalTldsCache.error = errorObj;
      globalTldsCache.isLoading = false;
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [utils]);

  React.useEffect(() => {
    fetchAllTlds();
  }, [fetchAllTlds]);

  const refetch = React.useCallback(() => {
    fetchAllTlds(true);
  }, [fetchAllTlds]);

  // Check if data is from cache
  const isFromCache = React.useMemo(() => {
    const now = Date.now();
    return globalTldsCache.data.length > 0 && 
           (now - globalTldsCache.timestamp) < CACHE_DURATION &&
           allData.length > 0;
  }, [allData]);

  return {
    data: allData,
    isLoading: isLoading || isRefetching,
    isRefetching,
    isError: !!error,
    error,
    refetch,
    loadingProgress,
    isFromCache,
  };
}

// Loading skeleton component with progress
function TldsTableSkeleton({ progress }: { progress?: { current: number; total: number; message: string } }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        {/* Progress indicator */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.message}</span>
              <span className="text-muted-foreground">
                {progress.current} / {progress.total} batches
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Cards skeleton */}
      <div className="min-h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6">
              {/* Card header skeleton */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Skeleton className="h-4 w-4 flex-shrink-0" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>

              {/* Card content skeleton */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>

              {/* Additional features skeleton */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OpenProviderTldsTable() {
  const [searchTerm, setSearchTerm] = React.useState("");

  // Use custom hook for batch fetching TLDs
  const { 
    data, 
    isLoading, 
    isRefetching,
    error, 
    refetch,
    loadingProgress,
    isFromCache
  } = useTldsBatchFetch();

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    return data.filter((tld) => 
      tld.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tld.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <TldsTableSkeleton progress={loadingProgress} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error.message || 'Failed to fetch TLDs'}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with controls */}
      <div className="flex flex-col gap-4">
        {/* Search and Refresh Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search TLDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {isFromCache && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                  Cached Data
                </span>
              )}
              <Button
                onClick={handleRefresh}
                disabled={isLoading || isRefetching}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Status:
              </Label>
              <Select defaultValue="all">
                <SelectTrigger id="status-filter" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ACT">Active</SelectItem>
                  <SelectItem value="INACT">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
                {/* Results count */}
                <div className="text-sm text-gray-600">
                  Showing {filteredData.length} of {data.length} TLDs
                  {searchTerm && (
                    <span className="ml-2 text-blue-600">
                      (filtered by "{searchTerm}")
                    </span>
                  )}
                </div>
      </div>

      {/* Cards */}
      <div className="min-h-[600px]">
        <TldCardsList data={filteredData} cols={4} />
      </div>
    </div>
  );
}
