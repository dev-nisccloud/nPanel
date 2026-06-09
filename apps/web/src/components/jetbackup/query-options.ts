export const jetbackupQueryOptions = {
  staleTime: 5 * 60 * 1000,
  gcTime: 15 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: (failureCount: number, error: { data?: { code?: string } }) => {
    const code = error?.data?.code;
    if (code === "UNAUTHORIZED" || code === "TOO_MANY_REQUESTS" || code === "SERVICE_UNAVAILABLE") {
      return false;
    }
    return failureCount < 2;
  },
  retryDelay: (attemptIndex: number) => Math.min(3000 * (attemptIndex + 1), 30000),
} as const;
