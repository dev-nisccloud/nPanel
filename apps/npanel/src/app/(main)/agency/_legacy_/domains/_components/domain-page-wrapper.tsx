"use client";

import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { DomainDataTable } from './domain-data-table';

// This component uses TanStack Query to fetch domain data (which handles auth internally)
export function DomainPageWrapper() {
  const {
    data: domainData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      // Fetch domains in batches to get all 2025
      const allResults = [];
      let offset = 0;
      const limit = 1000; // Maximum per request
      
      while (true) {
        const response = await fetch(`/api/openprovider/tlds?limit=${limit}&offset=${offset}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch domain data');
        }
        
        const data = await response.json();
        allResults.push(...data.data.results);
        
        // If we got fewer results than requested, we've reached the end
        if (data.data.results.length < limit) {
          break;
        }
        
        offset += limit;
      }
      
      return {
        success: true,
        data: {
          results: allResults,
          total: allResults.length,
          limit: allResults.length,
          offset: 0
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Loading Domain Data</h3>
            <p className="text-muted-foreground">
              Fetching domain information from Openprovider...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 text-red-600">Failed to Load Domain Data</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => refetch()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4 mr-2 inline" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!domainData?.data?.results) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Domain Data</h3>
          <p className="text-muted-foreground mb-4">
            No domain data was returned from the server.
          </p>
        </div>
      </div>
    );
  }

  return <DomainDataTable domainData={domainData.data} />;
}
