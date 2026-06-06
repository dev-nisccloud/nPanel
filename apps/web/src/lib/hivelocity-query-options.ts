/** Shared React Query options for Hivelocity plan listing pages. */
export const HIVELOCITY_PLANS_QUERY_OPTIONS = {
	staleTime: 5 * 60 * 1000,
	gcTime: 15 * 60 * 1000,
	refetchOnWindowFocus: false,
} as const;

export const HIVELOCITY_FACILITIES_QUERY_OPTIONS = {
	staleTime: 30 * 60 * 1000,
	gcTime: 60 * 60 * 1000,
	refetchOnWindowFocus: false,
} as const;
