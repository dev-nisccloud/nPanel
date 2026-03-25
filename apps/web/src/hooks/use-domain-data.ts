// TanStack Query hooks for domain data management
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { DomainQueryParams, DomainTableRow, DomainTableState } from '@/types/domain';
import { fetchDomains, processDomainData, getAuthToken, setAuthToken, clearAuthToken } from '@/lib/domain-api';

// Query keys for consistent caching
export const domainQueryKeys = {
  all: ['domains'] as const,
  lists: () => [...domainQueryKeys.all, 'list'] as const,
  list: (params: DomainQueryParams) => [...domainQueryKeys.lists(), params] as const,
  infinite: () => [...domainQueryKeys.all, 'infinite'] as const,
  infiniteList: (params: DomainQueryParams) => [...domainQueryKeys.infinite(), params] as const,
  auth: () => [...domainQueryKeys.all, 'auth'] as const,
};

// Default query options
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors (client errors)
    if (error?.code >= 400 && error?.code < 500) return false;
    // Retry up to 3 times for other errors
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

/**
 * Hook for fetching domains with pagination
 */
export function useDomains(params: DomainQueryParams = {}) {
  const authToken = getAuthToken();
  
  return useQuery({
    queryKey: domainQueryKeys.list(params),
    queryFn: async () => {
      const response = await fetchDomains(params, authToken || undefined);
      return {
        domains: processDomainData(response.data.results, params),
        total: response.data.total,
        cached: response.cached,
        fetchedAt: response.fetched_at || response.cached_at,
      };
    },
    enabled: !!authToken, // Only run if we have auth token
    ...defaultQueryOptions,
  });
}

/**
 * Hook for infinite scrolling domains (for large datasets)
 */
export function useInfiniteDomains(params: DomainQueryParams = {}) {
  const authToken = getAuthToken();
  
  return useInfiniteQuery({
    queryKey: domainQueryKeys.infiniteList(params),
    queryFn: async ({ pageParam = 0 }) => {
      const queryParams = {
        ...params,
        offset: pageParam as number,
        limit: params.limit || 50,
      };
      
      const response = await fetchDomains(queryParams, authToken || undefined);
      return {
        domains: processDomainData(response.data.results, queryParams),
        total: response.data.total,
        hasMore: ((pageParam as number) + (queryParams.limit || 50)) < response.data.total,
        nextOffset: (pageParam as number) + (queryParams.limit || 50),
      };
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    initialPageParam: 0,
    enabled: !!authToken,
    ...defaultQueryOptions,
  });
}

/**
 * Hook for domain data with table state integration
 */
export function useDomainTableData(tableState: DomainTableState, params: DomainQueryParams = {}) {
  const authToken = getAuthToken();
  
  // Calculate server-side pagination
  const serverParams: DomainQueryParams = {
    ...params,
    limit: tableState.pagination.pageSize,
    offset: tableState.pagination.pageIndex * tableState.pagination.pageSize,
  };
  
  // Add sorting
  if (tableState.sorting.length > 0) {
    const sort = tableState.sorting[0];
    serverParams.sortBy = sort.id as any;
    serverParams.sortDirection = sort.desc ? 'desc' : 'asc';
  }
  
  // Add global filter as search
  if (tableState.globalFilter) {
    serverParams.search = tableState.globalFilter;
  }
  
  return useQuery({
    queryKey: domainQueryKeys.list(serverParams),
    queryFn: async () => {
      const response = await fetchDomains(serverParams, authToken || undefined);
      return {
        domains: processDomainData(response.data.results, serverParams),
        total: response.data.total,
        pageCount: Math.ceil(response.data.total / tableState.pagination.pageSize),
        cached: response.cached,
        fetchedAt: response.fetched_at || response.cached_at,
      };
    },
    enabled: !!authToken,
    ...defaultQueryOptions,
  });
}

/**
 * Hook for domain search with debouncing
 */
export function useDomainSearch(searchTerm: string, params: DomainQueryParams = {}) {
  const authToken = getAuthToken();
  
  return useQuery({
    queryKey: domainQueryKeys.list({ ...params, search: searchTerm }),
    queryFn: async () => {
      const response = await fetchDomains(
        { ...params, search: searchTerm },
        authToken || undefined
      );
      return {
        domains: processDomainData(response.data.results, { ...params, search: searchTerm }),
        total: response.data.total,
        cached: response.cached,
      };
    },
    enabled: !!authToken && searchTerm.length >= 2, // Only search with 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 10 * 60 * 1000,
    retry: (failureCount: number, error: any) => {
      if (error?.code >= 400 && error?.code < 500) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for authentication management
 */
export function useDomainAuth() {
  const queryClient = useQueryClient();
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; ip?: string }) => {
      const response = await fetch('/api/openprovider/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Authentication failed');
      }
      
      const data = await response.json();
      setAuthToken(data.data.token);
      return data.data;
    },
    onSuccess: () => {
      // Invalidate all domain queries to refetch with new auth
      queryClient.invalidateQueries({ queryKey: domainQueryKeys.all });
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      clearAuthToken();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
  
  const isAuthenticated = !!getAuthToken();
  
  return {
    isAuthenticated,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}

/**
 * Hook for prefetching domain data
 */
export function usePrefetchDomains() {
  const queryClient = useQueryClient();
  
  const prefetchDomains = useCallback(
    (params: DomainQueryParams) => {
      queryClient.prefetchQuery({
        queryKey: domainQueryKeys.list(params),
        queryFn: async () => {
          const authToken = getAuthToken();
          const response = await fetchDomains(params, authToken || undefined);
          return {
            domains: processDomainData(response.data.results, params),
            total: response.data.total,
            cached: response.cached,
          };
        },
        ...defaultQueryOptions,
      });
    },
    [queryClient]
  );
  
  return { prefetchDomains };
}

/**
 * Hook for optimistic updates (for future use)
 */
export function useOptimisticDomainUpdate() {
  const queryClient = useQueryClient();
  
  const updateDomain = useMutation({
    mutationFn: async (updates: Partial<DomainTableRow>) => {
      // This would be implemented when we have domain update endpoints
      throw new Error('Domain updates not yet implemented');
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: domainQueryKeys.all });
      
      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: domainQueryKeys.all });
      
      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: domainQueryKeys.all },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            domains: old.domains.map((domain: DomainTableRow) =>
              domain.id === updates.id ? { ...domain, ...updates } : domain
            ),
          };
        }
      );
      
      return { previousData };
    },
    onError: (err, updates, context) => {
      // Revert on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: domainQueryKeys.all });
    },
  });
  
  return { updateDomain };
}
